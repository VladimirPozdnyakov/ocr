import { invoke } from '@tauri-apps/api/core';
import type { OCRResult, OCREngineType } from '../lib/types';

interface PerformOCRPayload {
  imagePath: string;
  engineType: OCREngineType;
  language: string;
  area?: [number, number, number, number]; // [x, y, width, height]
}

export function useTauriIPC() {
  const performOCR = async (payload: PerformOCRPayload): Promise<OCRResult> => {
    try {
      console.log('Calling perform_ocr with:', {
        imagePath: payload.imagePath.substring(0, 50) + '...',
        engineType: payload.engineType,
        language: payload.language,
        area: payload.area
      });

      const result = await invoke<OCRResult>('perform_ocr', {
        imagePath: payload.imagePath,
        engineType: payload.engineType,
        language: payload.language,
        area: payload.area,
      });
      return result;
    } catch (error) {
      console.error('OCR failed:', error);
      throw error;
    }
  };

  const getAvailableEngines = async (): Promise<OCREngineType[]> => {
    try {
      const engines = await invoke<OCREngineType[]>('get_available_engines');
      return engines;
    } catch (error) {
      console.error('Failed to get available engines:', error);
      return ['ortheus', 'theseus', 'manga_o_c_r'];
    }
  };

  const getSupportedLanguages = async (
    engine: OCREngineType
  ): Promise<string[]> => {
    try {
      const languages = await invoke<string[]>('get_supported_languages', {
        engine,
      });
      return languages;
    } catch (error) {
      console.error('Failed to get supported languages:', error);
      return ['eng', 'kor', 'jpn', 'chi_sim', 'chi_tra'];
    }
  };

  return {
    performOCR,
    getAvailableEngines,
    getSupportedLanguages,
  };
}
