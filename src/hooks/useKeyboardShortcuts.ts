import { useEffect } from 'react';
import { useOCRStore } from '../state/store';
import { useToast } from '../components/ToastProvider';

interface KeyboardShortcutConfig {
  onError?: () => void;
  onCopyAll?: () => void;
  onExport?: () => void;
  onOpenSettings?: () => void;
  onClearAll?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutConfig = {}) {
  const {
    selectionAreas,
    removeSelectionArea,
    clearSelectionAreas,
    clearResults,
    selectedAreaId,
    ocrResults,
  } = useOCRStore();

  const { showError, showInfo, showSuccess } = useToast();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl/Cmd + Shift + N: New image (trigger file input)
      if (ctrlOrCmd && event.shiftKey && event.key === 'n') {
        event.preventDefault();
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.click();
        }
        return;
      }

      // Ctrl/Cmd + Shift + C: Copy all results
      if (ctrlOrCmd && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        handleCopyAll();
        return;
      }

      // Ctrl/Cmd + Shift + S: Open settings
      if (ctrlOrCmd && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        config.onOpenSettings?.();
        return;
      }

      // Ctrl/Cmd + Shift + E: Export results
      if (ctrlOrCmd && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        config.onExport?.();
        return;
      }

      // Delete/Backspace: Remove selected area
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedAreaId) {
          event.preventDefault();
          removeSelectionArea(selectedAreaId);
          showInfo('Area removed');
        }
        return;
      }

      // Escape: Close dialogs or clear selection
      if (event.key === 'Escape') {
        if (selectedAreaId) {
          // Clear selection
          useOCRStore.getState().setSelectedAreaId(null);
        }
        return;
      }

      // Ctrl/Cmd + Shift + D: Clear all areas
      if (ctrlOrCmd && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        handleClearAll();
        return;
      }
    };

    const handleCopyAll = async () => {
      if (ocrResults.size === 0) {
        showError('No results to copy');
        return;
      }

      const allText = Array.from(ocrResults.values())
        .map((result) => result.text)
        .filter((text) => text)
        .join('\n\n');

      try {
        await navigator.clipboard.writeText(allText);
        showSuccess('All results copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy all results:', error);
        showError('Failed to copy results');
      }
    };

    const handleClearAll = () => {
      if (selectionAreas.length === 0) {
        showInfo('No areas to clear');
        return;
      }

      if (confirm(`Are you sure you want to clear ${selectionAreas.length} area(s)?`)) {
        clearSelectionAreas();
        clearResults();
        showSuccess('All areas cleared');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectionAreas,
    ocrResults,
    selectedAreaId,
    removeSelectionArea,
    clearSelectionAreas,
    clearResults,
    showSuccess,
    showError,
    showInfo,
    config,
  ]);
}
