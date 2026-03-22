import { forwardRef, useImperativeHandle } from 'react';
import { useOCRStore } from '../state/store';
import { useToast } from './ToastProvider';

export interface ResultsPanelRef {
  handleCopyAllResults: () => void;
  handleExportResults: () => void;
}

export const ResultsPanel = forwardRef<ResultsPanelRef>((_props, ref) => {
  const { selectionAreas, ocrResults, removeOCRResult } = useOCRStore();
  const { showSuccess, showError, showInfo } = useToast();

  useImperativeHandle(ref, () => ({
    handleCopyAllResults,
    handleExportResults,
  }));

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Text copied to clipboard!');
    } catch (error) {
      showError('Failed to copy text');
    }
  };

  const handleDeleteResult = (areaId: string) => {
    removeOCRResult(areaId);
    showInfo('Result deleted');
  };

  const handleCopyAllResults = async () => {
    const allText = sortedAreas
      .map(area => {
        const result = ocrResults.get(area.id);
        return result ? result.text : '';
      })
      .filter(text => text)
      .join('\n\n');

    if (!allText) {
      showError('No results to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(allText);
      showSuccess('All results copied to clipboard!');
    } catch (error) {
      showError('Failed to copy results');
    }
  };

  const handleExportResults = () => {
    const results = sortedAreas
      .map(area => {
        const result = ocrResults.get(area.id);
        if (!result) return null;

        return {
          area_id: area.id,
          area_position: { x: area.x, y: area.y, width: area.width, height: area.height },
          text: result.text,
          confidence: result.confidence,
          engine: result.engine,
          language: result.language,
          processing_time_ms: result.processing_time_ms
        };
      })
      .filter(Boolean);

    if (results.length === 0) {
      showError('No results to export');
      return;
    }

    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ocr-results-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showSuccess('Results exported successfully!');
  };

  const sortedAreas = [...selectionAreas].sort((a, b) => {
    // Sort by Y first (top to bottom), then by X (left to right)
    if (Math.abs(a.y - b.y) < 10) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  if (selectionAreas.length === 0) {
    return (
      <div className="editorial-card" style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--paper-warm)',
        border: '1px dashed var(--ink-light)'
      }}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--ink-medium)"
          strokeWidth="1.5"
          style={{ marginBottom: '1rem' }}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
          <line x1="9" y1="17" x2="12" y2="17"></line>
        </svg>
        <p style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          color: 'var(--ink-medium)',
          fontSize: '1rem'
        }}>
          Draw rectangles on the image to create OCR areas
        </p>
      </div>
    );
  }

  return (
    <div className="editorial-card" style={{ padding: 0 }}>
      {/* Results Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--ink-faint)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '0.25rem'
          }}>
            Extracted Text
          </h3>
          <p className="editorial-meta" style={{ margin: 0 }}>
            {ocrResults.size} of {selectionAreas.length} processed
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="editorial-button"
            onClick={handleCopyAllResults}
            disabled={ocrResults.size === 0}
            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy All
          </button>
          <button
            className="editorial-button"
            onClick={handleExportResults}
            disabled={ocrResults.size === 0}
            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Results List */}
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {sortedAreas.map((area, index) => {
          const result = ocrResults.get(area.id);

          return (
            <div
              key={area.id}
              className="editorial-card-numbered"
              data-number={String(area.number).padStart(2, '0')}
              style={{
                padding: '1.5rem',
                borderBottom: index === sortedAreas.length - 1 ? 'none' : '1px solid var(--ink-faint)',
                borderLeft: `3px solid ${area.color}`,
                background: result ? 'transparent' : 'var(--paper-warm)',
                opacity: result ? 1 : 0.6
              }}
            >
              {/* Result Text */}
              {result ? (
                <>
                  <div className="result-text-display" style={{
                    background: 'transparent',
                    borderLeftColor: area.color,
                    padding: '0.5rem 0',
                    marginBottom: '0.75rem'
                  }}>
                    {result.text || '<empty result>'}
                  </div>

                  {/* Result Meta */}
                  <div className="result-meta-row">
                    <span>Engine: {result.engine}</span>
                    <span>Lang: {result.language}</span>
                    <span>Conf: {(result.confidence * 100).toFixed(0)}%</span>
                    <span>{result.processing_time_ms}ms</span>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '1rem'
                  }}>
                    <button
                      className="editorial-button"
                      onClick={() => handleCopyText(result.text)}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy
                    </button>
                    <button
                      className="editorial-button"
                      onClick={() => handleDeleteResult(area.id)}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  color: 'var(--ink-light)',
                  fontSize: '1rem'
                }}>
                  Not processed yet
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

ResultsPanel.displayName = 'ResultsPanel';
