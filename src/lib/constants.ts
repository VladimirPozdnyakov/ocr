import { OCREngineType } from './types';

export const SUPPORTED_LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'kor', name: 'Korean' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'chi_sim', name: 'Chinese (Simplified)' },
  { code: 'chi_tra', name: 'Chinese (Traditional)' },
] as const;

export const OCR_ENGINES: OCREngineType[] = ['ortheus', 'theseus', 'manga_o_c_r'];

export const ENGINE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];

export const DEFAULT_CONFIG = {
  engine: 'ortheus' as const,
  language: 'eng' as const,
  confidence_threshold: 0.7,
};
