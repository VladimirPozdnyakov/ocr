use koharu_types::commands::IndexPayload;
use tracing::instrument;

use crate::{
    AppResources,
    state_tx::{self, ChangedField},
};

#[instrument(level = "info", skip_all)]
pub async fn detect(state: AppResources, payload: IndexPayload) -> anyhow::Result<()> {
    let mut snapshot = state_tx::read_doc(&state.state, payload.index).await?;
    state.ml.detect(&mut snapshot).await?;
    state_tx::update_doc(
        &state.state,
        payload.index,
        snapshot,
        &[ChangedField::TextBlocks, ChangedField::Segment],
    )
    .await
}

#[instrument(level = "info", skip_all)]
pub async fn ocr(state: AppResources, payload: IndexPayload) -> anyhow::Result<()> {
    let mut snapshot = state_tx::read_doc(&state.state, payload.index).await?;
    state.ml.ocr(&mut snapshot).await?;
    state_tx::update_doc(
        &state.state,
        payload.index,
        snapshot,
        &[ChangedField::TextBlocks],
    )
    .await
}

#[instrument(level = "info", skip_all)]
pub async fn ocr_text_block(
    state: AppResources,
    document_index: usize,
    text_block_index: usize,
) -> anyhow::Result<()> {
    let mut snapshot = state_tx::read_doc(&state.state, document_index).await?;

    if let Some(block) = snapshot.text_blocks.get_mut(text_block_index) {
        state.ml.ocr_text_block(&snapshot.image, block).await?;
    }

    state_tx::update_doc(
        &state.state,
        document_index,
        snapshot,
        &[ChangedField::TextBlocks],
    )
    .await
}
