use koharu_types::TextBlock;
use koharu_types::commands::{
    AddTextBlockPayload, RemoveTextBlockPayload, UpdateTextBlockPayload, UpdateTextBlocksPayload,
};
use koharu_types::views::{TextBlockInfo, to_block_info};

use crate::{
    AppResources,
    state_tx::{self, ChangedField},
};

const MATCH_GEOMETRY_EPS: f32 = 0.01;
const MATCH_NEAR_GEOMETRY_DELTA: f32 = 4.0;
const MATCH_TEXT_GEOMETRY_DELTA: f32 = 64.0;

#[inline]
fn geometry_delta(a: &TextBlock, b: &TextBlock) -> f32 {
    (a.x - b.x).abs() + (a.y - b.y).abs() + (a.width - b.width).abs() + (a.height - b.height).abs()
}

#[inline]
fn geometry_changed(a: &TextBlock, b: &TextBlock) -> bool {
    geometry_delta(a, b) > MATCH_GEOMETRY_EPS
}

#[inline]
fn size_changed(a: &TextBlock, b: &TextBlock) -> bool {
    (a.width - b.width).abs() > MATCH_GEOMETRY_EPS
        || (a.height - b.height).abs() > MATCH_GEOMETRY_EPS
}

#[inline]
fn geometry_overlaps(a: &TextBlock, b: &TextBlock) -> bool {
    (a.x < b.x + b.width)
        && (a.y < b.y + b.height)
        && (a.x + a.width > b.x)
        && (a.y + a.height > b.y)
}

#[inline]
fn has_stable_content_identity(a: &TextBlock, b: &TextBlock) -> bool {
    (a.text.is_some() || b.text.is_some()) && a.text == b.text
}

#[inline]
fn get_layout_seed(block: &TextBlock) -> (f32, f32, f32, f32) {
    match (
        block.layout_seed_x,
        block.layout_seed_y,
        block.layout_seed_width,
        block.layout_seed_height,
    ) {
        (Some(x), Some(y), Some(w), Some(h))
            if w.is_finite() && h.is_finite() && w > 0.0 && h > 0.0 =>
        {
            (x, y, w, h)
        }
        _ => (
            block.x,
            block.y,
            block.width.max(1.0),
            block.height.max(1.0),
        ),
    }
}

fn find_matching_previous(
    current: &TextBlock,
    current_index: usize,
    previous: &[TextBlock],
    used_previous: &[bool],
) -> Option<usize> {
    if current_index < previous.len() && !used_previous[current_index] {
        let indexed = &previous[current_index];
        let delta = geometry_delta(current, indexed);
        if delta <= MATCH_NEAR_GEOMETRY_DELTA
            || geometry_overlaps(current, indexed)
            || has_stable_content_identity(current, indexed)
        {
            return Some(current_index);
        }
    }

    let mut best_idx = None;
    let mut best_delta = f32::INFINITY;

    for (idx, prev) in previous.iter().enumerate() {
        if used_previous[idx] {
            continue;
        }
        let delta = geometry_delta(current, prev);
        if delta < best_delta {
            best_idx = Some(idx);
            best_delta = delta;
        }
    }

    let candidate_idx = best_idx?;
    let candidate = &previous[candidate_idx];
    if best_delta <= MATCH_NEAR_GEOMETRY_DELTA {
        return Some(candidate_idx);
    }

    if has_stable_content_identity(current, candidate) && best_delta <= MATCH_TEXT_GEOMETRY_DELTA {
        return Some(candidate_idx);
    }

    None
}

fn rehydrate_runtime_text_block_state(current: &mut TextBlock, previous: Option<&TextBlock>) {
    let Some(prev) = previous else {
        current.lock_layout_box = false;
        current.set_layout_seed(current.x, current.y, current.width, current.height);
        return;
    };

    if current.id.trim().is_empty() {
        current.id = prev.id.clone();
    }

    current.lock_layout_box = if size_changed(current, prev) {
        true
    } else {
        prev.lock_layout_box
    };

    if geometry_changed(current, prev) {
        current.set_layout_seed(current.x, current.y, current.width, current.height);
    } else {
        let (x, y, w, h) = get_layout_seed(prev);
        current.set_layout_seed(x, y, w, h);
    }
}

#[allow(dead_code)]
fn block_bounds(block: &TextBlock) -> Option<(f32, f32, f32, f32)> {
    let bx0 = block.x.max(0.0);
    let by0 = block.y.max(0.0);
    let bx1 = (block.x + block.width).max(bx0);
    let by1 = (block.y + block.height).max(by0);
    (bx1 > bx0 && by1 > by0).then_some((bx0, by0, bx1, by1))
}

pub async fn update_text_blocks(
    state: AppResources,
    payload: UpdateTextBlocksPayload,
) -> anyhow::Result<()> {
    state_tx::mutate_doc(
        &state.state,
        payload.index,
        &[ChangedField::TextBlocks],
        |document| {
            let previous = std::mem::take(&mut document.text_blocks);
            document.text_blocks = payload.text_blocks;

            let mut used_previous = vec![false; previous.len()];
            for (block_index, block) in document.text_blocks.iter_mut().enumerate() {
                let matched_idx =
                    find_matching_previous(block, block_index, &previous, &used_previous);
                if let Some(idx) = matched_idx {
                    used_previous[idx] = true;
                    rehydrate_runtime_text_block_state(block, Some(&previous[idx]));
                } else {
                    rehydrate_runtime_text_block_state(block, None);
                }
            }
            Ok(())
        },
    )
    .await
}

pub async fn update_text_block(
    state: AppResources,
    payload: UpdateTextBlockPayload,
) -> anyhow::Result<TextBlockInfo> {
    state_tx::mutate_doc(
        &state.state,
        payload.index,
        &[ChangedField::TextBlocks],
        |document| {
            let block = document
                .text_blocks
                .get_mut(payload.text_block_index)
                .ok_or_else(|| {
                    anyhow::anyhow!("Text block {} not found", payload.text_block_index)
                })?;
            let mut changed = false;

            if let Some(x) = payload.x {
                block.x = x;
                changed = true;
            }
            if let Some(y) = payload.y {
                block.y = y;
                changed = true;
            }
            if let Some(width) = payload.width {
                block.width = width;
                changed = true;
                block.lock_layout_box = true;
            }
            if let Some(height) = payload.height {
                block.height = height;
                changed = true;
                block.lock_layout_box = true;
            }
            if changed {
                block.set_layout_seed(block.x, block.y, block.width, block.height);
            }

            Ok(to_block_info(payload.text_block_index, block))
        },
    )
    .await
}

pub async fn add_text_block(
    state: AppResources,
    payload: AddTextBlockPayload,
) -> anyhow::Result<usize> {
    state_tx::mutate_doc(
        &state.state,
        payload.index,
        &[ChangedField::TextBlocks],
        |document| {
            let mut block = TextBlock {
                x: payload.x,
                y: payload.y,
                width: payload.width,
                height: payload.height,
                confidence: 1.0,
                ..Default::default()
            };
            block.set_layout_seed(block.x, block.y, block.width, block.height);
            document.text_blocks.push(block);
            Ok(document.text_blocks.len() - 1)
        },
    )
    .await
}

pub async fn remove_text_block(
    state: AppResources,
    payload: RemoveTextBlockPayload,
) -> anyhow::Result<usize> {
    state_tx::mutate_doc(
        &state.state,
        payload.index,
        &[ChangedField::TextBlocks],
        |document| {
            if payload.text_block_index >= document.text_blocks.len() {
                anyhow::bail!("Text block {} not found", payload.text_block_index);
            }
            document.text_blocks.remove(payload.text_block_index);
            Ok(document.text_blocks.len())
        },
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::rehydrate_runtime_text_block_state;
    use koharu_types::TextBlock;

    #[test]
    fn resized_block_locks_layout_box() {
        let previous = TextBlock {
            x: 10.0,
            y: 20.0,
            width: 100.0,
            height: 80.0,
            ..Default::default()
        };
        let mut current = TextBlock {
            x: 10.0,
            y: 20.0,
            width: 72.0,
            height: 80.0,
            ..Default::default()
        };

        rehydrate_runtime_text_block_state(&mut current, Some(&previous));

        assert!(current.lock_layout_box);
        assert_eq!(current.seed_layout_box(), (10.0, 20.0, 72.0, 80.0));
    }

    #[test]
    fn unchanged_block_preserves_layout_box_lock_and_seed() {
        let mut previous = TextBlock {
            x: 10.0,
            y: 20.0,
            width: 100.0,
            height: 80.0,
            lock_layout_box: true,
            ..Default::default()
        };
        previous.set_layout_seed(5.0, 6.0, 70.0, 60.0);

        let mut current = TextBlock {
            x: 10.0,
            y: 20.0,
            width: 100.0,
            height: 80.0,
            ..Default::default()
        };

        rehydrate_runtime_text_block_state(&mut current, Some(&previous));

        assert!(current.lock_layout_box);
        assert_eq!(current.seed_layout_box(), (5.0, 6.0, 70.0, 60.0));
    }
}
