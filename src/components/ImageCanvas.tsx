import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { Box } from '@mui/material';
import { useOCRStore } from '../state/store';
import useImage from 'use-image';
import { ENGINE_COLORS } from '../lib/constants';
import { useToast } from './ToastProvider';

interface ImageCanvasProps {
  maxWidth?: number;
  maxHeight?: number;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  maxWidth = 800,
  maxHeight = 600,
}) => {
  const { image, selectionAreas, addSelectionArea, removeSelectionArea, setSelectedAreaId } = useOCRStore();
  const [img] = useImage(image && image.dataUrl ? image.dataUrl : '');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const { showInfo, showSuccess } = useToast();

  // Calculate scale to fit image within bounds
  const scale = img
    ? Math.min(maxWidth / img.width, maxHeight / img.height, 1)
    : 1;

  const displayWidth = img ? img.width * scale : 0;
  const displayHeight = img ? img.height * scale : 0;

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target instanceof Konva.Rect) {
      // Clicked on an existing rectangle
      const rect = e.target;
      const area = selectionAreas.find((a) => a.id === rect.id());
      if (area) {
        setSelectedAreaId(area.id);
      }
      return;
    }

    // Start drawing a new rectangle
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    setIsDragging(true);
    setDragStart({ x: pointerPos.x, y: pointerPos.y });
    setSelectedAreaId(null);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDragging) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const width = pointerPos.x - dragStart.x;
    const height = pointerPos.y - dragStart.y;

    setCurrentRect({
      x: width > 0 ? dragStart.x : pointerPos.x,
      y: height > 0 ? dragStart.y : pointerPos.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    if (!isDragging || !currentRect) return;

    // Only add if rectangle has meaningful size
    if (currentRect.width > 10 && currentRect.height > 10) {
      // Convert display coordinates to original image coordinates
      const originalX = currentRect.x / scale;
      const originalY = currentRect.y / scale;
      const originalWidth = currentRect.width / scale;
      const originalHeight = currentRect.height / scale;

      // Assign a color to this area
      const colorIndex = selectionAreas.length % ENGINE_COLORS.length;

      const newArea = {
        id: `area-${Date.now()}`,
        x: originalX,
        y: originalY,
        width: originalWidth,
        height: originalHeight,
        color: ENGINE_COLORS[colorIndex],
      };

      addSelectionArea(newArea);
      showSuccess('Area created! Double-click to remove');
    }

    setIsDragging(false);
    setCurrentRect(null);
  };

  const handleRectDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const rect = e.target;
    const areaId = rect.id();
    removeSelectionArea(areaId);
    showInfo('Area removed');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        backgroundColor: 'grey.100',
      }}
    >
      <Stage
        width={displayWidth}
        height={displayHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {img && (
            <KonvaImage
              image={img}
              width={displayWidth}
              height={displayHeight}
            />
          )}

          {selectionAreas.map((area) => (
            <Rect
              key={area.id}
              id={area.id}
              x={area.x * scale}
              y={area.y * scale}
              width={area.width * scale}
              height={area.height * scale}
              fill={area.color}
              opacity={0.3}
              stroke={area.color}
              strokeWidth={2}
              dash={[5, 5]}
              onDblClick={handleRectDblClick}
            />
          ))}

          {currentRect && (
            <Rect
              x={currentRect.x}
              y={currentRect.y}
              width={currentRect.width}
              height={currentRect.height}
              fill="rgba(0, 123, 255, 0.3)"
              stroke="primary"
              strokeWidth={2}
              dash={[5, 5]}
            />
          )}
        </Layer>
      </Stage>
    </Box>
  );
};
