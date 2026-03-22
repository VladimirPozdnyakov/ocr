import React from 'react';
import { useOCRStore } from '../state/store';
import { SUPPORTED_LANGUAGES, OCR_ENGINES } from '../lib/constants';
import { useOCR } from '../hooks/useOCR';

export const OCRControls: React.FC = () => {
  const {
    ocrConfig,
    setOCREngine,
    setLanguage,
    setConfidenceThreshold,
    isLoading,
    selectionAreas,
  } = useOCRStore();

  const { processFullImage, processAllAreas } = useOCR();

  return (
    <div className="editorial-card">
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.25rem',
        marginBottom: '0.25rem',
        fontWeight: 600
      }}>
        Configuration
      </h3>
      <p className="editorial-meta" style={{ marginBottom: '1.5rem' }}>
        OCR Engine & Language Settings
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* OCR Engine Selection */}
        <div>
          <label className="editorial-meta" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Engine
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '0.5rem'
          }}>
            {OCR_ENGINES.map((engine) => (
              <button
                key={engine}
                className={`editorial-button ${ocrConfig.engine === engine ? 'editorial-button-primary' : ''}`}
                onClick={() => setOCREngine(engine as any)}
                disabled={isLoading}
                style={{
                  justifyContent: 'center',
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  opacity: isLoading ? 0.5 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {engine}
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="editorial-meta" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Language
          </label>
          <select
            value={ocrConfig.language}
            onChange={(e) => setLanguage(e.target.value as any)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              border: '1px solid var(--ink-light)',
              background: 'var(--paper-white)',
              color: 'var(--ink-dark)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              borderRadius: 0
            }}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Confidence Threshold */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <label className="editorial-meta">Confidence Threshold</label>
            <span className="editorial-meta" style={{ color: 'var(--ink-dark)' }}>
              {(ocrConfig.confidence_threshold * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={ocrConfig.confidence_threshold}
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            disabled={isLoading}
            style={{
              width: '100%',
              height: '4px',
              background: 'var(--ink-faint)',
              outline: 'none',
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          />
        </div>

        <div className="editorial-divider" style={{ margin: '0.5rem 0' }}></div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            className="editorial-button editorial-button-primary"
            disabled={isLoading}
            onClick={processFullImage}
            style={{
              justifyContent: 'center',
              padding: '1rem',
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              position: 'relative'
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                Process Full Image
              </>
            )}
          </button>

          <button
            className="editorial-button"
            disabled={isLoading || selectionAreas.length === 0}
            onClick={processAllAreas}
            style={{
              justifyContent: 'center',
              padding: '1rem',
              opacity: (isLoading || selectionAreas.length === 0) ? 0.5 : 1,
              cursor: (isLoading || selectionAreas.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
                  <line x1="6" y1="17" x2="18" y2="17"></line>
                </svg>
                Process Areas ({selectionAreas.length})
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
