import React, { useState } from 'react';
import { useOCRStore } from '../state/store';
import { SUPPORTED_LANGUAGES, OCR_ENGINES } from '../lib/constants';
import { useToast } from './ToastProvider';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ open, onClose }) => {
  const { ocrConfig, setOCREngine, setLanguage, setConfidenceThreshold } = useOCRStore();
  const { showSuccess } = useToast();

  const [autoProcess, setAutoProcess] = useState(false);
  const [showConfidence, setShowConfidence] = useState(true);

  const handleRestoreDefaults = () => {
    setOCREngine('ortheus');
    setLanguage('eng');
    setConfidenceThreshold(0.7);
    setAutoProcess(false);
    setShowConfidence(true);
    showSuccess('Settings restored to defaults');
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 22, 20, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="editorial-card"
        style={{
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          background: 'var(--paper-white)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--ink-faint)'
        }}>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '0.25rem'
            }}>
              Settings
            </h3>
            <p className="editorial-meta" style={{ margin: 0 }}>
              Configure your OCR experience
            </p>
          </div>
          <button
            onClick={handleRestoreDefaults}
            className="editorial-button"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            title="Restore defaults"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            Reset
          </button>
        </div>

        {/* OCR Configuration */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="editorial-meta" style={{ marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            Current Configuration
          </p>
          <div style={{
            background: 'var(--paper-warm)',
            padding: '1rem',
            border: '1px solid var(--ink-faint)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--ink-faint)'
            }}>
              <span style={{ color: 'var(--ink-medium)', fontSize: '0.875rem' }}>Engine</span>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                {ocrConfig.engine}
              </strong>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--ink-faint)'
            }}>
              <span style={{ color: 'var(--ink-medium)', fontSize: '0.875rem' }}>Language</span>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                {SUPPORTED_LANGUAGES.find(l => l.code === ocrConfig.language)?.name}
              </strong>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0'
            }}>
              <span style={{ color: 'var(--ink-medium)', fontSize: '0.875rem' }}>Confidence</span>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                {(ocrConfig.confidence_threshold * 100).toFixed(0)}%
              </strong>
            </div>
          </div>
        </div>

        {/* Behavior Settings */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="editorial-meta" style={{ marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            Behavior
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              background: 'var(--paper-warm)',
              border: '1px solid var(--ink-faint)'
            }}>
              <input
                type="checkbox"
                checked={autoProcess}
                onChange={(e) => setAutoProcess(e.target.checked)}
                style={{ marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Auto-process areas
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-medium)' }}>
                  Automatically run OCR when you create a new selection area
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              background: 'var(--paper-warm)',
              border: '1px solid var(--ink-faint)'
            }}>
              <input
                type="checkbox"
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                style={{ marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Show confidence scores
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-medium)' }}>
                  Display confidence percentage on result cards
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* About */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="editorial-meta" style={{ marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            About
          </p>
          <div style={{
            background: 'var(--ink-black)',
            color: 'var(--paper-white)',
            padding: '1.5rem',
            fontFamily: 'var(--font-display)'
          }}>
            <h4 style={{
              color: 'var(--paper-white)',
              fontSize: '1.25rem',
              marginBottom: '0.5rem',
              fontWeight: 600
            }}>
              Lexicon
            </h4>
            <p style={{
              color: 'var(--ink-light)',
              fontSize: '0.875rem',
              margin: '0.5rem 0',
              fontFamily: 'var(--font-body)'
            }}>
              Version 0.1.0
            </p>
            <p style={{
              color: 'var(--ink-light)',
              fontSize: '0.875rem',
              margin: '0.5rem 0',
              fontFamily: 'var(--font-body)'
            }}>
              Multi-language OCR with area selection
            </p>
            <div className="editorial-divider" style={{ margin: '1rem 0', borderColor: 'var(--ink-medium)' }}></div>
            <p style={{
              color: 'var(--ink-light)',
              fontSize: '0.75rem',
              margin: 0,
              fontFamily: 'var(--font-mono)'
            }}>
              Engines: {OCR_ENGINES.join(' · ')}
            </p>
            <p style={{
              color: 'var(--ink-light)',
              fontSize: '0.75rem',
              margin: '0.5rem 0 0',
              fontFamily: 'var(--font-mono)'
            }}>
              {SUPPORTED_LANGUAGES.length} languages supported
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '1rem 0',
          borderTop: '1px solid var(--ink-faint)',
          marginTop: '1rem'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-light)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span className="editorial-meta">Settings are automatically saved</span>
        </div>

        {/* Close Button */}
        <button
          className="editorial-button editorial-button-primary"
          onClick={onClose}
          style={{
            justifyContent: 'center',
            padding: '1rem',
            marginTop: '1rem'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};
