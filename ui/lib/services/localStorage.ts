'use client'

const STORAGE_KEY_PREFIX = 'koharu-textblocks-'

export const saveTextBlocksToStorage = (
  documentIndex: number,
  textBlocks: unknown[],
): void => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${documentIndex}`
    const data = JSON.stringify(textBlocks)
    sessionStorage.setItem(key, data)
  } catch (error) {
    console.error('Failed to save text blocks to sessionStorage:', error)
  }
}

export const loadTextBlocksFromStorage = (
  documentIndex: number,
): unknown[] | null => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${documentIndex}`
    const data = sessionStorage.getItem(key)
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to load text blocks from sessionStorage:', error)
    return null
  }
}

export const clearTextBlocksFromStorage = (documentIndex: number): void => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${documentIndex}`
    sessionStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear text blocks from sessionStorage:', error)
  }
}

export const getAllStoredDocumentIndices = (): number[] => {
  try {
    const indices: number[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const indexStr = key.replace(STORAGE_KEY_PREFIX, '')
        const index = parseInt(indexStr, 10)
        if (!Number.isNaN(index)) {
          indices.push(index)
        }
      }
    }
    return indices
  } catch {
    return []
  }
}

export const clearAllTextBlocksStorage = (): void => {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key))
  } catch (error) {
    console.error('Failed to clear all text blocks from sessionStorage:', error)
  }
}