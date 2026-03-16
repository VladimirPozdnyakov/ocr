export interface SelectionArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  engine: string;
  language: string;
  processing_time_ms: number;
}

export interface ImageState {
  dataUrl: string | null;
  width: number;
  height: number;
  fileName: string;
}

export type OCREngineType = 'ortheus' | 'theseus' | 'manga_o_c_r';

export interface OCRConfig {
  engine: OCREngineType;
  language: 'eng' | 'kor' | 'jpn' | 'chi_sim' | 'chi_tra';
  confidence_threshold: number;
}
