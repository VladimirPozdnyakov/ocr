import React, { useState, useRef } from 'react';
import { Button, Box, Typography, alpha } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useOCRStore } from '../state/store';
import { useToast } from './ToastProvider';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

export const ImageUploader: React.FC = () => {
  const { setImage } = useOCRStore();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleFileUpload = (file: File | null) => {
    if (!file) return;

    console.log('Handling file upload:', file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      console.log('FileReader onload triggered');
      const dataUrl = e.target?.result as string;
      console.log('DataURL length:', dataUrl?.length);

      const img = new Image();

      img.onload = () => {
        console.log('Image loaded:', img.width, 'x', img.height);
        setImage({
          dataUrl,
          width: img.width,
          height: img.height,
          fileName: file.name,
        });
        showSuccess('Image loaded successfully!');
      };

      img.onerror = (error) => {
        console.error('Image load error:', error);
        showError('Failed to load image');
      };

      img.src = dataUrl;
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      showError('Failed to read file');
    };

    reader.readAsDataURL(file);
  };

  const handleTauriFileUpload = async () => {
    try {
      console.log('Opening Tauri file dialog...');

      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Image',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
        }]
      });

      console.log('Selected file path:', selected);

      if (selected && typeof selected === 'string') {
        // Use Tauri command to read the file
        console.log('Reading file with Tauri command...');
        const dataUrl = await invoke<string>('read_image_file', {
          filePath: selected
        });

        console.log('Got data URL, length:', dataUrl.length);

        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          console.log('Image loaded:', img.width, 'x', img.height);
          setImage({
            dataUrl,
            width: img.width,
            height: img.height,
            fileName: selected.split('/').pop() || 'image',
          });
          showSuccess('Image loaded successfully!');
        };
        img.onerror = () => {
          console.error('Failed to load image from data URL');
          showError('Failed to load image');
        };
        img.src = dataUrl;
      }
    } catch (error) {
      console.error('Error in Tauri file upload:', error);
      showError(`Failed to load image: ${error}`);
    }
  };

  const handleClick = () => {
    handleTauriFileUpload();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFileUpload(file || null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0] || null);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        border: '4px dashed',
        borderColor: isDragging ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        backgroundColor: isDragging
          ? alpha('#1976d2', 0.1)
          : 'grey.50',
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: alpha('#1976d2', 0.05),
        },
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CloudUploadIcon
        sx={{
          fontSize: 80,
          color: isDragging ? 'primary.main' : 'grey.400',
          mb: 2,
          transition: 'color 0.3s',
        }}
      />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Upload an image to start
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Supports PNG, JPG, JPEG, GIF, BMP, WEBP
      </Typography>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        Drag & drop or click to browse
      </Typography>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/bmp,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button
        variant="contained"
        startIcon={<CloudUploadIcon />}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        sx={{ mt: 2 }}
      >
        Choose File
      </Button>
    </Box>
  );
};
