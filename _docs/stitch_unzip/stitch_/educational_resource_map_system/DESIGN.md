---
name: Educational Resource Map System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#424751'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#737783'
  outline-variant: '#c2c6d3'
  surface-tint: '#205daf'
  primary: '#004d9d'
  on-primary: '#ffffff'
  primary-container: '#2c66b8'
  on-primary-container: '#dce6ff'
  inverse-primary: '#aac7ff'
  secondary: '#006e1c'
  on-secondary: '#ffffff'
  secondary-container: '#91f78e'
  on-secondary-container: '#00731e'
  tertiary: '#664b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#836200'
  on-tertiary-container: '#ffe3ae'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458e'
  secondary-fixed: '#94f990'
  secondary-fixed-dim: '#78dc77'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005313'
  tertiary-fixed: '#ffdf9e'
  tertiary-fixed-dim: '#fabd00'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.4'
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.5'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Lexend
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  map-overlay-gap: 12px
---

## Brand & Style
The brand personality focuses on being a **reliable educational companion** for parents of elementary school children. It balances professionalism with a warm, approachable atmosphere, moving away from cold institutional aesthetics toward a "Soft Corporate" style.

The design system employs a **Modern Corporate** approach with a touch of **Tactile warmth**. This is achieved through generous whitespace, high-legibility typography, and subtle depth cues that make digital interfaces feel intuitive and safe. The emotional goal is to reduce cognitive load for busy parents while providing a sense of organized, high-quality information.

## Colors
The color palette is rooted in a "Warm Trust" theme. 
- **Primary (Warm Blue):** A deep, reassuring blue used for primary navigation and core branding.
- **Secondary (Soft Green):** Used for "Online" resources and growth-related indicators.
- **Tertiary (Sunny Yellow):** Used sparingly as an accent for highlights and "New" indicators to maintain a cheerful mood.
- **Grade Coding:** Distinct colors are assigned to grade groups (Lower: 1-2, Middle: 3-4, Upper: 5-6) to allow for instant visual filtering on the map.
- **Neutrals:** Uses soft grays and off-whites to prevent eye strain and maintain a clean, organized look.

## Typography
This design system prioritizes **extreme legibility** and a friendly tone.
- **Headlines:** Use *Plus Jakarta Sans* for its slightly rounded terminals and optimistic character.
- **Body Text:** Use *Inter* for maximum clarity in information-dense areas like location descriptions and lists.
- **Labels & UI Metadata:** Use *Lexend* for filters and icons to leverage its origin as a font designed for better reading performance in educational contexts.
- **Hierarchy:** Maintain a clear scale where headers are noticeably larger and bolder than body text to assist in quick scanning.

## Layout & Spacing
The system utilizes a **8px grid-based rhythm**. 
- **Map View:** A full-bleed layout where the map is the canvas. UI elements float as "Floating Action Sheets" or "Overlays."
- **Overlays:** Should have a minimum 20px margin from the screen edges to ensure they don't feel cramped.
- **Information Density:** Use generous padding (16px or 24px) within cards to ensure content feels breathable and easy for parents to digest at a glance.

## Elevation & Depth
Depth is used to signify the **Map Hierarchy**.
- **Surface (Level 0):** The interactive map.
- **Floating Buttons/Filters (Level 1):** Low-altitude shadows (4px blur, 10% opacity) to show they are interactive but not intrusive.
- **Location Cards/Overlays (Level 2):** High-altitude, extra-diffused shadows (16px blur, 8% opacity) with a slight blue tint (#2C66B8 at 5%) to create a soft "lifting" effect from the map background.
- **Modals (Level 3):** Standard backdrop blur (8px) to focus attention on detailed resource information.

## Shapes
A **Rounded** shape language is essential to the brand's friendly persona.
- **Cards & Overlays:** Use `rounded-lg` (1rem) for a modern, soft feel.
- **Buttons & Chips:** Use `rounded-xl` (1.5rem) or fully pill-shaped styles for grade filters to make them look tactile and "clickable."
- **Search Bars:** Should be fully rounded to distinguish them from content containers.

## Components
- **Map Markers:** Teardrop shapes with Grade Color-coding. Icons inside indicate the resource type (e.g., Book for library, Screen for online).
- **Grade Filter Chips:** Segmented controls or horizontal scrollable chips using the Grade Color palette. When active, the chip should have a subtle glow of its assigned color.
- **Resource Detail Overlay:** A bottom sheet (on mobile) or side panel (on desktop) with a "Handle" at the top. It features a large "Call to Action" button in the Primary Blue.
- **Online/Offline Badges:** Small, high-contrast labels. "Online" uses the Secondary Green with a subtle wifi icon; "Offline" uses a neutral slate with a location pin icon.
- **Search & Input:** Backgrounds should be slightly off-white (#F1F3F5) to stand out against white card surfaces, with a focus state that uses the primary blue border.