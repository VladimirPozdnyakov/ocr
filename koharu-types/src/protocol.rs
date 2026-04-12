use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{Document, FontPrediction, TextBlock, TextStyle};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct FontFaceInfo {
    pub family_name: String,
    pub post_script_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct MetaInfo {
    pub version: String,
    pub ml_device: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct DocumentSummary {
    pub id: String,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub revision: u64,
    pub has_segment: bool,
    pub text_block_count: usize,
}

impl From<&Document> for DocumentSummary {
    fn from(document: &Document) -> Self {
        Self {
            id: document.id.clone(),
            name: document.name.clone(),
            width: document.width,
            height: document.height,
            revision: document.revision,
            has_segment: document.segment.is_some(),
            text_block_count: document.text_blocks.len(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct TextBlockDetail {
    pub id: String,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub confidence: f32,
    pub line_polygons: Option<Vec<[[f32; 2]; 4]>>,
    pub source_direction: Option<crate::TextDirection>,
    pub rendered_direction: Option<crate::TextDirection>,
    pub rotation_deg: Option<f32>,
    pub detected_font_size_px: Option<f32>,
    pub detector: Option<String>,
    pub text: Option<String>,
    pub style: Option<TextStyle>,
    pub font_prediction: Option<FontPrediction>,
}

impl From<&TextBlock> for TextBlockDetail {
    fn from(block: &TextBlock) -> Self {
        Self {
            id: block.id.clone(),
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
            confidence: block.confidence,
            line_polygons: block.line_polygons.clone(),
            source_direction: block.source_direction,
            rendered_direction: block.rendered_direction,
            rotation_deg: block.rotation_deg,
            detected_font_size_px: block.detected_font_size_px,
            detector: block.detector.clone(),
            text: block.text.clone(),
            style: block.style.clone(),
            font_prediction: block.font_prediction.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct DocumentDetail {
    pub id: String,
    pub path: String,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub revision: u64,
    pub text_blocks: Vec<TextBlockDetail>,
}

impl From<&Document> for DocumentDetail {
    fn from(document: &Document) -> Self {
        Self {
            id: document.id.clone(),
            path: document.path.to_string_lossy().to_string(),
            name: document.name.clone(),
            width: document.width,
            height: document.height,
            revision: document.revision,
            text_blocks: document
                .text_blocks
                .iter()
                .map(TextBlockDetail::from)
                .collect(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct TextBlockPatch {
    pub text: Option<String>,
    pub x: Option<f32>,
    pub y: Option<f32>,
    pub width: Option<f32>,
    pub height: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct CreateTextBlock {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "snake_case")]
#[ts(export)]
pub enum ImportMode {
    Replace,
    Append,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct ImportResult {
    pub total_count: usize,
    pub documents: Vec<DocumentSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct ExportResult {
    pub count: usize,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "snake_case")]
#[ts(export)]
pub enum JobStatus {
    Running,
    Completed,
    Cancelled,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct JobState {
    pub id: String,
    pub kind: String,
    pub status: JobStatus,
    pub step: Option<String>,
    pub current_document: usize,
    pub total_documents: usize,
    pub current_step_index: usize,
    pub total_steps: usize,
    pub overall_percent: u8,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "snake_case")]
#[ts(export)]
pub enum TransferStatus {
    Started,
    Downloading,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct DownloadState {
    pub id: String,
    pub filename: String,
    pub downloaded: u64,
    pub total: Option<u64>,
    pub status: TransferStatus,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct SnapshotEvent {
    pub documents: Vec<DocumentSummary>,
    pub jobs: Vec<JobState>,
    pub downloads: Vec<DownloadState>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct DocumentsChangedEvent {
    pub documents: Vec<DocumentSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct DocumentChangedEvent {
    pub document_id: String,
    pub revision: u64,
    pub changed: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct ApiKeyValue {
    pub api_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct ApiKeyResponse {
    pub api_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct PipelineJobRequest {
    pub document_id: Option<String>,
}
