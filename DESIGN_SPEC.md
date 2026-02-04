# Relationship Intel - Design Specification

## Reference Images

See Telegram images:
- `/home/ubuntu/.clawdbot/media/inbound/53001060-6f82-454c-a582-ca4c9050e2c0.jpg`
- `/home/ubuntu/.clawdbot/media/inbound/ce578425-9a48-4ec2-8df3-47e522433a9f.jpg`

## Color Palette

**Background:**
- Primary: `#0a0a0a` (pure black)
- Secondary: `#0f0f0f` (slightly lighter black)
- Card background: `#1a1a1a`

**Borders:**
- Primary: `#1a1a1a`
- Secondary: `#2a2a2a`

**Text:**
- Primary: `#ffffff`
- Secondary: `#888888`
- Muted: `#666666`

**Accent Colors:**
- Purple: `#8b5cf6` (tags, categories)
- Blue: `#3b82f6` (emails)
- Green: `#10b981` (connections, active status)
- Orange: `#f59e0b` (meetings, priority)
- Red: `#f87171` (errors)
- Primary action: `#6366f1` (buttons)

**Category-specific colors:**
- Interest Level: `#10b981` (green)
- Industry: `#3b82f6` (blue)
- Relationship Type: `#8b5cf6` (purple)
- Priority: `#f59e0b` (orange)

## Layout

### Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header (fixed)                                          │
├────────────────┬────────────────────────────────────────┤
│                │                                        │
│  Contact List  │   Contact Detail Panel                │
│  (Left)        │   (Right)                              │
│  - Compact     │   - Full height                        │
│  - Scrollable  │   - Scrollable                         │
│  - 360px       │   - Flex grow                          │
│                │                                        │
└────────────────┴────────────────────────────────────────┘
```

### Left Panel (Contact List)
- Width: `360px` (fixed)
- Background: `#0f0f0f`
- Border right: `1px solid #1a1a1a`
- Search bar at top
- Settings icon (top right)
- Contact items:
  - Padding: `14px 24px`
  - Border bottom: `1px solid #1a1a1a`
  - Hover: `#151515`
  - Selected: `#1a1a1a`
  - Avatar: 40px circle (or initials)
  - Name: 14px, `#ffffff`, weight 500
  - Company: 12px, `#888888`

### Right Panel (Contact Detail)
- Max width: `900px`
- Padding: `40px 48px`
- Sections with spacing: `40px` margin between

**Header section:**
- Avatar: 80px circle
- Name: 24px, weight 600
- Company: 14px with Building2 icon
- Action buttons: `8px 14px` padding, gap `12px`
  - Primary (Email): `#6366f1` background
  - Secondary (Call, Schedule): `#1a1a1a` with `#2a2a2a` border

**Stats cards:**
- Grid: 3 columns, gap `16px`
- Card padding: `20px`
- Background: `#0f0f0f`
- Border: `1px solid #1a1a1a`
- Border radius: `12px`
- Label: 12px, `#888888`
- Value: 16px, `#ffffff`, weight 500

**Tag Categories:**
- Grid: 2 columns, gap `16px`
- Card padding: `16px`
- Background: `#0f0f0f`
- Border: `1px solid #1a1a1a`
- Border radius: `8px`
- Color dot: 8px square with category color
- Label: 13px, `#888888`, weight 500
- Dropdown:
  - Full width
  - Padding: `8px 12px`
  - Background: `#1a1a1a`
  - Border: `1px solid #2a2a2a`
  - Border radius: `6px`
  - Text: 13px, `#ffffff`

**Email Timeline:**
- Email card:
  - Padding: `16px`
  - Background: `#0f0f0f`
  - Border: `1px solid #1a1a1a`
  - Border radius: `8px`
  - Hover: `#151515`
  - Subject: 14px, `#ffffff`, weight 500
  - Date: 12px, `#666666`
  - From: 12px, `#888888`
  - Snippet: 13px, `#666666` (collapsed) or `#aaa` (expanded)

## Typography

**Font Family:** System font stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Sizes:**
- H1 (Page title): 20px, weight 600
- H2 (Section title): 14px, weight 500, `#888888`
- Contact name (list): 14px, weight 500
- Contact name (detail): 24px, weight 600
- Body text: 13px
- Small text: 12px
- Tiny text: 11px

**Line Heights:**
- Body: 1.5
- Headings: 1.2

## Spacing

**Base unit:** 4px

Common values:
- `4px` - Tiny gap
- `6px` - Extra small
- `8px` - Small
- `12px` - Medium
- `16px` - Large
- `20px` - Extra large
- `24px` - Section spacing
- `32px` - Major section
- `40px` - Panel padding

## Components

### Button Styles

**Primary:**
```css
background: #6366f1
color: #ffffff
padding: 8px 14px
border-radius: 6px
font-size: 13px
font-weight: 500
border: none
```

**Secondary:**
```css
background: #1a1a1a
color: #ffffff
padding: 8px 14px
border-radius: 6px
border: 1px solid #2a2a2a
font-size: 13px
font-weight: 500
```

**Icon button:**
```css
padding: 6px
border-radius: 6px
background: transparent
hover: rgba(255,255,255,0.05)
```

### Input/Select

```css
width: 100%
padding: 8px 12px
border-radius: 6px
background: #1a1a1a
border: 1px solid #2a2a2a
color: #ffffff
font-size: 13px
outline: none
```

### Search Bar

```css
display: flex
align-items: center
gap: 10px
background: #1a1a1a
border-radius: 8px
padding: 10px 14px
border: 1px solid #2a2a2a
```

### Tag Badge

```css
display: inline-flex
align-items: center
gap: 6px
padding: 6px 12px
border-radius: 6px
background: [category-color]
color: #ffffff
font-size: 12px
font-weight: 500
```

## Animations

**Hover transitions:**
```css
transition: all 0.15s ease
```

**Loading spinner:**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
animation: spin 1s linear infinite
```

## Icons

Use **Lucide React** icons at these sizes:
- Small: 12px
- Medium: 14px
- Normal: 16px
- Large: 20px
- Extra large: 24px

Common icons:
- Search: `<Search size={16} />`
- Mail: `<Mail size={14} />`
- Calendar: `<Calendar size={14} />`
- Phone: `<Phone size={14} />`
- Tag: `<Tag size={12} />`
- Settings: `<Settings size={16} />`
- Building: `<Building2 size={14} />`
- Network: `<Network size={16} />`
- ChevronRight: `<ChevronRight size={16} />`

## Responsive

**Breakpoint:** 768px

Mobile adjustments:
- Single column layout (no left panel visible when detail open)
- Reduced padding: `20px` instead of `40px`
- Smaller font sizes
- Collapsible sections

## Scrollbar

```css
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: #0a0a0a;
}

*::-webkit-scrollbar-thumb {
  background: #2a2a2a;
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb:hover {
  background: #3a3a3a;
}
```

## Key Principles

1. **Pure dark theme** - No gradients, solid blacks
2. **Subtle borders** - `#1a1a1a` and `#2a2a2a` only
3. **Compact spacing** - Professional, information-dense
4. **Vibrant accents** - Category colors pop against dark background
5. **Clean typography** - Sans-serif, clear hierarchy
6. **Consistent rounding** - 6px for small, 8px for medium, 12px for large
7. **Smooth interactions** - 0.15s transitions on hover
8. **Accessible contrast** - White text on dark, colored badges with white text
