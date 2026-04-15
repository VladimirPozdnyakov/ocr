use std::{path::PathBuf, sync::Arc};

use anyhow::{Context, Result};
use clap::Parser;
use once_cell::sync::Lazy;
use tokio::{net::TcpListener, sync::RwLock};
use tracing_subscriber::fmt::format::FmtSpan;

use koharu_ml::{cuda_is_available, device};
use koharu_pipeline::AppResources;
use koharu_renderer::facade::Renderer;
use koharu_rpc::{SharedResources, server};
use koharu_types::State;

static APP_ROOT: Lazy<PathBuf> = Lazy::new(|| {
    dirs::data_local_dir()
        .map(|path| path.join("Koharu"))
        .unwrap_or_default()
});
static MODEL_ROOT: Lazy<PathBuf> = Lazy::new(|| APP_ROOT.join("models"));

#[derive(Parser)]
#[command(version = crate::version::APP_VERSION, about)]
struct Cli {
    #[arg(
        short,
        long,
        help = "Download dynamic libraries and exit",
        default_value_t = false
    )]
    download: bool,
    #[arg(
        long,
        help = "Force using CPU even if GPU is available",
        default_value_t = false
    )]
    cpu: bool,
    #[arg(
        short,
        long,
        value_name = "PORT",
        help = "Bind the HTTP server to a specific port (default: 3000)",
        default_value_t = 3000
    )]
    port: u16,
    #[arg(
        long,
        help = "Host to bind to (default: 127.0.0.1)",
        default_value = "127.0.0.1"
    )]
    host: String,
    #[arg(
        long,
        help = "Do not open browser automatically",
        default_value_t = false
    )]
    no_browser: bool,
}

fn initialize() -> Result<()> {
    #[cfg(target_os = "windows")]
    {
        crate::windows::attach_parent_console();
        crate::windows::enable_ansi_support().ok();
    }

    tracing_subscriber::fmt()
        .with_span_events(FmtSpan::CLOSE)
        .with_env_filter(
            tracing_subscriber::filter::EnvFilter::builder()
                .with_default_directive(tracing::Level::INFO.into())
                .from_env_lossy(),
        )
        .init();

    koharu_ml::set_cache_dir(MODEL_ROOT.to_path_buf())?;

    std::panic::set_hook(Box::new(|info| {
        eprintln!("panic: {info}");
    }));

    Ok(())
}

async fn prefetch() -> Result<()> {
    koharu_runtime::initialize()
        .await
        .context("Failed to initialize runtime packages")?;
    koharu_ml::facade::prefetch().await?;

    Ok(())
}

fn warning(title: &str, description: &str) {
    tracing::warn!("{title}: {description}");
}

async fn build_resources(cpu: bool) -> Result<AppResources> {
    let mut cpu = cpu;

    if !cpu && cuda_is_available() {
        match koharu_runtime::cuda_driver_version() {
            Ok(version) if version.supports_cuda_13_1() => {
                tracing::info!("NVIDIA driver reports CUDA {version} support");
            }
            Ok(version) => {
                warning(
                    "NVIDIA Driver Update Recommended",
                    &format!(
                        "Your NVIDIA driver only supports CUDA {version}. Koharu (Lilith Team Edition) will fall back to CPU. Please update your NVIDIA driver to a version that supports CUDA 13.1 or newer to enable GPU acceleration."
                    ),
                );
                cpu = true;
            }
            Err(err) => {
                warning(
                    "NVIDIA Driver Check Failed",
                    &format!(
                        "Koharu (Lilith Team Edition) could not verify NVIDIA driver support for CUDA 13.1: {err:#}. Will fall back to CPU. Please update your NVIDIA driver to a version that supports CUDA 13.1 or newer to enable GPU acceleration."
                    ),
                );
                cpu = true;
            }
        }
    }

    koharu_runtime::initialize()
        .await
        .context("Failed to initialize runtime packages")?;

    if !cpu && cuda_is_available() {
        tracing::info!("CUDA is available and runtime packages were initialized");
    }

    tracing::info!("Prefetching model files...");
    koharu_ml::facade::prefetch()
        .await
        .context("Failed to prefetch model files")?;
    tracing::info!("Model files ready, loading into device...");

    let ml = Arc::new(
        koharu_ml::facade::Model::new(cpu, None)
            .await
            .context("Failed to initialize ML model")?,
    );
    let renderer = Arc::new(Renderer::new().context("Failed to initialize renderer")?);
    let state = Arc::new(RwLock::new(State::default()));

    Ok(AppResources {
        state,
        ml,
        renderer,
        device: device(cpu)?,
        pipeline: Arc::new(RwLock::new(None)),
        version: crate::version::current(),
    })
}

pub async fn run() -> Result<()> {
    let Cli {
        download,
        cpu,
        port,
        host,
        no_browser,
    } = Cli::parse();

    initialize()?;

    if download {
        prefetch().await?;
        return Ok(());
    }

    let listener = TcpListener::bind(format!("{host}:{port}")).await?;
    let local_addr = listener.local_addr()?;

    let shared: SharedResources = Arc::new(tokio::sync::OnceCell::new());
    let resolver = crate::assets::filesystem_resolver();

    tokio::spawn({
        let shared = shared.clone();
        let version = crate::version::current();
        async move {
            if let Err(err) = server::serve_with_listener(listener, shared, resolver, version).await
            {
                tracing::error!("Server error: {err:#}");
            }
        }
    });

    shared
        .get_or_try_init(|| async { build_resources(cpu).await })
        .await?;

    let url = format!("http://{local_addr}");
    tracing::info!("Koharu (Lilith Team Edition) is running at {url}");
    tracing::info!("Press Ctrl+C to stop");

    if !no_browser && let Err(err) = open_browser(&url) {
        tracing::warn!("Failed to open browser: {err:#}");
    }

    tokio::signal::ctrl_c().await?;

    tracing::info!("Shutting down...");
    Ok(())
}

fn open_browser(url: &str) -> Result<()> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", url])
            .spawn()?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").arg(url).spawn()?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open").arg(url).spawn()?;
    }

    Ok(())
}
