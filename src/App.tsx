import React from 'react';
import { useOCRStore } from './state/store';
import { ImageUploader } from './components/ImageUploader';
import { ImageCanvas } from './components/ImageCanvas';
import { OCRControls } from './components/OCRControls';
import { ResultsPanel } from './components/ResultsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import './App.css';

function App() {
  const { image, selectionAreas, ocrResults } = useOCRStore();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const hasResults = selectionAreas.length > 0 && ocrResults.size > 0;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="editorial-header">
        <div className="editorial-logo">
          <div className="editorial-logo-mark">L</div>
          <span>Lexicon</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span className="editorial-meta" style={{ display: 'none' }}>
            Optical Character Recognition
          </span>
          <button
            className="editorial-button"
            onClick={() => setSettingsOpen(true)}
            style={{ padding: '0.5rem 1rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 2rem' }}>
        {!image ? (
          /* Welcome Screen */
          <div style={{ padding: '4rem 0', maxWidth: '800px', margin: '0 auto' }}>
            <div className="animate-fade-in">
              <h1 style={{ marginBottom: '1rem', textAlign: 'center' }}>
                Extract Text with Precision
              </h1>
              <p style={{
                textAlign: 'center',
                margin: '0 auto 2rem',
                fontSize: '1.25rem',
                color: 'var(--ink-medium)',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic'
              }}>
                Upload any image containing text and let our advanced OCR engines
                transform it into editable, searchable content.
              </p>
              <div className="animate-fade-in stagger-2">
                <ImageUploader />
              </div>

              {/* Feature Pills */}
              <div className="animate-fade-in stagger-3" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '3rem',
                flexWrap: 'wrap'
              }}>
                <span className="area-badge" style={{ color: 'var(--ink-medium)' }}>
                  Multi-Language Support
                </span>
                <span className="area-badge" style={{ color: 'var(--ink-medium)' }}>
                  Area Selection
                </span>
                <span className="area-badge" style={{ color: 'var(--ink-medium)' }}>
                  Multiple OCR Engines
                </span>
                <span className="area-badge" style={{ color: 'var(--ink-medium)' }}>
                  Desktop Performance
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Editor Layout */
          <div style={{ padding: '2rem 0' }}>
            {/* Image Title Bar */}
            <div className="animate-fade-in" style={{
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--ink-faint)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                  {image.fileName}
                </h2>
                <span className="editorial-meta">
                  {image.width} × {image.height}px · {selectionAreas.length} selection{selectionAreas.length !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="area-badge" style={{
                borderColor: 'var(--accent-blue)',
                color: 'var(--accent-blue)'
              }}>
                {hasResults ? `${ocrResults.size} Extracted` : 'Ready to Process'}
              </span>
            </div>

            {/* Two-Column Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 380px',
              gap: '2rem',
              alignItems: 'start'
            }}>
              {/* Left Column - Canvas */}
              <div className="animate-fade-in stagger-1">
                <div className="canvas-container" style={{ borderRadius: '0' }}>
                  <ImageCanvas maxWidth={1200} maxHeight={800} />
                </div>
                <div className="canvas-info-bar" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0'
                }}>
                  <span>Draw to select areas</span>
                  <span>Double-click to remove</span>
                </div>
              </div>

              {/* Right Column - Controls & Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* OCR Controls */}
                <div className="animate-slide-in stagger-2">
                  <OCRControls />
                </div>

                {/* Results */}
                <div className="animate-slide-in stagger-3">
                  <ResultsPanel />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--ink-faint)',
        padding: '2rem',
        marginTop: '4rem',
        textAlign: 'center',
        background: 'var(--paper-warm)'
      }}>
        <div className="editorial-divider" style={{ margin: '0 0 1.5rem' }}></div>
        <p className="editorial-meta" style={{ margin: '0', textAlign: 'center' }}>
          Lexicon OCR · English · 한국어 · 日本語 · 简体中文
        </p>
        <p style={{
          margin: '0.5rem 0 0',
          fontSize: '0.875rem',
          color: 'var(--ink-light)',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic'
        }}>
          Precision text extraction for the desktop
        </p>
      </footer>

      {/* Settings Dialog */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;
