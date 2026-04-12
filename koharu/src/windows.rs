use anyhow::Result;

use windows::Win32::System::Console::{
    ATTACH_PARENT_PROCESS, AttachConsole, ENABLE_VIRTUAL_TERMINAL_PROCESSING, GetConsoleMode,
    GetStdHandle, STD_OUTPUT_HANDLE, SetConsoleMode,
};

pub fn enable_ansi_support() -> Result<()> {
    // SAFETY: These Windows API calls are safe as long as we're running on Windows
    // with a console attached. GetStdHandle returns a handle to the standard output,
    // GetConsoleMode retrieves the current console mode, and SetConsoleMode enables
    // ANSI escape sequence processing.
    unsafe {
        let handle = GetStdHandle(STD_OUTPUT_HANDLE)?;
        if handle.is_invalid() {
            return Ok(());
        }

        let mut mode = std::mem::zeroed();
        GetConsoleMode(handle, &mut mode)?;
        SetConsoleMode(handle, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING)?;
        Ok(())
    }
}

pub fn attach_parent_console() {
    // SAFETY: AttachConsole is a standard Windows API call that attaches the current
    // process to its parent's console. This is safe to call and will fail gracefully
    // if the parent has no console.
    unsafe {
        let _ = AttachConsole(ATTACH_PARENT_PROCESS);
    }
}
