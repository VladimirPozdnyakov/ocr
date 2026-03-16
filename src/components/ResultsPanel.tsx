import { forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Download as ExportIcon,
  SelectAll as CopyAllIcon,
} from '@mui/icons-material';
import { useOCRStore } from '../state/store';
import { useToast } from './ToastProvider';

export interface ResultsPanelRef {
  handleCopyAllResults: () => void;
  handleExportResults: () => void;
}

export const ResultsPanel = forwardRef<ResultsPanelRef>((_props, ref) => {
  const { selectionAreas, ocrResults, removeOCRResult } = useOCRStore();
  const { showSuccess, showError, showInfo } = useToast();

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleCopyAllResults,
    handleExportResults,
  }));

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Text copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy text:', error);
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
      console.error('Failed to copy all results:', error);
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
      <Alert severity="info" sx={{ mt: 2 }}>
        No selection areas yet. Draw rectangles on the image to create OCR areas.
      </Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          OCR Results
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CopyAllIcon />}
            onClick={handleCopyAllResults}
            disabled={ocrResults.size === 0}
          >
            Copy All
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportResults}
            disabled={ocrResults.size === 0}
          >
            Export JSON
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {sortedAreas.map((area) => {
          const result = ocrResults.get(area.id);
          return (
            <Grid item xs={12} md={6} key={area.id}>
              <Card
                variant="outlined"
                sx={{
                  borderLeft: `4px solid ${area.color}`,
                  backgroundColor: result ? 'background.paper' : 'action.disabledBackground',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`#${area.id.split('-')[1] || area.id.slice(0, 8)}`}
                        size="small"
                        sx={{
                          backgroundColor: area.color,
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                      {result && (
                        <Chip
                          icon={<CheckIcon />}
                          label={`${(result.confidence * 100).toFixed(0)}%`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Box>
                      {result && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyText(result.text)}
                            title="Copy to clipboard"
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteResult(area.id)}
                            title="Delete result"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>

                  {result ? (
                    <>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Engine:</strong> {result.engine} | <strong>Language:</strong>{' '}
                        {result.language} | <strong>Time:</strong>{' '}
                        {result.processing_time_ms}ms
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          mt: 1,
                        }}
                      >
                        {result.text || '<empty result>'}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Not processed yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
});

ResultsPanel.displayName = 'ResultsPanel';
