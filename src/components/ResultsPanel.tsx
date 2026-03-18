import { forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
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

  // Debug logging
  console.log('ResultsPanel render:', {
    selectionAreas: selectionAreas.length,
    ocrResults: ocrResults.size,
    areaIds: selectionAreas.map(a => a.id),
    resultIds: Array.from(ocrResults.keys())
  });

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
    <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
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
            Export
          </Button>
        </Box>
      </Box>

      <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>#</TableCell>
              <TableCell>Text</TableCell>
              <TableCell sx={{ width: 80 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAreas.map((area) => {
              const result = ocrResults.get(area.id);
              const areaNumber = area.number;

              return (
                <TableRow
                  key={area.id}
                  sx={{
                    borderLeft: `4px solid ${area.color}`,
                    backgroundColor: result ? 'inherit' : 'action.disabledBackground',
                    '&:hover': {
                      backgroundColor: result ? 'action.hover' : 'action.disabledBackground',
                    },
                  }}
                >
                  <TableCell>
                    <Chip
                      label={areaNumber}
                      size="small"
                      sx={{
                        backgroundColor: area.color,
                        color: 'white',
                        fontWeight: 'bold',
                        minWidth: 40,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    {result ? (
                      <Box sx={{ width: '100%' }}>
                        <Tooltip
                          title={
                            <Box sx={{ fontSize: '0.75rem', maxWidth: '80vw' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                {result.text}
                              </div>
                              <div style={{ marginTop: '8px', fontSize: '0.7rem', opacity: 0.8 }}>
                                Engine: {result.engine} | Language: {result.language} | Time: {result.processing_time_ms}ms
                              </div>
                            </Box>
                          }
                          arrow
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              cursor: 'help',
                              color: 'text.primary',
                              width: '100%',
                            }}
                          >
                            {result.text || '<empty result>'}
                          </Typography>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Not processed yet
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    {result && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Copy text">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyText(result.text)}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete result">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteResult(area.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
});

ResultsPanel.displayName = 'ResultsPanel';
