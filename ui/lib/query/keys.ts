export const queryKeys = {
  documents: {
    all: ['documents'] as const,
    count: ['documents', 'count'] as const,
    currentRoot: ['documents', 'current'] as const,
    current: (index: number) => ['documents', 'current', index] as const,
    thumbnailRoot: ['documents', 'thumbnail'] as const,
    thumbnail: (documentsVersion: number, index: number) =>
      ['documents', 'thumbnail', documentsVersion, index] as const,
  },
  fonts: ['fonts'] as const,
  device: {
    info: ['device', 'info'] as const,
  },
  app: {
    version: ['app', 'version'] as const,
  },
} as const
