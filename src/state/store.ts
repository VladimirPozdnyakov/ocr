import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  SelectionArea,
  OCRResult,
  ImageState,
  OCRConfig,
  OCREngineType,
} from '../lib/types';

interface OCRStore {
  // Image state
  image: ImageState | null;
  setImage: (image: ImageState | null) => void;

  // Selection areas
  selectionAreas: SelectionArea[];
  addSelectionArea: (area: SelectionArea) => void;
  updateSelectionArea: (id: string, updates: Partial<SelectionArea>) => void;
  removeSelectionArea: (id: string) => void;
  clearSelectionAreas: () => void;
  renumberAreas: () => void;

  // OCR config
  ocrConfig: OCRConfig;
  setOCREngine: (engine: OCREngineType) => void;
  setLanguage: (language: OCRConfig['language']) => void;
  setConfidenceThreshold: (threshold: number) => void;

  // Results (stored as array for JSON serialization)
  ocrResults: Map<string, OCRResult>;
  ocrResultsArray: [string, OCRResult][];
  setOCRResult: (areaId: string, result: OCRResult) => void;
  removeOCRResult: (areaId: string) => void;
  clearResults: () => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedAreaId: string | null;
  setSelectedAreaId: (id: string | null) => void;

  // Derived state
  getOCRResultForArea: (areaId: string) => OCRResult | undefined;
}

export const useOCRStore = create<OCRStore>()(
  persist(
    (set, get) => ({
      // Initial state
      image: null,
      selectionAreas: [],
      ocrConfig: {
        engine: 'ortheus',
        language: 'eng',
        confidence_threshold: 0.7,
      },
      ocrResults: new Map(),
      ocrResultsArray: [],
      isLoading: false,
      selectedAreaId: null,

      // Image actions
      setImage: (image) => set({ image }),

      // Selection area actions
      addSelectionArea: (area) =>
        set((state) => ({
          selectionAreas: [...state.selectionAreas, area],
        })),

      updateSelectionArea: (id, updates) =>
        set((state) => ({
          selectionAreas: state.selectionAreas.map((area) =>
            area.id === id ? { ...area, ...updates } : area
          ),
        })),

      removeSelectionArea: (id) => {
        set((state) => ({
          selectionAreas: state.selectionAreas.filter((area) => area.id !== id),
          ocrResults: (() => {
            const newResults = new Map(state.ocrResults);
            newResults.delete(id);
            return newResults;
          })(),
        }));

        // Renumber remaining areas
        get().renumberAreas();
      },

      renumberAreas: () => {
        set((state) => {
          const updatedAreas = state.selectionAreas.map((area, index) => ({
            ...area,
            number: index + 1,
          }));

          return {
            selectionAreas: updatedAreas,
          };
        });
      },

      clearSelectionAreas: () =>
        set({
          selectionAreas: [],
          ocrResults: new Map(),
          ocrResultsArray: [],
        }),

      // OCR config actions
      setOCREngine: (engine) =>
        set((state) => ({
          ocrConfig: { ...state.ocrConfig, engine },
        })),

      setLanguage: (language) =>
        set((state) => ({
          ocrConfig: { ...state.ocrConfig, language },
        })),

      setConfidenceThreshold: (confidence_threshold) =>
        set((state) => ({
          ocrConfig: { ...state.ocrConfig, confidence_threshold },
        })),

      // Results actions
      setOCRResult: (areaId, result) =>
        set((state) => {
          const newResults = new Map(state.ocrResults);
          newResults.set(areaId, result);
          return {
            ocrResults: newResults,
            ocrResultsArray: Array.from(newResults.entries()),
          };
        }),

      removeOCRResult: (areaId) =>
        set((state) => {
          const newResults = new Map(state.ocrResults);
          newResults.delete(areaId);
          return {
            ocrResults: newResults,
            ocrResultsArray: Array.from(newResults.entries()),
          };
        }),

      clearResults: () =>
        set({
          ocrResults: new Map(),
          ocrResultsArray: [],
        }),

      // UI state actions
      setIsLoading: (isLoading) => set({ isLoading }),
      setSelectedAreaId: (selectedAreaId) => set({ selectedAreaId }),

      // Derived state
      getOCRResultForArea: (areaId) => get().ocrResults.get(areaId),
    }),
    {
      name: 'ocr-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ocrConfig: state.ocrConfig,
        // Don't persist image, selectionAreas, or results as they're session-specific
        // Don't persist UI state as it's temporary
      }),
      onRehydrateStorage: () => (state) => {
        // Rehydrate Map from array
        if (state && state.ocrResultsArray) {
          state.ocrResults = new Map(state.ocrResultsArray);
        }
      },
    }
  )
);
