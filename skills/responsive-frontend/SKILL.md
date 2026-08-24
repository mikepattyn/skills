---
name: responsive-frontend
description: Ensures frontend code looks good on mobile, tablet, and desktop. Apply whenever generating or editing HTML, CSS, or UI components — layouts, sections, navigation, cards, forms, or any visual change under apps/ — even if the user does not mention responsiveness.
---

# Responsive Frontend

Every UI change must work at three viewports. Never ship a layout verified at only one width.

## Reference viewports

| Device | Width | Watch for |
|--------|-------|-----------|
| Mobile | 375px | Overflow, cramped nav, tiny tap targets, text wrapping |
| Tablet | 768px | Awkward in-between states, grids stuck in mobile or desktop mode |
| Desktop | 1280px+ | Overly wide text lines, stretched cards, wasted space |

## Rules

1. **Mobile-first CSS.** Base styles target small screens; add `@media (min-width: ...)` to enhance upward. This repo's existing breakpoints are `640px`, `680px`, and `800px` — reuse them instead of inventing new ones.
2. **Fluid over fixed.** Prefer `clamp()`, `%`, `minmax()`, `auto-fit`/`auto-fill` grids, and `flex-wrap` over fixed pixel widths. Example already in use here: `padding: clamp(1.25rem, 4vw, 3rem)`.
3. **No horizontal overflow.** Nothing may force a horizontal scrollbar at 375px. Check long words/URLs (`overflow-wrap: break-word`), fixed-width children, and negative margins.
4. **Grids must collapse.** Multi-column grids (`repeat(3, 1fr)`, `1fr 1fr`) need a single-column base layout below the breakpoint.
5. **Touch targets ≥ 44px** on interactive elements (buttons, nav links, toggles) at mobile sizes.
6. **Readable line lengths on desktop.** Cap body text around `60–70ch` / `36–44rem` — but only when the design calls for it; full-width elements should be intentional, not accidental.
7. **Keep `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`** in every HTML page.

## Verification checklist

After any layout change, confirm all three before finishing:

```
- [ ] 375px: no overflow, nav usable, text readable
- [ ] 768px: grids/columns transition cleanly, no orphaned layouts
- [ ] 1280px: content well-proportioned, no stretched or cramped blocks
```

Verify by reasoning through the CSS at each width, or with the browser tool at each viewport size when available.
