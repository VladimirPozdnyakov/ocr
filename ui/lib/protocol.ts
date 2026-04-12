import type {
  FontPrediction as UiFontPrediction,
  NamedFontPrediction as UiNamedFontPrediction,
  TextAlign as UiTextAlign,
  TextDirection as UiTextDirection,
  TextStyle as UiTextStyle,
} from '@/types'

import type { ApiKeyResponse } from '@/lib/generated/protocol/ApiKeyResponse'
import type { ApiKeyValue } from '@/lib/generated/protocol/ApiKeyValue'
import type { CreateTextBlock } from '@/lib/generated/protocol/CreateTextBlock'
import type { DownloadState as GeneratedDownloadState } from '@/lib/generated/protocol/DownloadState'
import type { DocumentChangedEvent as GeneratedDocumentChangedEvent } from '@/lib/generated/protocol/DocumentChangedEvent'
import type { DocumentDetail as GeneratedDocumentDetail } from '@/lib/generated/protocol/DocumentDetail'
import type { DocumentsChangedEvent as GeneratedDocumentsChangedEvent } from '@/lib/generated/protocol/DocumentsChangedEvent'
import type { DocumentSummary as GeneratedDocumentSummary } from '@/lib/generated/protocol/DocumentSummary'
import type { ExportResult } from '@/lib/generated/protocol/ExportResult'
import type { FontFaceInfo } from '@/lib/generated/protocol/FontFaceInfo'
import type { ImportMode } from '@/lib/generated/protocol/ImportMode'
import type { ImportResult as GeneratedImportResult } from '@/lib/generated/protocol/ImportResult'
import type { JobState } from '@/lib/generated/protocol/JobState'
import type { JobStatus } from '@/lib/generated/protocol/JobStatus'
import type { MetaInfo } from '@/lib/generated/protocol/MetaInfo'
import type { PipelineJobRequest } from '@/lib/generated/protocol/PipelineJobRequest'
import type { SnapshotEvent as GeneratedSnapshotEvent } from '@/lib/generated/protocol/SnapshotEvent'
import type { TextBlockDetail as GeneratedTextBlockDetail } from '@/lib/generated/protocol/TextBlockDetail'
import type { TransferStatus } from '@/lib/generated/protocol/TransferStatus'

export type {
  ApiKeyResponse,
  ApiKeyValue,
  CreateTextBlock,
  ExportResult,
  FontFaceInfo,
  ImportMode,
  JobState,
  JobStatus,
  MetaInfo,
  PipelineJobRequest,
  TransferStatus,
}

export type TextAlign = UiTextAlign
export type TextDirection = UiTextDirection
export type TextStyle = UiTextStyle
export type NamedFontPrediction = UiNamedFontPrediction
export type FontPrediction = UiFontPrediction

export type DocumentSummary = Omit<GeneratedDocumentSummary, 'revision'> & {
  revision: number
}

export type TextBlockDetail = Omit<
  GeneratedTextBlockDetail,
  'style' | 'fontPrediction'
> & {
  style: TextStyle | null
  fontPrediction: FontPrediction | null
}

export type DocumentDetail = Omit<
  GeneratedDocumentDetail,
  'revision' | 'textBlocks'
> & {
  revision: number
  textBlocks: TextBlockDetail[]
}

export type TextBlockPatch = {
  text?: string
  x?: number
  y?: number
  width?: number
  height?: number
  style?: TextStyle
}

export type DocumentChangedEvent = Omit<
  GeneratedDocumentChangedEvent,
  'revision'
> & {
  revision: number
}

export type DocumentsChangedEvent = Omit<
  GeneratedDocumentsChangedEvent,
  'documents'
> & {
  documents: DocumentSummary[]
}

export type DownloadState = Omit<
  GeneratedDownloadState,
  'downloaded' | 'total'
> & {
  downloaded: number
  total: number | null
}

export type ImportResult = Omit<GeneratedImportResult, 'documents'> & {
  documents: DocumentSummary[]
}

export type SnapshotEvent = Omit<
  GeneratedSnapshotEvent,
  'documents' | 'downloads'
> & {
  documents: DocumentSummary[]
  downloads: DownloadState[]
}
