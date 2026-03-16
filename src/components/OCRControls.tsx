import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
  ButtonGroup,
  CircularProgress,
} from '@mui/material';
import {
  Fullscreen as FullImageIcon,
  CropFree as ProcessAreasIcon,
} from '@mui/icons-material';
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

  const handleConfidenceChange = (_event: Event, newValue: number | number[]) => {
    setConfidenceThreshold(newValue as number);
  };

  const handleProcessFullImage = async () => {
    await processFullImage();
  };

  const handleProcessAreas = async () => {
    await processAllAreas();
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        OCR Configuration
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* OCR Engine Selection */}
        <FormControl fullWidth>
          <InputLabel id="ocr-engine-label">OCR Engine</InputLabel>
          <Select
            labelId="ocr-engine-label"
            value={ocrConfig.engine}
            label="OCR Engine"
            onChange={(e) => setOCREngine(e.target.value as any)}
            disabled={isLoading}
          >
            {OCR_ENGINES.map((engine: any) => (
              <MenuItem key={engine} value={engine}>
                {engine}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Language Selection */}
        <FormControl fullWidth>
          <InputLabel id="language-label">Language</InputLabel>
          <Select
            labelId="language-label"
            value={ocrConfig.language}
            label="Language"
            onChange={(e) => setLanguage(e.target.value as any)}
            disabled={isLoading}
          >
            {SUPPORTED_LANGUAGES.map((lang: any) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Confidence Threshold */}
        <Box>
          <Typography id="confidence-label" gutterBottom>
            Confidence Threshold: {ocrConfig.confidence_threshold.toFixed(2)}
          </Typography>
          <Slider
            value={ocrConfig.confidence_threshold}
            onChange={handleConfidenceChange}
            min={0}
            max={1}
            step={0.05}
            valueLabelDisplay="auto"
            aria-labelledby="confidence-label"
            disabled={isLoading}
          />
        </Box>

        {/* Action Buttons */}
        <ButtonGroup
          variant="contained"
          fullWidth
          disabled={isLoading}
          orientation="vertical"
        >
          <Button
            startIcon={isLoading ? <CircularProgress size={20} /> : <FullImageIcon />}
            disabled={isLoading}
            onClick={handleProcessFullImage}
          >
            Process Full Image
          </Button>
          <Button
            startIcon={isLoading ? <CircularProgress size={20} /> : <ProcessAreasIcon />}
            disabled={isLoading || selectionAreas.length === 0}
            onClick={handleProcessAreas}
          >
            Process Areas ({selectionAreas.length})
          </Button>
        </ButtonGroup>

        {/* Info */}
        <Typography variant="caption" color="text.secondary">
          Double-click on any selection area to remove it. Results will be displayed in the
          panel below.
        </Typography>
      </Box>
    </Paper>
  );
};
