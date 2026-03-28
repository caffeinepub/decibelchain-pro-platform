# DecibelChain PRO Platform

## Current State
Full-featured PRO platform with all phases 1–8D live. Dark navy/gold theme, Bricolage Grotesque + Satoshi fonts, OKLCH color tokens, responsive sidebar + mobile bottom nav. No systematic ARIA labeling, focus management, or motion/transition polish exists yet.

## Requested Changes (Diff)

### Add
- `prefers-reduced-motion` media query support — disable/reduce all animations when user requests it
- Skip-to-main-content link (visually hidden, visible on focus) at top of app
- Focus-visible ring styles that are clearly visible on all interactive elements (buttons, links, nav items, inputs)
- Smooth page transition fade-in animation (subtle, respects reduced-motion)
- Loading skeleton shimmer states for async content areas
- Consistent micro-animations: hover scale on cards, subtle press effect on buttons

### Modify
- `index.css`: Add reduced-motion support, focus-visible improvements, page fade-in keyframe, skeleton shimmer keyframe, smooth scrolling
- `Sidebar.tsx`: Add `aria-label` to nav, `aria-current="page"` to active items, `role="navigation"`, keyboard trap handling for mobile overlay, proper `aria-expanded` for collapsible sections
- `App.tsx`: Add skip-to-main link, `<main>` landmark with `id="main-content"`, page transition wrapper, `role` and `aria-label` on layout regions
- `Header.tsx`: Add `role="banner"`, `aria-label` on icon buttons, improve button labeling
- `MobileBottomNav.tsx`: Add `role="navigation"`, `aria-label="Mobile navigation"`, `aria-current` on active tab
- All page components: wrap content in semantic `<main>` or `<section>` with appropriate `aria-labelledby` headings where missing

### Remove
- Nothing removed

## Implementation Plan
1. Update `index.css` with: reduced-motion overrides, enhanced focus-visible ring, fade-in keyframe, skeleton keyframe, smooth scroll, improved transition utilities
2. Update `App.tsx`: skip-to-main link, main landmark, page transition fade wrapper
3. Update `Sidebar.tsx`: full ARIA nav labeling, aria-current, aria-expanded, keyboard nav improvements
4. Update `Header.tsx` and `MobileBottomNav.tsx`: ARIA roles and labels
5. Validate and build
