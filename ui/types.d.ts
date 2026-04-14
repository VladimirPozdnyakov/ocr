export type RgbaColor = [number, number, number, number]

export type TextAlign = 'left' | 'center' | 'right'

export type NamedFontPrediction = {
  index: number
  name: string
  language?: string
  probability: number
  serif: boolean
}

export type TextDirection = 'Horizontal' | 'Vertical'

export type FontPrediction = {
  top_fonts: [number, number][]
  named_fonts: NamedFontPrediction[]
  direction: TextDirection
  text_color: [number, number, number]
  stroke_color: [number, number, number]
  font_size_px: number
  stroke_width_px: number
  line_height: number
  angle_deg: number
}

export type TextStyle = {
  fontFamilies: string[]
  fontSize?: number
  color: RgbaColor
  textAlign?: TextAlign
}

export type TextBlock = {
  id?: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
  linePolygons?: [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ][]
  sourceDirection?: TextDirection
  renderedDirection?: TextDirection
  rotationDeg?: number
  detectedFontSizePx?: number
  detector?: string
  text?: string
  style?: TextStyle
  fontPrediction?: FontPrediction
}

export type ToolMode = 'select' | 'block'

export type Document = {
  id: string
  path: string
  name: string
  image: Uint8Array
  width: number
  height: number
  revision?: number
  textBlocks: TextBlock[]
  segment?: Uint8Array
}
