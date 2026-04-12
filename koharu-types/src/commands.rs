use crate::TextBlock;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    pub ml_device: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct OpenExternalPayload {
    pub url: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct IndexPayload {
    pub index: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThumbnailResult {
    #[serde(with = "serde_bytes")]
    pub data: Vec<u8>,
    pub content_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    #[serde(with = "serde_bytes")]
    pub data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenDocumentsPayload {
    pub files: Vec<FileEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileResult {
    pub filename: String,
    #[serde(with = "serde_bytes")]
    pub data: Vec<u8>,
    pub content_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTextBlocksPayload {
    pub index: usize,
    pub text_blocks: Vec<TextBlock>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessRequest {
    pub index: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ViewImageParams {
    pub index: usize,
    pub layer: String,
    pub max_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ViewTextBlockParams {
    pub index: usize,
    pub text_block_index: usize,
    pub layer: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct OpenDocumentsParams {
    pub paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ExportDocumentParams {
    pub index: usize,
    pub output_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ProcessParams {
    pub index: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTextBlockPayload {
    pub index: usize,
    pub text_block_index: usize,
    pub x: Option<f32>,
    pub y: Option<f32>,
    pub width: Option<f32>,
    pub height: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct AddTextBlockPayload {
    pub index: usize,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct RemoveTextBlockPayload {
    pub index: usize,
    pub text_block_index: usize,
}

#[cfg(test)]
mod tests {
    use crate::{TextAlign, TextStyle};
    use serde::Serialize;
    use serde::de::DeserializeOwned;

    use super::*;

    fn round_trip<T>(value: &T)
    where
        T: Serialize + DeserializeOwned,
    {
        let encoded = serde_json::to_vec(value).expect("serialize");
        let decoded: T = serde_json::from_slice(&encoded).expect("deserialize");
        let original = serde_json::to_value(value).expect("serialize to value");
        let restored = serde_json::to_value(decoded).expect("serialize decoded to value");
        assert_eq!(original, restored);
    }

    #[test]
    fn command_dtos_round_trip() {
        let text_block = TextBlock {
            x: 10.0,
            y: 11.0,
            width: 120.0,
            height: 40.0,
            confidence: 0.95,
            text: Some("source".to_string()),
            ..Default::default()
        };

        round_trip(&DeviceInfo {
            ml_device: "CPU".to_string(),
        });
        round_trip(&OpenExternalPayload {
            url: "https://example.com".to_string(),
        });
        round_trip(&IndexPayload { index: 2 });
        round_trip(&ThumbnailResult {
            data: vec![1, 2, 3],
            content_type: "image/webp".to_string(),
        });
        round_trip(&FileEntry {
            name: "page.png".to_string(),
            data: vec![7, 8, 9],
        });
        round_trip(&OpenDocumentsPayload {
            files: vec![FileEntry {
                name: "page.png".to_string(),
                data: vec![7, 8, 9],
            }],
        });
        round_trip(&FileResult {
            filename: "page_koharu.png".to_string(),
            data: vec![1, 2, 3, 4],
            content_type: "image/png".to_string(),
        });
        round_trip(&UpdateTextBlocksPayload {
            index: 1,
            text_blocks: vec![text_block.clone()],
        });
        round_trip(&ProcessRequest { index: Some(1) });
        round_trip(&ViewImageParams {
            index: 1,
            layer: "original".to_string(),
            max_size: Some(512),
        });
        round_trip(&ViewTextBlockParams {
            index: 1,
            text_block_index: 0,
            layer: Some("original".to_string()),
        });
        round_trip(&OpenDocumentsParams {
            paths: vec!["a.png".to_string(), "b.png".to_string()],
        });
        round_trip(&ExportDocumentParams {
            index: 1,
            output_path: "out.png".to_string(),
        });
        round_trip(&ProcessParams { index: Some(1) });
        round_trip(&UpdateTextBlockPayload {
            index: 1,
            text_block_index: 0,
            x: Some(1.0),
            y: Some(2.0),
            width: Some(3.0),
            height: Some(4.0),
        });
        round_trip(&AddTextBlockPayload {
            index: 1,
            x: 1.0,
            y: 2.0,
            width: 3.0,
            height: 4.0,
        });
        round_trip(&RemoveTextBlockPayload {
            index: 1,
            text_block_index: 0,
        });
    }
}
