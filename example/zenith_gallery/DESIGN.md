---
name: Zenith Gallery
colors:
  surface: '#f7fafd'
  surface-dim: '#d7dadd'
  surface-bright: '#f7fafd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f7'
  surface-container: '#ebeef1'
  surface-container-high: '#e5e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#181c1e'
  on-surface-variant: '#434656'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f4'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004dea'
  primary: '#0041c8'
  on-primary: '#ffffff'
  primary-container: '#0055ff'
  on-primary-container: '#e3e6ff'
  inverse-primary: '#b6c4ff'
  secondary: '#b02700'
  on-secondary: '#ffffff'
  secondary-container: '#dc3300'
  on-secondary-container: '#fffbff'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#caa900'
  on-tertiary-container: '#4c3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b3'
  secondary-fixed: '#ffdad2'
  secondary-fixed-dim: '#ffb4a2'
  on-secondary-fixed: '#3c0700'
  on-secondary-fixed-variant: '#8a1d00'
  tertiary-fixed: '#ffe170'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#f7fafd'
  on-background: '#181c1e'
  surface-variant: '#e0e3e6'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  stats-number:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 16px
---

## Brand & Style
The design system is built on the intersection of high-energy Shonen aesthetics and premium gallery minimalism. It evokes the excitement of a high-stakes card battle while maintaining the professional clarity of a high-end investment platform. 

The style is **Modern/Linear**, utilizing crisp edges, generous whitespace, and purposeful pops of vibrant color to create a "Collector" feel. The interface stays out of the way, acting as a clean canvas that celebrates the artwork of the cards themselves. We lean into subtle glassmorphism for overlays to maintain a sense of depth without cluttering the visual field.

## Colors
The palette draws inspiration from classic anime color theory—using primary-centric "Hero" colors against a sophisticated, neutral backdrop.

- **Primary (Electric Blue):** Used for primary actions, navigation states, and "Rare" rarity tiering.
- **Secondary (Impact Red):** Reserved for "Ultra-Rare" highlights, critical alerts, and high-intensity interactions.
- **Tertiary (Victory Gold):** Used for "Legendary" status, rewards, and currency indicators.
- **Neutral:** A spectrum of cool grays and off-whites that provide a "clean room" environment for colorful card assets to breathe.

Backgrounds should remain light and "airy" (`#F4F7FA`) to ensure the vibrant cards remain the focal point.

## Typography
Typography is architectural and technical. 

- **Headlines:** Use **Sora** for its geometric, futuristic personality. It should be set with tight letter-spacing for a bold, impactful look.
- **Body:** **Hanken Grotesk** provides a clean, neutral reading experience, ensuring card descriptions and lore are highly legible.
- **Data/Labels:** **Space Grotesk** is used for card stats, technical labels, and navigation. Its monospaced-adjacent feel reinforces the "collector database" aspect of the system.

## Layout & Spacing
This design system follows a **mobile-first, fluid grid** philosophy. 

- **Mobile:** A 4-column grid with 16px margins. Cards usually span 2 columns (2x2 grid) or 4 columns for featured items.
- **Desktop:** A 12-column fixed grid (max-width 1280px). 
- **The "Card Gap":** Spacing between card items should be consistent (`md` or 24px) to create a clear "shuffling" rhythm.
- **Linear Alignment:** Elements should be strictly aligned to the grid to maintain the professional, organized feel of a curated collection.

## Elevation & Depth
Depth is used sparingly to signify "floating" card states or interactive overlays.

- **Tonal Layering:** Most surfaces are flat. We differentiate hierarchy through subtle background shifts (e.g., a card slot having a slightly darker neutral tint than the page background).
- **The "Active" Lift:** When a card is hovered or selected, it should utilize an **ambient shadow**—highly diffused, low opacity, and slightly tinted with the Primary color—to simulate the card "popping" out of the deck.
- **Glassmorphism:** Bottom sheets and hover-state info panels use a 20px backdrop blur with a 70% white opacity. This allows the card art to remain visible beneath the UI layers.

## Shapes
The shape language is **Rounded**, balancing the aggressive "pointy" nature of shonen art with modern software friendliness.

- **Cards:** Use `rounded-lg` (1rem) to mimic the physical die-cut of trading cards.
- **Buttons/Inputs:** Use base `rounded` (0.5rem) for a sturdy, tactile feel.
- **Tags/Chips:** Use `rounded-xl` (1.5rem) to distinguish secondary metadata from primary interactive components.

## Components
- **Card Containers:** The core component. Cards must have a 2.5:3.5 aspect ratio. They should feature a thin 1px inner border and a "gloss" gradient overlay that activates on scroll or hover.
- **Buttons:** Primary buttons are solid Primary color with white text. Secondary buttons are "Ghost" style with a 1px Primary border.
- **Search & Filter:** Input fields use a subtle light-gray fill with a bottom-border-only focus state to maintain the "linear" look.
- **Rarity Chips:** Small, high-contrast labels using the Anime palette (Blue for Common, Red for Rare, Gold for Mythic) placed in the top-right corner of card containers.
- **Navigation:** A clean bottom-bar for mobile with icon + label; a minimalist top-bar for desktop with right-aligned utility links.