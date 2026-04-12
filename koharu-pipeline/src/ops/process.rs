use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};

use koharu_types::commands::ProcessRequest;
use uuid::Uuid;

use crate::AppResources;

pub async fn process(state: AppResources, payload: ProcessRequest) -> anyhow::Result<String> {
    {
        let guard = state.pipeline.read().await;
        if guard.is_some() {
            anyhow::bail!("A processing pipeline is already running");
        }
    }

    let job_id = Uuid::new_v4().to_string();
    let cancel = Arc::new(AtomicBool::new(false));
    {
        let mut guard = state.pipeline.write().await;
        *guard = Some(crate::pipeline::PipelineHandle {
            id: job_id.clone(),
            cancel: cancel.clone(),
        });
    }

    let resources = state.clone();
    let job_id_for_task = job_id.clone();
    tokio::spawn(async move {
        crate::pipeline::run_pipeline(resources, payload, cancel, job_id_for_task).await;
    });

    Ok(job_id)
}

pub async fn process_cancel(state: AppResources) -> anyhow::Result<()> {
    let guard = state.pipeline.read().await;
    if let Some(handle) = guard.as_ref() {
        handle.cancel.store(true, Ordering::Relaxed);
    }
    Ok(())
}
