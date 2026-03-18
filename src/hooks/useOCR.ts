import { useCallback } from 'react';
import { useOCRStore } from '../state/store';
import { useTauriIPC } from './useTauriIPC';

export function useOCR() {
  const {
    image,
    ocrConfig,
    selectionAreas,
    setIsLoading,
    setOCRResult,
    clearResults,
  } = useOCRStore();

  const { performOCR } = useTauriIPC();

  const processImageArea = useCallback(
    async (areaId: string) => {
      if (!image?.dataUrl) {
        console.error('No image loaded');
        return;
      }

      const area = selectionAreas.find((a) => a.id === areaId);
      if (!area) {
        console.error('Area not found:', areaId);
        return;
      }

      setIsLoading(true);

      try {
        // Convert data URL to file path for Tauri
        // Note: In a real implementation, you'd need to save the data URL to a temp file
        // and pass that path to Tauri
        const result = await performOCR({
          imagePath: image.dataUrl, // This will need to be adjusted for Tauri
          engineType: ocrConfig.engine,
          language: ocrConfig.language,
          area: [
            Math.round(area.x),
            Math.round(area.y),
            Math.round(area.width),
            Math.round(area.height)
          ],
        });

        console.log('OCR result received:', result);
        setOCRResult(areaId, result);
        console.log('Result saved for area:', areaId);
      } catch (error) {
        console.error('Failed to process area:', areaId, error);
      } finally {
        setIsLoading(false);
      }
    },
    [image, ocrConfig, selectionAreas, performOCR, setIsLoading, setOCRResult]
  );

  const processFullImage = useCallback(async () => {
    if (!image?.dataUrl) {
      console.error('No image loaded');
      return;
    }

    setIsLoading(true);
    clearResults();

    try {
      const result = await performOCR({
        imagePath: image.dataUrl, // This will need to be adjusted for Tauri
        engineType: ocrConfig.engine,
        language: ocrConfig.language,
      });

      // For full image, use a special ID
      setOCRResult('full-image', result);
    } catch (error) {
      console.error('Failed to process full image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [image, ocrConfig, performOCR, setIsLoading, setOCRResult, clearResults]);

  const processAllAreas = useCallback(async () => {
    for (const area of selectionAreas) {
      await processImageArea(area.id);
    }
  }, [selectionAreas, processImageArea]);

  return {
    processImageArea,
    processFullImage,
    processAllAreas,
  };
}
