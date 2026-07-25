# Comic Book UI Redesign Spec

**Date:** 2026-05-23
**Status:** Draft

## Goal

Transform BLUMI e-commerce UI to comic book / graphic novel aesthetic. Bold, stylized, high-contrast design inspired by fashion illustration sheets with thick outlines and vibrant colors.

## Design Language

### Color Palette

```css
--bg-cream: #FAF8F5;
--bg-white: #FFFFFF;
--text-primary: #1a1a1a;
--text-secondary: #4a4a4a;
--accent-orange: #FF6B35;
--accent-yellow: #FFD93D;
--accent-teal: #00A8A8;
--accent-pink: #FF6B9D;
--accent-purple: #9B5DE5;
--border-black: #000000;
--shadow-hard: rgba(0, 0, 0, 0.9);
```

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headings | Bangers | 400 | clamp(2rem, 8vw, 5rem) |
| Subheadings | Bangers | 400 | clamp(1.5rem, 4vw, 2.5rem) |
| Body | DM Sans | 400-700 | 1rem base |
| Labels/Caps | DM Sans | 800 | 0.75rem uppercase |

### Visual Elements

| Element | Style |
|---------|-------|
| Borders | 3px solid black (buttons), 4px (cards) |
| Border-radius | 8px (small), 12px (medium), 16px (large) |
| Shadows | Hard offset: 4px 4px 0 black (buttons), 6px 6px 0 black (cards) |
| Hover states | Shadow grows +2px, translate -2px -2px |
| Active states | Shadow shrinks to 2px 2px, translate 2px 2px |

### Component Styles

#### Buttons

```css
.btn-comic {
  background: var(--accent-orange);
  color: white;
  border: 3px solid var(--border-black);
  border-radius: 12px;
  box-shadow: 4px 4px 0 var(--shadow-hard);
  font-family: 'Bangers', cursive;
  font-size: 1.25rem;
  padding: 1rem 2rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-comic:hover {
  box-shadow: 6px 6px 0 var(--shadow-hard);
  transform: translate(-2px, -2px);
}

.btn-comic:active {
  box-shadow: 2px 2px 0 var(--shadow-hard);
  transform: translate(2px, 2px);
}
```

#### Cards

```css
.card-comic {
  background: var(--bg-white);
  border: 4px solid var(--border-black);
  border-radius: 16px;
  box-shadow: 6px 6px 0 var(--shadow-hard);
  overflow: hidden;
}

.card-comic:hover {
  box-shadow: 8px 8px 0 var(--shadow-hard);
  transform: translate(-4px, -4px);
}
```

#### Inputs

```css
.input-comic {
  background: var(--bg-white);
  border: 3px solid var(--border-black);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  box-shadow: 3px 3px 0 var(--shadow-hard);
}

.input-comic:focus {
  outline: none;
  box-shadow: 5px 5px 0 var(--shadow-hard);
}
```

### Header Style

- Transparent background with blur
- Logo in Bangers font, large
- Navigation pills with comic styling
- Cart icon with hard shadow

### Footer Style

- Dark background (#1a1a1a)
- White text, Bangers headings
- Border-top with accent color stripe

## Implementation Scope

### Phase 1: CSS Variables (globals.css)

- Override all color variables
- Add new typography variables
- Define comic shadow system
- Define border-radius system

### Phase 2: Global Styles

- Update button styles (.btn-pill → .btn-comic)
- Update card styles (.bento-card → .card-comic)
- Update input styles
- Update typography classes

### Phase 3: Components

- Header.tsx - Comic styling
- ProductCard.tsx - Comic card variant
- AddToCartButton.tsx - Comic button
- CartDrawer.tsx - Comic styling
- SearchModal.tsx - Comic styling

### Phase 4: Pages

- Homepage (page.tsx)
- Shop page (shop/page.tsx)
- Cart page (cart/page.tsx)

## Files to Modify

1. `src/styles/globals.css` - Complete rewrite
2. `src/app/layout.tsx` - Font imports (Bangers)
3. `src/components/Header.tsx` - Comic header
4. `src/components/ProductCard.tsx` - Comic cards
5. `src/components/AddToCartButton.tsx` - Comic button
6. `src/components/CartDrawer.tsx` - Comic drawer
7. `src/components/SearchModal.tsx` - Comic modal
8. `src/app/page.tsx` - Homepage
9. `src/app/shop/page.tsx` - Shop page
10. `src/components/ScrollSequence.tsx` - Keep hero, update overlay text

## Acceptance Criteria

- [ ] All buttons have comic styling (thick border, hard shadow)
- [ ] All cards have 4px black border, hard offset shadow
- [ ] Headings use Bangers font
- [ ] Color palette matches spec
- [ ] Hover states animate correctly
- [ ] Mobile responsive

## Notes

- Keep existing GSAP/ScrollTrigger animations
- Maintain current product data flow
- Keep scroll sequence hero (update text overlay)
- Focus on visual transformation, not structural changes