# Editorial Typography Redesign — Lexicon OCR

## Overview

A complete UI overhaul transforming OCR Desktop into **Lexicon**, an editorial-inspired interface that celebrates typography and text extraction as its core purpose.

## Design Philosophy

### Aesthetic Direction: Editorial/Typographic

- **Typography-first design**: Beautiful serif and sans-serif font combinations that elevate text to hero status
- **Print-inspired layouts**: Grid systems, generous white space, and editorial magazine-style presentations
- **Warm paper tones**: Cream/off-white backgrounds that evoke printed pages rather than digital screens
- **Sophisticated accents**: Deep ink blacks, refined reds, and professional blues

## Color Palette

```
Paper & Ink:
- Paper White:     #FAF8F3  (Main background)
- Paper Warm:      #F5F2EB  (Secondary backgrounds)
- Paper Cream:     #F0EDE4  (Subtle variations)

Ink Colors:
- Ink Black:       #1A1614  (Primary text, headings)
- Ink Dark:        #2D2A26  (Body text)
- Ink Medium:      #5C5852  (Secondary text)
- Ink Light:       #8A8680  (Meta, captions)
- Ink Faint:       #B8B4AC  (Borders, dividers)

Editorial Accents:
- Accent Red:      #C73E3A  (Highlights, CTAs)
- Accent Blue:     #2C5F8D  (Information, badges)
- Accent Gold:     #B8976E  (Subtle highlights)
```

## Typography System

### Font Families

- **Display Font**: `Crimson Pro` (Beautiful serif for headings and large text)
- **Body Font**: `Source Sans 3` (Clean sans-serif for UI and controls)
- **Mono Font**: `JetBrains Mono` (Technical information, metadata)

### Type Scale

```
H1: 2.5rem → 4rem (clamp)
H2: 1.75rem → 2.5rem (clamp)
H3: 1.25rem → 1.5rem (clamp)
Body: 1rem (base)
Meta: 0.75rem (uppercase, letter-spaced)
```

## Key Components

### 1. Welcome/Landing Screen
- Bold serif headline with italic subheadline
- Feature pills showcasing capabilities
- Elegant upload zone with dashed border
- Staggered fade-in animations

### 2. Header
- Minimal logo with "L" mark
- Sticky positioning with backdrop blur
- Clean settings button

### 3. Image Canvas
- Editorial frame with paper-warm background
- Crosshair cursor for precision
- Dashed selection rectangles with color coding
- Info bar with instructional text

### 4. Results Panel
- Magazine-style numbered cards
- Extracted text displayed prominently
- Metadata in monospace (engine, confidence, time)
- Copy and export actions

### 5. Controls Panel
- Engine selection with button grid
- Language dropdown with editorial styling
- Confidence slider with percentage display
- Primary/secondary button hierarchy

### 6. Settings Dialog
- Dark "About" section (inverted colors)
- Toggle switches with descriptions
- Current configuration display

## Layout System

### Spacing Scale
```
xs: 0.25rem   (4px)
sm: 0.5rem    (8px)
md: 1rem      (16px)
lg: 1.5rem    (24px)
xl: 2rem      (32px)
2xl: 3rem     (48px)
3xl: 4rem     (64px)
```

### Grid Structure
- Container max-width: 1400px
- Two-column layout: Canvas (flex) + Controls/Results (380px fixed)
- Responsive: Stacks vertically on mobile

## Animations

- `fadeInUp`: Content reveals with vertical motion
- `slideInLeft`: Side panels slide in from left
- `shimmer`: Loading state with gradient animation
- Staggered delays (0.1s, 0.2s, 0.3s, 0.4s)

## Custom Components

### Editorial Badge
```tsx
<span className="area-badge" style={{ color: 'var(--accent-blue)' }}>
  Multi-Language Support
</span>
```

### Editorial Card
```tsx
<div className="editorial-card">
  Content with subtle border and shadow
</div>
```

### Numbered Card
```tsx
<div className="editorial-card-numbered" data-number="01">
  Automatic large number watermark
</div>
```

### Editorial Divider
```tsx
<div className="editorial-divider"></div>
<!-- Fades from transparent → visible → transparent -->
```

## File Changes

### Updated Files
- `index.html` — Added Google Fonts (Crimson Pro, Source Sans 3, JetBrains Mono)
- `src/App.tsx` — Complete layout restructure with editorial markup
- `src/App.css` — New design system with CSS variables and animations
- `src/components/ImageUploader.tsx` — Redesigned upload zone
- `src/components/OCRControls.tsx` — Editorial control panel
- `src/components/ResultsPanel.tsx` — Magazine-style results display
- `src/components/ImageCanvas.tsx` — Updated canvas styling
- `src/components/SettingsPanel.tsx` — Redesigned settings dialog

## Responsive Design

- Mobile: Single column, reduced spacing
- Tablet: Adjusted two-column layout
- Desktop: Full editorial experience

## Accessibility

- Semantic HTML (header, main, footer)
- Proper heading hierarchy
- Focus states on interactive elements
- Sufficient color contrast
- Keyboard navigation support

## Running the Application

```bash
# Development
npm run tauri:dev

# Production build
npm run tauri:build
```

## Future Enhancements

Consider adding:
- Dark mode toggle (with editorial dark theme)
- Keyboard shortcuts
- Export to PDF (with editorial formatting)
- Custom font size controls
- Print stylesheet for results

---

**Design Goal**: Create an OCR application that feels like a premium editorial tool, where the extraction and display of text is celebrated through beautiful typography and thoughtful layout.
