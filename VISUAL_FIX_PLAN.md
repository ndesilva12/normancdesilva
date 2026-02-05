# Visual Design Fix Plan

## Context
Branch `dashboard-ui-updates` contains a comprehensive update (commit 0e287db) that added many new pages but with poor visual design - cramped layouts, insufficient spacing, elements pushed to one side.

## Design Reference (Good Examples)
- `/` - Dashboard homepage (polished gradient design)
- `/tools/curate` - Beautiful glassmorphism, proper spacing

## Pages That Need Visual Redesign

### Priority 1 - New Major Pages (Broken)
- [ ] `/people` - People database (table layout cramped)
- [ ] `/recommendations` - Recommendations page
- [ ] `/relationship-intel` - Complete overhaul needed (inline styles, cramped)
- [ ] `/mission` - Mission Control Kanban

### Priority 2 - Tools Pages (Check Each)
- [ ] `/tools/accounts`
- [ ] `/tools/business-info`
- [ ] `/tools/calendar`
- [ ] `/tools/company-politics`
- [ ] `/tools/contact-finder`
- [ ] `/tools/contacts`
- [ ] `/tools/dark-search`
- [ ] `/tools/deep-search`
- [ ] `/tools/emails`
- [ ] `/tools/files`
- [ ] `/tools/image-lookup`
- [ ] `/tools/inoreader`
- [ ] `/tools/last30days`
- [ ] `/tools/market`
- [ ] `/tools/news`
- [ ] `/tools/notes`
- [ ] `/tools/notion-browser`
- [ ] `/tools/raindrop`
- [ ] `/tools/reading`
- [ ] `/tools/spotify`
- [ ] `/tools/trending`
- [ ] `/tools/visual-rosters`
- [ ] `/tools/visuals`

### Already Good (Reference These)
- `/` - Dashboard homepage
- `/tools/curate` - Curate tool

## Design System Rules

### Spacing
- Page padding: `40-48px` (not 24px)
- Section gaps: `32-40px`
- Card padding: `24-32px`
- Element gaps: `12-16px`

### Backgrounds
- Page: `linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)`
- Cards: `backdrop-blur-xl bg-white/5 border border-white/10`
- Hover states: Subtle glow/shadow effects

### Typography
- Page title: `text-4xl font-bold` with gradient
- Section headers: `text-2xl font-semibold`
- Body: `text-sm` or `text-base`
- Muted text: `text-gray-400`

### Components
- Use Tailwind classes where possible
- Inline styles only when needed for dynamic values
- Consistent rounded corners: `rounded-xl` or `rounded-2xl`
- Smooth transitions: `transition-all duration-200`

### Colors
- Primary gradient: violet/purple
- Accent: blue, green, orange based on context
- Text: white/gray scale
- Borders: white with low opacity

## Implementation Strategy
1. Start with Priority 1 pages (people, recommendations, relationship-intel, mission)
2. Create reusable component patterns
3. Apply to Priority 2 tools pages
4. Test on mobile + desktop
5. Commit in logical chunks

## Current Branch
`fix-visual-mess-v2` (branched from `dashboard-ui-updates`)
