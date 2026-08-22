# GlobeTrotter — style.md

This file is the design contract for the whole app. Its job is narrow but critical: **any person or AI agent building any screen should be able to read only this file and produce something visually indistinguishable from every other screen in the app.**

How to use it:
- **Fill in every `<PLACEHOLDER>`** after you've done the research in `ui-design-workflow.md`. Don't leave placeholders in the version you actually use — an AI agent will either ignore them or, worse, invent something inconsistent with the next screen.
- **Paste the whole file** (or the relevant sections) into the system prompt / context of whatever's generating UI — Claude, Cursor, v0, an MCP-connected design tool, doesn't matter. The more of this file the agent has, the less drift between screens.
- **Update it once, not per-screen.** If you decide the accent color is wrong on screen 9, fix it here and regenerate — don't patch screen 9 alone and let it diverge.

---

## 1. Brand foundation

- **Product name:** GlobeTrotter
- **One-line personality:** `<e.g. "calm and organized, not busy — a trip planner that feels like a well-packed suitcase, not a cluttered one">`
- **Reference products this borrows from:** `<list 2-3 from your research, e.g. "Linear's restraint, Airbnb's card treatment, Notion's calendar view">`
- **What this explicitly is NOT:** `<e.g. "not playful/cartoonish, not enterprise-dashboard-dense, not skeuomorphic">`

---

## 2. Color system

Fill in actual hex values from your Coolors/realtimecolors research. Every color needs both a light-mode and dark-mode value if you're supporting dark mode.

```
--color-primary:        <HEX>   /* main brand color — primary buttons, active states, links */
--color-primary-hover:  <HEX>
--color-secondary:      <HEX>   /* secondary actions, less prominent CTAs */
--color-accent:         <HEX>   /* highlights, badges, the "pop" color — use sparingly */

--color-bg-page:        <HEX>
--color-bg-surface:     <HEX>   /* cards, panels */
--color-bg-surface-alt: <HEX>   /* nested surfaces, e.g. a card inside a card */

--color-text-primary:   <HEX>
--color-text-secondary: <HEX>
--color-text-muted:     <HEX>

--color-border:         <HEX>
--color-border-strong:  <HEX>   /* focus rings, active borders */

--color-success:        <HEX>   /* under-budget indicators, confirmations */
--color-warning:        <HEX>   /* approaching-budget alerts */
--color-danger:         <HEX>   /* over-budget alerts, destructive actions */
```

**Rule:** semantic colors (success/warning/danger) are reserved for their meaning. Don't use `--color-danger` red as a decorative accent anywhere — it will read as an error to users even when you don't mean it to.

---

## 3. Typography

```
--font-heading: <e.g. "Cabinet Grotesk, sans-serif">
--font-body:    <e.g. "Inter, sans-serif">
--font-mono:    <e.g. "JetBrains Mono, monospace">   /* for dates, costs, anything tabular */
```

Type scale (fill in from type-scale.com, don't hand-pick):

| Token | Size | Weight | Used for |
|---|---|---|---|
| `--text-xs` | `<PX>` | `<WEIGHT>` | timestamps, helper text |
| `--text-sm` | `<PX>` | `<WEIGHT>` | body copy, form labels |
| `--text-base` | `<PX>` | `<WEIGHT>` | default body text |
| `--text-lg` | `<PX>` | `<WEIGHT>` | card titles, section labels |
| `--text-xl` | `<PX>` | `<WEIGHT>` | screen titles |
| `--text-2xl` | `<PX>` | `<WEIGHT>` | hero/banner text (screen 3) |

**Rule:** two weights maximum in active use (e.g. regular + medium). A third weight ("bold") only for true emphasis, used rarely.

---

## 4. Spacing & layout

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
```

- **Grid:** `<e.g. "12-column, 24px gutter, max-width 1280px content container">`
- **Breakpoints:** `<mobile: e.g. 375px / tablet: 768px / desktop: 1280px>`
- **Card padding standard:** `<e.g. "16px on mobile, 24px on desktop — applies to every card component: trip cards, section cards, activity result rows">`

---

## 5. Radius & elevation

```
--radius-sm: <PX>   /* inputs, small buttons */
--radius-md: <PX>   /* cards */
--radius-lg: <PX>   /* modals, large containers */
--radius-full: 9999px  /* avatars, pills, badges */

--shadow-sm: <VALUE>   /* resting card state */
--shadow-md: <VALUE>   /* hover/raised state */
--shadow-lg: <VALUE>   /* modals, dropdowns */
```

**Rule:** pick one radius scale and use it everywhere. A screen with 4px buttons next to 16px cards next to fully-rounded avatars is fine — a screen with 4px buttons on one page and 8px buttons doing the identical job on another page is not.

---

## 6. Iconography & imagery

- **Icon set:** `<e.g. "Tabler Icons — outline style only, 20px default, 16px inline with text">`
- **Illustration style (empty states, onboarding):** `<e.g. "flat, 2-color, no gradients — matches banner treatment on screen 3">`
- **Photography treatment (city/destination images):** `<e.g. "16:9 crop, subtle warm color grade, no filters that obscure the actual place">`
- **Avatars:** `<shape (circle/squircle), fallback treatment for users without a photo>`

---

## 7. Motion (Better tier and above)

```
--ease-standard: <e.g. "cubic-bezier(0.4, 0, 0.2, 1)">
--duration-fast: <e.g. "120ms">    /* hover states, button press */
--duration-base: <e.g. "200ms">    /* card transitions, dropdown open */
--duration-slow: <e.g. "320ms">    /* modal open, page transitions */
```

**Rule:** every interactive element gets a hover AND a focus state at minimum (Better tier). Focus states are not optional — they're the accessibility baseline, not a nice-to-have.

---

## 8. Component conventions

Define these once, reference everywhere — this is what prevents the same component looking different on screen 6 vs screen 9.

**Buttons:** `<primary/secondary/ghost/destructive variants — states: default, hover, active, disabled, loading>`

**Inputs:** `<default/focus/error/disabled states — label position, helper text position, error text color reference>`

**Cards (trip cards, section cards, activity rows — screens 3, 4, 6, 7, 8):** `<border vs shadow vs both, hover behavior, what's always visible vs revealed on hover>`

**Search + Group-by/Filter/Sort-by bar (screens 3, 6, 8, 9, 10, 11 — this exact combination appears six times, build it once as a shared component):** `<layout, which controls are dropdowns vs buttons, mobile collapse behavior>`

**Badges/tags (trip status, budget alerts):** `<shape, color-per-state mapping to your semantic colors above>`

**Empty states:** `<what shows when a list has zero items — illustration + message + primary action, never just blank space>`

**Loading states:** `<skeleton shape per component, matching final layout dimensions exactly so nothing jumps on load>`

---

## 9. Accessibility floor (non-negotiable regardless of tier)

- Text contrast meets WCAG AA against its background (4.5:1 body text, 3:1 large text) — verify with a contrast checker, don't eyeball it.
- Every interactive element reachable and operable by keyboard alone.
- Every icon-only button has an `aria-label`.
- Color is never the only signal for state (e.g. an over-budget indicator gets an icon or text, not just red).

---

## 10. Prompt block — paste this into any AI agent or MCP server

Once every section above is filled in, copy this block (with your actual values substituted) as the first message / system context whenever you ask an AI to build or modify a screen:

```
You are building UI for GlobeTrotter, a trip-planning app. Follow these constraints exactly:

- Colors: primary <HEX>, secondary <HEX>, accent <HEX>, backgrounds <HEX>/<HEX>, text <HEX>/<HEX>/<HEX>, semantic success/warning/danger <HEX>/<HEX>/<HEX>.
- Typography: headings in <FONT>, body in <FONT>, type scale from --text-xs (<PX>) to --text-2xl (<PX>), two weights max.
- Spacing scale: 4/8/12/16/24/32/48px, nothing outside this scale.
- Radius: <PX> for inputs/buttons, <PX> for cards, full-round for avatars/pills.
- Component library: shadcn/ui as the base, restyled with the tokens above — do not introduce a different component library or hand-roll a component shadcn already provides.
- Every interactive element needs hover, focus, active, and disabled states.
- This screen must include [paste the exact bare-minimum element list for that screen from ui-design-workflow.md] — do not omit or substitute any of these. You may add supporting UI beyond this list as long as none of the required elements are removed.
- Target enhancement tier for this screen: [Good / Better / Best / Extreme / God — see ui-design-workflow.md for what each tier means].
```

This is the whole point of the file: fill in the placeholders once, and every screen — whether built by a teammate, a future dev, or an AI agent — starts from the same visual ground truth instead of reinventing it.