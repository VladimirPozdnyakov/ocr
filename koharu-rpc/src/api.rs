use std::{convert::Infallible, io::Cursor, time::Duration};

use anyhow::Context;
use async_stream::stream;
use axum::{
    Json, Router,
    body::Body,
    extract::{DefaultBodyLimit, Multipart, Path, Query, State},
    http::{
        HeaderValue, StatusCode,
        header::{CONTENT_DISPOSITION, CONTENT_TYPE},
    },
    response::{
        IntoResponse, Response,
        sse::{Event, KeepAlive, Sse},
    },
    routing::{delete, get, patch, post},
};
use image::ImageFormat;
use koharu_pipeline::{
    AppResources, operations,
    state_tx::{self, ChangedField},
};

use koharu_types::{
    CreateTextBlock, Document, DocumentDetail, DocumentSummary, FileEntry, IndexPayload, JobState,
    JobStatus, MetaInfo, OpenDocumentsPayload, PipelineJobRequest, SerializableDynamicImage,
    TextBlock, TextBlockDetail, TextBlockPatch,
};
use serde::Deserialize;

use crate::{
    events::{ApiEvent, EventHub},
    shared::{SharedResources, get_resources},
};

const MAX_BODY_SIZE: usize = 1024 * 1024 * 1024;

#[derive(Clone)]
pub struct ApiState {
    pub resources: SharedResources,
    pub events: EventHub,
    pub version: &'static str,
}

impl ApiState {
    fn resources(&self) -> ApiResult<AppResources> {
        get_resources(&self.resources).map_err(ApiError::service_unavailable)
    }
}

pub fn router(resources: SharedResources, events: EventHub, version: &'static str) -> Router {
    let state = ApiState {
        resources,
        events,
        version,
    };

    Router::new()
        .route("/meta", get(get_meta))
        .route("/documents", get(list_documents))
        .route("/documents/import", post(import_documents))
        .route("/documents/{document_id}", get(get_document))
        .route("/documents/{document_id}/thumbnail", get(get_thumbnail))
        .route(
            "/documents/{document_id}/layers/{layer}",
            get(get_document_layer),
        )
        .route("/documents/{document_id}/detect", post(detect_document))
        .route("/documents/{document_id}/ocr", post(ocr_document))
        .route(
            "/documents/{document_id}/text-blocks",
            post(create_text_block).put(update_text_blocks),
        )
        .route(
            "/documents/{document_id}/text-blocks/{text_block_id}",
            patch(patch_text_block).delete(delete_text_block),
        )
        .route(
            "/documents/{document_id}/text-blocks/{text_block_id}/ocr",
            post(ocr_text_block),
        )
        .route("/documents/{document_id}/export", get(export_document))
        .route("/jobs/pipeline", post(start_pipeline_job))
        .route("/jobs/{job_id}", delete(cancel_pipeline_job))
        .route("/events", get(events_stream))
        .layer(DefaultBodyLimit::max(MAX_BODY_SIZE))
        .with_state(state)
}

type ApiResult<T> = Result<T, ApiError>;

#[derive(Debug)]
pub struct ApiError {
    status: StatusCode,
    message: String,
}

impl ApiError {
    fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }

    fn bad_request(message: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_REQUEST, message)
    }

    fn not_found(message: impl Into<String>) -> Self {
        Self::new(StatusCode::NOT_FOUND, message)
    }

    fn service_unavailable(error: anyhow::Error) -> Self {
        Self::new(StatusCode::SERVICE_UNAVAILABLE, error.to_string())
    }

    fn internal(error: anyhow::Error) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, error.to_string())
    }
}

impl From<anyhow::Error> for ApiError {
    fn from(error: anyhow::Error) -> Self {
        let message = error.to_string();
        if message.contains("not found") || message.contains("out of range") {
            Self::not_found(message)
        } else {
            Self::bad_request(message)
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, self.message).into_response()
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImportQuery {
    mode: Option<koharu_types::ImportMode>,
}

async fn get_meta(State(state): State<ApiState>) -> Json<MetaInfo> {
    let version = state.version.to_string();
    match state.resources() {
        Ok(resources) => {
            let ml_device = operations::device(resources.clone())
                .await
                .map(|d| d.ml_device)
                .unwrap_or_else(|err| {
                    tracing::warn!(?err, "Failed to detect ML device");
                    String::new()
                });
            Json(MetaInfo {
                version,
                ml_device,
                models_ready: true,
            })
        }
        Err(_) => Json(MetaInfo {
            version,
            ml_device: String::new(),
            models_ready: false,
        }),
    }
}

async fn list_documents(State(state): State<ApiState>) -> ApiResult<Json<Vec<DocumentSummary>>> {
    let resources = state.resources()?;
    let documents = state_tx::list_docs(&resources.state)
        .await
        .iter()
        .map(DocumentSummary::from)
        .collect();
    Ok(Json(documents))
}

async fn get_document(
    State(state): State<ApiState>,
    Path(document_id): Path<String>,
) -> ApiResult<Json<DocumentDetail>> {
    let resources = state.resources()?;
    let (_, document) = find_document(&resources, &document_id).await?;
    Ok(Json(DocumentDetail::from(&document)))
}

async fn get_thumbnail(
    State(state): State<ApiState>,
    Path(document_id): Path<String>,
) -> ApiResult<Response> {
    let resources = state.resources()?;
    let (_, document) = find_document(&resources, &document_id).await?;
    let thumbnail = document.image.thumbnail(200, 200);
    let bytes = encode_webp(&thumbnail.into())?;
    Ok(binary_response(bytes, "image/webp", None))
}

async fn get_document_layer(
    State(state): State<ApiState>,
    Path((document_id, layer)): Path<(String, String)>,
) -> ApiResult<Response> {
    let resources = state.resources()?;
    let (_, document) = find_document(&resources, &document_id).await?;

    let image = match layer.as_str() {
        "original" => &document.image.0,
        "segment" => document
            .segment
            .as_ref()
            .map(|img| &img.0)
            .ok_or_else(|| ApiError::not_found("Segment layer not found"))?,
        _ => return Err(ApiError::not_found("Unknown layer")),
    };

    let mut cursor = Cursor::new(Vec::new());
    image
        .write_to(&mut cursor, ImageFormat::WebP)
        .with_context(|| "failed to encode image as webp")
        .map_err(ApiError::internal)?;

    Ok(binary_response(cursor.into_inner(), "image/webp", None))
}

async fn import_documents(
    State(state): State<ApiState>,
    Query(query): Query<ImportQuery>,
    mut multipart: Multipart,
) -> ApiResult<Json<koharu_types::ImportResult>> {
    let resources = state.resources()?;
    let mut files = Vec::new();

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|error| ApiError::bad_request(error.to_string()))?
    {
        let filename = field
            .file_name()
            .map(str::to_string)
            .unwrap_or_else(|| "upload.bin".to_string());

        // Validate file extension before reading the body.
        let ext = std::path::Path::new(&filename)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        if !ext.is_empty() && !koharu_types::is_supported_image_extension(ext) {
            return Err(ApiError::bad_request(format!(
                "Unsupported file format: {filename}. Supported formats: {}",
                koharu_types::SUPPORTED_EXTENSIONS.join(", ")
            )));
        }

        let data = field
            .bytes()
            .await
            .map_err(|error| ApiError::bad_request(error.to_string()))?;

        files.push(FileEntry {
            name: filename,
            data: data.to_vec(),
        });
    }

    if files.is_empty() {
        return Err(ApiError::bad_request("No files uploaded"));
    }

    let payload = OpenDocumentsPayload { files };
    match query.mode.unwrap_or(koharu_types::ImportMode::Replace) {
        koharu_types::ImportMode::Replace => {
            operations::open_documents(resources.clone(), payload).await?;
        }
        koharu_types::ImportMode::Append => {
            operations::add_documents(resources.clone(), payload).await?;
        }
    }

    let documents = state_tx::list_docs(&resources.state)
        .await
        .iter()
        .map(DocumentSummary::from)
        .collect::<Vec<_>>();

    Ok(Json(koharu_types::ImportResult {
        total_count: documents.len(),
        documents,
    }))
}

async fn detect_document(
    State(state): State<ApiState>,
    Path(document_id): Path<String>,
) -> ApiResult<StatusCode> {
    let resources = state.resources()?;
    let (index, _) = find_document(&resources, &document_id).await?;
    operations::detect(resources, IndexPayload { index }).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn ocr_document(
    State(state): State<ApiState>,
    Path(document_id): Path<String>,
) -> ApiResult<StatusCode> {
    let resources = state.resources()?;
    let (index, _) = find_document(&resources, &document_id).await?;
    operations::ocr(resources, IndexPayload { index }).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn create_text_block(
    State(state): State<ApiState>,
    Path(document_id): Path<String>,
    Json(request): Json<CreateTextBlock>,
) -> ApiResult<Json<TextBlockDetail>> {
    koharu_types::validate_text_block_geometry(request.x, request.y, request.width, request.height)
        .map_err(|e| ApiError::bad_request(e.to_string()))?;

    let resources = state.resources()?;
    let (index, document) = find_document(&resources, &document_id).await?;

    // Validate block fits within document bounds.
    if request.x + request.width > document.width as f32
        || request.y + request.height > document.height as f32
    {
        return Err(ApiError::bad_request(format!(
            "Text block ({}, {} + {}x{}) exceeds document bounds ({}x{})",
            request.x, request.y, request.width, request.height, document.width, document.height
        )));
    }

    let detail = state_tx::mutate_doc(
        &resources.state,
        index,
        &[ChangedField::TextBlocks],
        |document| {
            let mut block = TextBlock {
                x: request.x,
                y: request.y,
                width: request.width,
                height: request.height,
                confidence: 1.0,
                ..Default::default()
            };
            block.set_layout_seed(block.x, block.y, block.width, block.height);
            document.text_blocks.push(block);
            let block = document
                .text_blocks
                .last()
                .ok_or_else(|| anyhow::anyhow!("Failed to append text block"))?;
            Ok(TextBlockDetail::from(block))
        },
    )
    .await?;

    Ok(Json(detail))
}

async fn patch_text_block(
    State(state): State<ApiState>,
    Path((document_id, text_block_id)): Path<(String, String)>,
    Json(request): Json<TextBlockPatch>,
) -> ApiResult<Json<TextBlockDetail>> {
    let resources = state.resources()?;
    let (index, _) = find_document(&resources, &document_id).await?;

    let detail = state_tx::mutate_doc(
        &resources.state,
        index,
        &[ChangedField::TextBlocks],
        |document| {
            let block = document
                .text_blocks
                .iter_mut()
                .find(|block| block.id == text_block_id)
                .ok_or_else(|| anyhow::anyhow!("Text block not found: {text_block_id}"))?;
            apply_text_block_patch(block, request.clone());
            Ok(TextBlockDetail::from(&*block))
        },
    )
    .await?;

    Ok(Json(detail))
}

async fn update_text_blocks(
    State(state): State<ApiState>,
    Path(document_id): Path<String>,
    Json(blocks): Json<Vec<TextBlockDetail>>,
) -> ApiResult<StatusCode> {
    let resources = state.resources()?;
    let (index, _) = find_document(&resources, &document_id).await?;

    state_tx::mutate_doc(
        &resources.state,
        index,
        &[ChangedField::TextBlocks],
        |document| {
            document.text_blocks.clear();
            for block in blocks {
                let text_block = TextBlock {
                    id: block.id.clone(),
                    x: block.x,
                    y: block.y,
                    width: block.width,
                    height: block.height,
                    confidence: block.confidence,
                    line_polygons: match block.line_polygons {
                        Some(arr) => {
                            let polygons: Vec<_> = arr
                                .iter()
                                .filter_map(|poly| {
                                    poly.iter()
                                        .map(|pt| [pt[0], pt[1]])
                                        .collect::<Vec<_>>()
                                        .try_into()
                                        .ok()
                                })
                                .collect();
                            if polygons.is_empty() {
                                None
                            } else {
                                Some(polygons)
                            }
                        }
                        None => None,
                    },
                    source_direction: block.source_direction,
                    rendered_direction: None,
                    rotation_deg: block.rotation_deg,
                    detected_font_size_px: block.detected_font_size_px,
                    detector: block.detector,
                    text: block.text,
                    style: None,
                    font_prediction: block.font_prediction,
                    rendered: None,
                    lock_layout_box: false,
                    layout_seed_x: None,
                    layout_seed_y: None,
                    layout_seed_width: None,
                    layout_seed_height: None,
                };
                document.text_blocks.push(text_block);
            }
            Ok(())
        },
    )
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn delete_text_block(
    State(state): State<ApiState>,
    Path((document_id, text_block_id)): Path<(String, String)>,
) -> ApiResult<StatusCode> {
    let resources = state.resources()?;
    let (index, _) = find_document(&resources, &document_id).await?;

    state_tx::mutate_doc(
        &resources.state,
        index,
        &[ChangedField::TextBlocks],
        |document| {
            let block_index = document
                .text_blocks
                .iter()
                .position(|block| block.id == text_block_id)
                .ok_or_else(|| anyhow::anyhow!("Text block not found: {text_block_id}"))?;
            document.text_blocks.remove(block_index);
            Ok(())
        },
    )
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn ocr_text_block(
    State(state): State<ApiState>,
    Path((document_id, text_block_id)): Path<(String, String)>,
) -> ApiResult<StatusCode> {
    let resources = state.resources()?;
    let (doc_index, document) = find_document(&resources, &document_id).await?;

    let block_index = document
        .text_blocks
        .iter()
        .position(|block| block.id == text_block_id)
        .ok_or_else(|| ApiError::not_found(format!("Text block not found: {text_block_id}")))?;

    operations::ocr_text_block(resources, doc_index, block_index).await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn start_pipeline_job(
    State(state): State<ApiState>,
    Json(request): Json<PipelineJobRequest>,
) -> ApiResult<Json<JobState>> {
    let resources = state.resources()?;
    let index = if let Some(document_id) = request.document_id.as_deref() {
        Some(state_tx::find_doc_index(&resources.state, document_id).await?)
    } else {
        None
    };
    let total_documents = match index {
        Some(_) => 1,
        None => state_tx::list_docs(&resources.state).await.len(),
    };

    let job_id =
        operations::process(resources.clone(), koharu_types::ProcessRequest { index }).await?;

    let job = JobState {
        id: job_id,
        kind: "pipeline".to_string(),
        status: JobStatus::Running,
        step: None,
        current_document: 0,
        total_documents,
        current_step_index: 0,
        total_steps: koharu_types::PipelineStep::ALL.len(),
        overall_percent: 0,
        error: None,
    };
    state.events.publish_job(job.clone()).await;

    Ok(Json(job))
}

async fn cancel_pipeline_job(
    State(state): State<ApiState>,
    Path(job_id): Path<String>,
) -> ApiResult<StatusCode> {
    let resources = state.resources()?;
    let guard = resources.pipeline.read().await;
    let handle = guard
        .as_ref()
        .ok_or_else(|| ApiError::not_found("Pipeline job not found"))?;
    if handle.id != job_id {
        return Err(ApiError::not_found(format!(
            "Pipeline job not found: {job_id}"
        )));
    }
    handle
        .cancel
        .store(true, std::sync::atomic::Ordering::Relaxed);
    Ok(StatusCode::NO_CONTENT)
}

async fn export_document(
    State(state): State<ApiState>,
    Path(document_id): Path<String>,
) -> ApiResult<Response> {
    let resources = state.resources()?;
    let (_, document) = find_document(&resources, &document_id).await?;

    // Export OCR results as plain text
    let mut text = String::new();
    for (i, block) in document.text_blocks.iter().enumerate() {
        if let Some(ref block_text) = block.text {
            text.push_str(&format!("Block {}: {}\n", i + 1, block_text));
        }
    }

    let filename = format!("{}.txt", document.name);
    Ok(binary_response(
        text.into_bytes(),
        "text/plain",
        Some(filename),
    ))
}

async fn events_stream(
    State(state): State<ApiState>,
) -> ApiResult<Sse<impl futures::Stream<Item = Result<Event, Infallible>>>> {
    let snapshot = state.events.snapshot().await?;
    let mut rx = state.events.subscribe();

    let stream = stream! {
        yield Ok(sse_event("snapshot", &snapshot));
        loop {
            match rx.recv().await {
                Ok(event) => {
                    if let Some(event) = api_event_to_sse(event) {
                        yield Ok(event);
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
            }
        }
    };

    Ok(Sse::new(stream).keep_alive(
        KeepAlive::new()
            .interval(Duration::from_secs(15))
            .text("keep-alive"),
    ))
}

fn api_event_to_sse(event: ApiEvent) -> Option<Event> {
    match event {
        ApiEvent::DocumentsChanged(payload) => Some(sse_event("documents.changed", &payload)),
        ApiEvent::DocumentChanged(payload) => Some(sse_event("document.changed", &payload)),
        ApiEvent::JobChanged(payload) => Some(sse_event("job.changed", &payload)),
        ApiEvent::DownloadChanged(payload) => Some(sse_event("download.changed", &payload)),
    }
}

fn sse_event<T: serde::Serialize>(name: &str, payload: &T) -> Event {
    let data = serde_json::to_string(payload).unwrap_or_else(|_| "{}".to_string());
    Event::default().event(name).data(data)
}

async fn find_document(
    resources: &AppResources,
    document_id: &str,
) -> ApiResult<(usize, Document)> {
    let index = state_tx::find_doc_index(&resources.state, document_id)
        .await
        .map_err(ApiError::from)?;
    let document = state_tx::read_doc(&resources.state, index)
        .await
        .map_err(ApiError::from)?;
    Ok((index, document))
}

fn encode_webp(image: &SerializableDynamicImage) -> ApiResult<Vec<u8>> {
    let mut cursor = Cursor::new(Vec::new());
    image
        .0
        .write_to(&mut cursor, image::ImageFormat::WebP)
        .with_context(|| "failed to encode image as webp")
        .map_err(ApiError::internal)?;
    Ok(cursor.into_inner())
}

fn binary_response(data: Vec<u8>, content_type: &str, filename: Option<String>) -> Response {
    let mut response = Response::new(Body::from(data));
    response
        .headers_mut()
        .insert(CONTENT_TYPE, HeaderValue::from_str(content_type).unwrap());
    if let Some(filename) = filename
        && let Ok(value) = HeaderValue::from_str(&format!("attachment; filename=\"{filename}\""))
    {
        response.headers_mut().insert(CONTENT_DISPOSITION, value);
    }
    response
}

fn apply_text_block_patch(block: &mut TextBlock, patch: TextBlockPatch) {
    let previous_width = block.width;
    let previous_height = block.height;

    let pending_x = patch.x.unwrap_or(block.x);
    let pending_y = patch.y.unwrap_or(block.y);
    let pending_width = patch.width.unwrap_or(block.width);
    let pending_height = patch.height.unwrap_or(block.height);

    if let Err(err) = koharu_types::validate_text_block_geometry(
        pending_x,
        pending_y,
        pending_width,
        pending_height,
    ) {
        tracing::warn!(?err, "Rejecting text block patch with invalid geometry");
        return;
    }

    let mut geometry_changed = false;

    if let Some(x) = patch.x {
        if (block.x - x).abs() > f32::EPSILON {
            geometry_changed = true;
        }
        block.x = x;
    }
    if let Some(y) = patch.y {
        if (block.y - y).abs() > f32::EPSILON {
            geometry_changed = true;
        }
        block.y = y;
    }
    if let Some(width) = patch.width {
        if (block.width - width).abs() > f32::EPSILON {
            geometry_changed = true;
        }
        block.width = width;
    }
    if let Some(height) = patch.height {
        if (block.height - height).abs() > f32::EPSILON {
            geometry_changed = true;
        }
        block.height = height;
    }

    if geometry_changed {
        block.set_layout_seed(block.x, block.y, block.width, block.height);
    }
    if (previous_width - block.width).abs() > f32::EPSILON
        || (previous_height - block.height).abs() > f32::EPSILON
    {
        block.lock_layout_box = true;
    }
}

#[cfg(test)]
mod tests {
    use super::apply_text_block_patch;
    use koharu_types::{TextBlock, TextBlockPatch};

    #[test]
    fn text_block_patch_updates_geometry() {
        let mut block = TextBlock {
            width: 100.0,
            height: 50.0,
            ..Default::default()
        };

        apply_text_block_patch(
            &mut block,
            TextBlockPatch {
                text: None,
                x: Some(12.0),
                y: Some(24.0),
                width: Some(80.0),
                height: Some(40.0),
            },
        );

        assert_eq!(block.x, 12.0);
        assert_eq!(block.y, 24.0);
        assert_eq!(block.width, 80.0);
        assert_eq!(block.height, 40.0);
        assert!(block.lock_layout_box);
    }
}
