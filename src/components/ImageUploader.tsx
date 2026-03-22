import React, { useState, useRef } from 'react';
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        setImage({
          dataUrl,
          width: img.width,
          height: img.height,
          fileName: file.name,
        });
        showSuccess('Image loaded successfully!');
      };

      img.onerror = () => {
        showError('Failed to load image');
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      showError('Failed to read file');
    };

    reader.readAsDataURL(file);
  };

  const handleTauriFileUpload = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Image',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
        }]
      });

      if (selected && typeof selected === 'string') {
        const dataUrl = await invoke<string>('read_image_file', {
          filePath: selected
        });

        const img = new Image();
        img.onload = () => {
          setImage({
            dataUrl,
            width: img.width,
            height: img.height,
            fileName: selected.split('/').pop() || 'image',
          });
          showSuccess('Image loaded successfully!');
        };
        img.onerror = () => {
          showError('Failed to load image');
        };
        img.src = dataUrl;
      }
    } catch (error) {
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
    <div
      className={`upload-zone ${isDragging ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <svg
        className="upload-zone-icon"
        viewBox="0 0 24 24"
        style={{ stroke: isDragging ? 'var(--ink-black)' : 'var(--ink-medium)' }}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>

      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.5rem',
        fontWeight: 600,
        marginBottom: '0.5rem',
        color: 'var(--ink-dark)'
      }}>
        {isDragging ? 'Drop your image here' : 'Upload an image'}
      </h3>

      <p style={{
        margin: '0 0 1.5rem',
        color: 'var(--ink-medium)',
        fontSize: '1rem'
      }}>
        Drag & drop or click to browse
      </p>

      <span className="editorial-meta" style={{ marginBottom: '1rem', display: 'block' }}>
        PNG · JPG · JPEG · GIF · BMP · WEBP
      </span>

      <button
        className="editorial-button editorial-button-primary"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        style={{ marginTop: '1rem' }}
      >
        Choose File
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/bmp,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};
