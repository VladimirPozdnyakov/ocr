use std::ffi::OsStr;
use std::path::Path;

use anyhow::{Context, Result};
use libloading::Library;

pub(crate) fn add_runtime_search_path(path: &Path) -> Result<()> {
    #[cfg(not(target_os = "windows"))]
    {
        let _ = path;
        Ok(())
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        use windows_sys::Win32::System::LibraryLoader::{
            AddDllDirectory, LOAD_LIBRARY_SEARCH_SYSTEM32, LOAD_LIBRARY_SEARCH_USER_DIRS,
            SetDefaultDllDirectories,
        };

        let path = path
            .canonicalize()
            .with_context(|| format!("failed to canonicalize `{}`", path.display()))?;
        let wide = path
            .as_os_str()
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<_>>();
        // SAFETY: SetDefaultDllDirectories and AddDllDirectory are Windows API calls
        // that modify the DLL search path. This is safe as long as the path points
        // to a valid directory. The wide string is null-terminated for the Windows API.
        unsafe {
            if SetDefaultDllDirectories(
                LOAD_LIBRARY_SEARCH_USER_DIRS | LOAD_LIBRARY_SEARCH_SYSTEM32,
            ) == 0
            {
                anyhow::bail!(
                    "failed to set default DLL directories: {}",
                    std::io::Error::last_os_error()
                );
            }
            if AddDllDirectory(wide.as_ptr()).is_null() {
                anyhow::bail!(
                    "failed to add DLL directory: {}",
                    std::io::Error::last_os_error()
                );
            }
        }
        Ok(())
    }
}

pub(crate) fn preload_library(path: &Path) -> Result<()> {
    let path = path
        .canonicalize()
        .with_context(|| format!("failed to canonicalize `{}`", path.display()))?;
    let library = load_library(path.as_os_str())
        .with_context(|| format!("failed to preload `{}`", path.display()))?;
    std::mem::forget(library);
    Ok(())
}

pub fn load_library_by_name(name: &str) -> Result<Library> {
    load_library(OsStr::new(name)).with_context(|| format!("failed to load `{name}`"))
}

fn load_library(target: &OsStr) -> Result<Library> {
    #[cfg(target_os = "windows")]
    {
        // SAFETY: Loading a library by name is safe if the library exists and is a valid DLL.
        // The library must be in the DLL search path (added via add_runtime_search_path).
        let library = unsafe { Library::new(target) }?;
        Ok(library)
    }

    #[cfg(not(target_os = "windows"))]
    {
        use libloading::os::unix::{Library as UnixLibrary, RTLD_GLOBAL, RTLD_NOW};

        // SAFETY: Loading a shared library with RTLD_NOW | RTLD_GLOBAL is safe if the
        // library exists and is a valid shared object. RTLD_GLOBAL is needed so that
        // symbols are available for subsequently loaded libraries.
        let library = unsafe { UnixLibrary::open(Some(target), RTLD_NOW | RTLD_GLOBAL) }?;
        Ok(library.into())
    }
}
