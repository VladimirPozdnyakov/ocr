import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControlLabel,
  Switch,
  Box,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Info as InfoIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
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
  const [darkMode, setDarkMode] = useState(false);

  const handleRestoreDefaults = () => {
    setOCREngine('ortheus');
    setLanguage('eng');
    setConfidenceThreshold(0.7);
    setAutoProcess(false);
    setShowConfidence(true);
    setDarkMode(false);
    showSuccess('Settings restored to defaults');
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
            Settings
          </Typography>
          <Tooltip title="Restore defaults">
            <IconButton onClick={handleRestoreDefaults} size="small">
              <RestoreIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* OCR Settings */}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          OCR Configuration
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Current Engine: <strong>{ocrConfig.engine}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current Language: <strong>
              {SUPPORTED_LANGUAGES.find(l => l.code === ocrConfig.language)?.name}
            </strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Confidence Threshold: <strong>{ocrConfig.confidence_threshold.toFixed(2)}</strong>
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Behavior Settings */}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Behavior
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoProcess}
                onChange={(e) => setAutoProcess(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-process areas after creation"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
            Automatically run OCR when you create a new selection area
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                color="primary"
              />
            }
            label="Show confidence scores"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
            Display confidence percentage on result cards
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Appearance Settings */}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Appearance
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                color="primary"
              />
            }
            label="Dark mode (experimental)"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
            Enable dark theme for the application
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* About */}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          About
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>OCR Desktop</strong> v0.1.0
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-language OCR with area selection
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Engines: {OCR_ENGINES.join(', ')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Languages: {SUPPORTED_LANGUAGES.length} supported
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          <InfoIcon fontSize="small" color="info" />
          <Typography variant="caption" color="text.secondary">
            Settings are automatically saved
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export const SettingsButton: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  return (
    <Tooltip title="Settings">
      <IconButton
        onClick={onOpen}
        color="inherit"
        sx={{
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <SettingsIcon />
      </IconButton>
    </Tooltip>
  );
};
