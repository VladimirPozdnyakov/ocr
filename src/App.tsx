import React from 'react';
import { Container, Box, Typography, AppBar, Toolbar, Paper, Button } from '@mui/material';
import { TextFields as TextFieldsIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useOCRStore } from './state/store';
import { ImageUploader } from './components/ImageUploader';
import { ImageCanvas } from './components/ImageCanvas';
import { OCRControls } from './components/OCRControls';
import { ResultsPanel } from './components/ResultsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import './App.css';

function App() {
  const { image } = useOCRStore();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <TextFieldsIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            OCR Desktop
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mr: 2, display: { xs: 'none', sm: 'block' } }}>
            Multi-language OCR with Area Selection
          </Typography>
          <Button
            color="inherit"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {!image ? (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Welcome to OCR Desktop
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" paragraph>
              Upload an image to start extracting text with our advanced OCR engines
            </Typography>
            <ImageUploader />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '100%', md: '60% 40%' }, gap: 3, alignItems: 'start' }}>
            {/* Left Column - Image */}
            <Box>
              <Typography variant="h5" gutterBottom>
                {image.fileName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Dimensions: {image.width} × {image.height}px
              </Typography>
              <ImageCanvas maxWidth={1200} maxHeight={800} />
            </Box>

            {/* Right Column - Controls and Results */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* OCR Controls */}
              <Box>
                <OCRControls />
              </Box>

              {/* Results Panel */}
              <Box>
                <ResultsPanel />
              </Box>
            </Box>
          </Box>
        )}
      </Container>

      {/* Footer */}
      <Paper
        elevation={0}
        sx={{
          py: 2,
          textAlign: 'center',
          backgroundColor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          OCR Desktop Application • Supports English, Korean, Japanese, Chinese
        </Typography>
      </Paper>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}

export default App;
