mod helpers;

use std::path::PathBuf;

use image::DynamicImage;
use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{
    CallToolResult, Content, ErrorData, Implementation, ServerCapabilities, ServerInfo,
    ToolsCapability,
};
use rmcp::{ServerHandler, tool, tool_handler, tool_router};

use koharu_pipeline::AppResources;
use koharu_pipeline::operations;
use koharu_types::commands::{
    AddTextBlockPayload, ExportDocumentParams, FileEntry, IndexPayload, OpenDocumentsParams,
    OpenDocumentsPayload, ProcessParams, ProcessRequest, RemoveTextBlockPayload,
    UpdateTextBlockPayload, ViewImageParams, ViewTextBlockParams,
};
use koharu_types::views::to_doc_info;

use crate::shared::SharedResources;

use helpers::encode_png_base64;

#[derive(Clone)]
pub struct KoharuMcp {
    pub shared: SharedResources,
    tool_router: ToolRouter<Self>,
}

impl KoharuMcp {
    pub fn new(shared: SharedResources) -> Self {
        Self {
            shared,
            tool_router: Self::tool_router(),
        }
    }

    fn resources(&self) -> Result<AppResources, String> {
        self.shared
            .get()
            .cloned()
            .ok_or_else(|| "Resources not initialized yet".to_string())
    }
}

#[tool_router]
impl KoharuMcp {
    #[tool(description = "Get the application version")]
    async fn app_version(&self) -> Result<String, String> {
        let res = self.resources()?;
        operations::app_version(res)
            .await
            .map_err(|e| e.to_string())
    }

    #[tool(description = "Get device information (ML device, GPU info)")]
    async fn device(&self) -> Result<String, String> {
        let res = self.resources()?;
        let info = operations::device(res).await.map_err(|e| e.to_string())?;
        serde_json::to_string_pretty(&info).map_err(|e| e.to_string())
    }

    #[tool(description = "Get the number of loaded documents")]
    async fn get_documents(&self) -> Result<String, String> {
        let res = self.resources()?;
        let count = operations::get_documents(res)
            .await
            .map_err(|e| e.to_string())?;
        Ok(format!("{count} document(s) loaded"))
    }

    #[tool(
        description = "Get document metadata and text blocks (no images). Returns name, dimensions, processing state, and all text block details."
    )]
    async fn get_document(
        &self,
        Parameters(p): Parameters<IndexPayload>,
    ) -> Result<String, String> {
        let res = self.resources()?;
        let doc = operations::get_document(res, p)
            .await
            .map_err(|e| e.to_string())?;
        let info = to_doc_info(&doc);
        serde_json::to_string_pretty(&info).map_err(|e| e.to_string())
    }

    #[tool(
        description = "View a document image layer. Returns the image so you can see the manga page, detection mask."
    )]
    async fn view_image(
        &self,
        Parameters(p): Parameters<ViewImageParams>,
    ) -> Result<CallToolResult, ErrorData> {
        let res = self
            .resources()
            .map_err(|e| ErrorData::internal_error(e, None))?;
        let doc = operations::get_document(res, IndexPayload { index: p.index })
            .await
            .map_err(|e| ErrorData::internal_error(e.to_string(), None))?;

        let max_size = p.max_size.unwrap_or(1024);

        let img: &DynamicImage = match p.layer.as_str() {
            "original" => &doc.image,
            "segment" => doc.segment.as_ref().ok_or_else(|| {
                ErrorData::internal_error("No segment mask available. Run detect first.", None)
            })?,
            other => {
                return Err(ErrorData::internal_error(
                    format!("Unknown layer: {other}. Valid: original, segment"),
                    None,
                ));
            }
        };

        let b64 = encode_png_base64(img, max_size);
        Ok(CallToolResult::success(vec![
            Content::text(format!(
                "Viewing '{}' layer of document '{}' ({}x{})",
                p.layer, doc.name, doc.width, doc.height
            )),
            Content::image(b64, "image/png"),
        ]))
    }

    #[tool(
        description = "View a cropped region of a specific text block. Useful for inspecting OCR results."
    )]
    async fn view_text_block(
        &self,
        Parameters(p): Parameters<ViewTextBlockParams>,
    ) -> Result<CallToolResult, ErrorData> {
        let res = self
            .resources()
            .map_err(|e| ErrorData::internal_error(e, None))?;
        let doc = operations::get_document(res, IndexPayload { index: p.index })
            .await
            .map_err(|e| ErrorData::internal_error(e.to_string(), None))?;

        let block = doc.text_blocks.get(p.text_block_index).ok_or_else(|| {
            ErrorData::internal_error(format!("Text block {} not found", p.text_block_index), None)
        })?;

        let x = (block.x.max(0.0) as u32).min(doc.width.saturating_sub(1));
        let y = (block.y.max(0.0) as u32).min(doc.height.saturating_sub(1));
        let w = (block.width as u32).min(doc.width.saturating_sub(x));
        let h = (block.height as u32).min(doc.height.saturating_sub(y));

        if w == 0 || h == 0 {
            return Err(ErrorData::internal_error(
                "Text block has zero dimensions",
                None,
            ));
        }

        let crop = doc.image.crop_imm(x, y, w, h);
        let b64 = encode_png_base64(&crop, 512);

        let mut desc = format!(
            "Text block [{}] at ({},{}) {}x{}",
            p.text_block_index, x, y, w, h
        );
        if let Some(ref text) = block.text {
            desc.push_str(&format!("\nOCR: {text}"));
        }

        Ok(CallToolResult::success(vec![
            Content::text(desc),
            Content::image(b64, "image/png"),
        ]))
    }

    #[tool(
        description = "Open image files from disk paths. Replaces any currently loaded documents."
    )]
    async fn open_documents(
        &self,
        Parameters(p): Parameters<OpenDocumentsParams>,
    ) -> Result<String, String> {
        let res = self.resources()?;

        let files: Result<Vec<FileEntry>, String> = p
            .paths
            .iter()
            .map(|path| {
                let data =
                    std::fs::read(path).map_err(|e| format!("Failed to read {path}: {e}"))?;
                let name = PathBuf::from(path)
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                Ok(FileEntry { name, data })
            })
            .collect();

        let count = operations::open_documents(res.clone(), OpenDocumentsPayload { files: files? })
            .await
            .map_err(|e| e.to_string())?;

        let guard = res.state.read().await;
        let names: Vec<&str> = guard.documents.iter().map(|d| d.name.as_str()).collect();
        Ok(format!("Loaded {count} document(s): {}", names.join(", ")))
    }

    #[tool(description = "Export the rendered document to a file on disk")]
    async fn export_document(
        &self,
        Parameters(p): Parameters<ExportDocumentParams>,
    ) -> Result<String, String> {
        let res = self.resources()?;
        let result = operations::export_document(res, IndexPayload { index: p.index })
            .await
            .map_err(|e| e.to_string())?;

        std::fs::write(&p.output_path, &result.data)
            .map_err(|e| format!("Failed to write {}: {e}", p.output_path))?;

        Ok(format!("Exported to {}", p.output_path))
    }

    #[tool(
        description = "Detect text blocks and fonts in a manga page. Finds speech bubbles, text regions, and predicts font properties."
    )]
    async fn detect(&self, Parameters(p): Parameters<IndexPayload>) -> Result<String, String> {
        let res = self.resources()?;
        operations::detect(res.clone(), p)
            .await
            .map_err(|e| e.to_string())?;

        let doc = operations::get_document(res, p)
            .await
            .map_err(|e| e.to_string())?;

        let mut lines = vec![format!("Detected {} text block(s):", doc.text_blocks.len())];
        for (i, b) in doc.text_blocks.iter().enumerate() {
            lines.push(format!(
                "  [{}] ({:.0},{:.0}) {:.0}x{:.0} conf={:.2}",
                i, b.x, b.y, b.width, b.height, b.confidence
            ));
        }
        Ok(lines.join("\n"))
    }

    #[tool(
        description = "Run OCR (optical character recognition) on detected text blocks to extract the original text."
    )]
    async fn ocr(&self, Parameters(p): Parameters<IndexPayload>) -> Result<String, String> {
        let res = self.resources()?;
        operations::ocr(res.clone(), p)
            .await
            .map_err(|e| e.to_string())?;

        let doc = operations::get_document(res, p)
            .await
            .map_err(|e| e.to_string())?;

        let mut lines = vec!["OCR results:".to_string()];
        for (i, b) in doc.text_blocks.iter().enumerate() {
            let text = b.text.as_deref().unwrap_or("(empty)");
            lines.push(format!("  [{i}] {text}"));
        }
        Ok(lines.join("\n"))
    }

    #[tool(
        description = "Run the full processing pipeline: detect -> OCR. Processes all steps automatically."
    )]
    async fn process(&self, Parameters(p): Parameters<ProcessParams>) -> Result<String, String> {
        let res = self.resources()?;

        operations::process(res, ProcessRequest { index: p.index })
            .await
            .map_err(|e| e.to_string())?;

        Ok("Pipeline started".to_string())
    }

    #[tool(
        description = "Update a text block's properties. Only the fields you provide will be changed."
    )]
    async fn update_text_block(
        &self,
        Parameters(p): Parameters<UpdateTextBlockPayload>,
    ) -> Result<String, String> {
        let res = self.resources()?;
        let info = operations::update_text_block(res, p)
            .await
            .map_err(|e| e.to_string())?;
        serde_json::to_string_pretty(&info).map_err(|e| e.to_string())
    }

    #[tool(description = "Add a new empty text block at the specified position")]
    async fn add_text_block(
        &self,
        Parameters(p): Parameters<AddTextBlockPayload>,
    ) -> Result<String, String> {
        let res = self.resources()?;
        let index = operations::add_text_block(res, p)
            .await
            .map_err(|e| e.to_string())?;
        Ok(format!("Added text block at index {index}"))
    }

    #[tool(description = "Remove a text block by index")]
    async fn remove_text_block(
        &self,
        Parameters(p): Parameters<RemoveTextBlockPayload>,
    ) -> Result<String, String> {
        let res = self.resources()?;
        let remaining = operations::remove_text_block(res, p)
            .await
            .map_err(|e| e.to_string())?;
        Ok(format!("Removed text block. {remaining} remaining."))
    }
}

#[tool_handler]
impl ServerHandler for KoharuMcp {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            server_info: Implementation {
                name: "koharu".to_string(),
                version: env!("CARGO_PKG_VERSION").to_string(),
                ..Default::default()
            },
            capabilities: ServerCapabilities {
                tools: Some(ToolsCapability::default()),
                ..Default::default()
            },
            instructions: Some(
                "Koharu manga OCR tools. Use open_documents to load images, then detect -> ocr to extract text.".to_string(),
            ),
            ..Default::default()
        }
    }
}
