---
name: Structure & Logic
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#42474f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727780'
  outline-variant: '#c2c7d1'
  surface-tint: '#2d6197'
  primary: '#00355f'
  on-primary: '#ffffff'
  primary-container: '#0f4c81'
  on-primary-container: '#8ebdf9'
  inverse-primary: '#a0c9ff'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#003c27'
  on-tertiary: '#ffffff'
  tertiary-container: '#005539'
  on-tertiary-container: '#3dd197'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a0c9ff'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#07497d'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '800'
    lineHeight: 16px
    letterSpacing: 0.08em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1440px
---

## Brand & Style

The design system is engineered for the modern enterprise, specifically targeting complex ERP environments where decision-making is driven by data density and workflow clarity. The brand personality is **utilitarian, precise, and authoritative**. It prioritizes function over form, ensuring that users can navigate vast amounts of information without cognitive overload.

The aesthetic follows a **Corporate / Modern** style with subtle hints of **Tonal Layering**. It avoids unnecessary ornamentation, favoring a structured "dashboard-like" layout where every element has a logical placement. The UI should evoke a sense of professional reliability and calm efficiency, allowing high-density data to feel manageable and organized.

## Colors

The palette is rooted in a spectrum of industrial blues and cool grays to foster a professional environment.

- **Primary**: A deep, stable Navy (`#0F4C81`) used for key branding elements and primary navigation.
- **Secondary**: A brighter Action Blue (`#3B82F6`) reserved for interactive elements, primary buttons, and active states.
- **Surface**: The background uses a very light cool gray (`#F8FAFC`), while containers use white to create a distinct separation of content.
- **Semantic**: Success is represented by a soft Emerald (`#10B981`), Warnings by Amber, and Critical Errors by a sharp Crimson.
- **Grays**: A comprehensive gray scale is used for subtle borders and secondary text to maintain a low-distraction environment.

## Typography

This design system utilizes a three-font strategy to maximize readability and hierarchy in data-heavy views.

1.  **Hanken Grotesk (Headlines)**: A sharp, contemporary sans-serif used for structure and section headers.
2.  **Inter (UI/Body)**: The workhorse font for all interface labels, paragraphs, and inputs, chosen for its exceptional legibility at small sizes.
3.  **JetBrains Mono (Data)**: Used specifically for technical IDs, metadata, and timestamps to ensure character differentiation (e.g., 1 vs l).

**Case usage**: `label-caps` must be used in all-caps for section overlines and metadata labels to distinguish them from actionable content.

## Layout & Spacing

The layout uses a **12-column fixed grid** on desktop, centered with a maximum width to ensure readability on ultra-wide monitors. 

- **Grid System**: 16px gutters between columns. Content usually spans 3, 4, 6, or 12 columns.
- **Density**: A compact 4px base unit is used. To maintain high information density, vertical padding in tables and lists is kept to a minimum (8px - 12px), while larger containers use 24px padding to provide breathing room between major sections.
- **Adaptive Rules**: On tablet, the grid shifts to 8 columns. On mobile, it collapses to a single column with 16px side margins. Navigation transitions from a persistent sidebar on desktop to a bottom bar or "hamburger" menu on mobile.

## Elevation & Depth

To keep the UI clean and professional, depth is communicated through **Tonal Layers** rather than heavy shadows.

- **Level 0 (Background)**: `#F8FAFC` - The canvas of the application.
- **Level 1 (Cards/Sidebar)**: White background with a 1px solid border (`#E2E8F0`). No shadow.
- **Level 2 (Dropdowns/Modals)**: White background with a very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) to indicate focus.
- **Interactive States**: Hovering over an element should not change its elevation but instead provide a subtle background tint change (`#F1F5F9`).

## Shapes

The shape language is **geometric and precise**. A "Soft" roundedness is applied to prevent the UI from feeling too clinical, but the radius is kept small to maintain the professional, structured appearance.

- **Standard Elements**: Buttons and input fields use a 4px (0.25rem) radius.
- **Containers**: Data cards and workflow nodes use an 8px (0.5rem) radius.
- **Badges**: Status indicators use a 4px radius or are fully pill-shaped depending on the context of the workflow status.

## Components

### Buttons
- **Primary**: Solid Action Blue with white text.
- **Secondary**: Transparent background with a 1px gray border.
- **Tertiary/Ghost**: No border, used for low-priority actions in tables.

### Status Badges
Badges should use a "Soft Fill" style: a high-transparency background version of the semantic color with high-contrast text (e.g., a light green background with dark green text for "Active").

### Workflow Nodes
Nodes are represented as white cards with a thick left-accent border (4px) that corresponds to the status of that step (e.g., Blue for "In Progress"). Connection lines between nodes are solid 2px light gray lines with arrowheads.

### Data Cards
Cards are the primary container for information groups. They must include a `label-caps` header and a subtle 1px divider between the header and the body content.

### Inputs
Input fields use a 1px border. When focused, the border changes to Action Blue with a subtle 2px outer glow in the same color (20% opacity).