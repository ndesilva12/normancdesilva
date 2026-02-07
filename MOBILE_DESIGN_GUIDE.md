# Mobile Design Guide

Complete redesign of The Dashboard for mobile browsers, optimized for iPhone PWA usage.

## Overview

The dashboard has been completely reimagined for mobile with a focus on:
- **Touch-first interactions** - All elements sized for thumb reach
- **iPhone PWA optimization** - Safe areas, bottom nav, standalone mode
- **Beautiful aesthetics** - Dark gradients with teal accents maintained
- **Native feel** - iOS-style interactions and animations
- **Performance** - Smooth 60fps animations, optimized rendering

## Mobile Components

### Navigation

#### MobileNav (Bottom Navigation Bar)
```tsx
import { MobileNav } from "@/components/MobileNav";

// Automatically included in MobileLayout
// Sticky bottom nav with 4 sections: Home, Intel, People, Jimmy
// Safe area inset support for iPhone home indicator
```

**Features:**
- 80px height + safe area inset
- Active state with teal accent (#14b8a6)
- Touch targets: 60px wide minimum
- Blur backdrop effect

#### MobileHeader
```tsx
import { MobileHeader } from "@/components/MobileHeader";

// Simplified header: Logo, Time, Menu button
// Slide-out menu with user info and actions
```

**Features:**
- 60px height + safe area inset for notch
- Hamburger menu with slide-out panel
- User profile, settings, sign out
- Current time display

### Layout

#### MobileLayout
```tsx
import { MobileLayout } from "@/components/MobileLayout";

<MobileLayout>
  {children}
</MobileLayout>

// Auto-detects screen size
// < 768px: Mobile components
// >= 768px: Desktop components
```

#### MobileToolLayout
```tsx
import { MobileToolLayout } from "@/components/MobileToolLayout";
import { Sparkles } from "lucide-react";

<MobileToolLayout
  title="Curate"
  subtitle="AI-powered research"
  icon={<Sparkles style={{ width: 24, height: 24, color: "#8b5cf6" }} />}
  backHref="/"
  actions={
    <button>Action Button</button>
  }
  settings={
    <div>Settings content</div>
  }
>
  {content}
</MobileToolLayout>
```

**Features:**
- Sticky header below main header
- Back button to home
- Optional icon, subtitle
- Collapsible settings panel
- Action buttons area

### UI Components

#### MobileToolCard
```tsx
import { MobileToolCard } from "@/components/MobileToolCard";
import { Sparkles } from "lucide-react";

<MobileToolCard
  name="Curate"
  description="AI-powered research"
  icon={Sparkles}
  href="/tools/curate"
  color="#8b5cf6"
/>
```

**Features:**
- 120px min height
- Large 48x48px icon with colored background
- Touch feedback (scale 0.95 on press)
- Gradient overlay on touch
- 16px border radius

#### MobileInput & MobileButton
```tsx
import { MobileInput, MobileButton } from "@/components/MobileInput";
import { Search, Send } from "lucide-react";

<MobileInput
  placeholder="Search..."
  value={query}
  onChange={setQuery}
  icon={Search}
/>

<MobileInput
  placeholder="Enter details..."
  value={text}
  onChange={setText}
  multiline
  rows={5}
/>

<MobileButton
  variant="primary" // or "secondary" or "ghost"
  onClick={handleSubmit}
  fullWidth
  icon={Send}
  loading={isLoading}
>
  Submit
</MobileButton>
```

**Features:**
- 16px font size (prevents iOS zoom)
- 48px button height
- Icon support with proper spacing
- Loading states with spinner
- Multiple variants

#### MobileActionSheet
```tsx
import { MobileActionSheet, MobileActionItem } from "@/components/MobileActionSheet";
import { Share, Trash } from "lucide-react";

<MobileActionSheet
  isOpen={showSheet}
  onClose={() => setShowSheet(false)}
  title="Actions"
>
  <MobileActionItem
    icon={<Share size={20} />}
    label="Share"
    description="Share with others"
    onClick={handleShare}
  />
  <MobileActionItem
    icon={<Trash size={20} />}
    label="Delete"
    description="Remove permanently"
    onClick={handleDelete}
    destructive
  />
</MobileActionSheet>
```

**Features:**
- Slide-up animation
- Backdrop with tap-to-dismiss
- Drag handle at top
- Safe area inset support
- Destructive action styling (red)

#### MobileEmptyState
```tsx
import { MobileEmptyState } from "@/components/MobileEmptyState";
import { Inbox } from "lucide-react";

<MobileEmptyState
  icon={Inbox}
  title="No items yet"
  description="Get started by adding your first item"
  action={{
    label: "Add Item",
    onClick: handleAdd
  }}
/>
```

## Design Tokens

### Colors
```css
--accent: #14b8a6         /* Teal accent */
--background: #0a0a0a     /* Pure black */
--foreground: #ffffff     /* White text */
--foreground-muted: #94a3b8  /* Gray text */
```

### Gradients
```css
/* Background */
background: linear-gradient(to bottom, #0f172a 0%, #1e293b 100%);

/* Buttons */
background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);

/* Tool card overlays */
background: linear-gradient(135deg, ${color}15, transparent);
```

### Spacing
- **Touch targets**: 44x44px minimum (iOS guideline)
- **Button height**: 48px
- **Card padding**: 16-20px
- **Section spacing**: 24-32px
- **Border radius**: 12-16px

### Typography
```css
/* Headings */
h1: 20px, weight 700
h2: 18px, weight 600
h3: 16px, weight 600

/* Body */
p: 14-15px, weight 400
small: 11-13px, weight 400

/* Inputs */
input: 16px (prevents iOS zoom)
```

## PWA Configuration

### manifest.json
```json
{
  "name": "The Dashboard",
  "short_name": "Dashboard",
  "display": "standalone",
  "theme_color": "#14b8a6",
  "background_color": "#0a0a0a",
  "orientation": "portrait"
}
```

### Safe Area Insets

All components support iPhone notch and home indicator:

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

### Installation

1. Open dashboard in Safari on iPhone
2. Tap Share button
3. Select "Add to Home Screen"
4. Dashboard runs in fullscreen standalone mode

## Mobile CSS Utilities

```css
/* Safe area classes */
.safe-top    { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left   { padding-left: env(safe-area-inset-left); }
.safe-right  { padding-right: env(safe-area-inset-right); }

/* Mobile content spacing */
.mobile-content {
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}
```

## Best Practices

### Touch Interactions
- Minimum 44x44px touch targets
- Provide visual feedback (scale, color change)
- Use haptic feedback where possible
- Avoid hover-only interactions

### Performance
- Use CSS transforms for animations (GPU accelerated)
- Lazy load images and heavy components
- Minimize layout shifts
- Use will-change sparingly

### Accessibility
- Maintain 4.5:1 contrast ratio
- 16px minimum font size for body text
- Proper focus indicators
- Screen reader support

### iOS-Specific
- Disable text size adjustment: `-webkit-text-size-adjust: 100%`
- Prevent zoom on input focus: `font-size: 16px`
- Disable pull-to-refresh: `overscroll-behavior-y: none`
- Remove tap highlight: `-webkit-tap-highlight-color: transparent`

## Migration Guide

### Updating Existing Pages

1. **Wrap with MobileLayout** (optional, auto-adapts)
```tsx
import { MobileLayout } from "@/components/MobileLayout";

export default function Page() {
  return (
    <MobileLayout>
      {content}
    </MobileLayout>
  );
}
```

2. **Use MobileToolLayout for tool pages**
```tsx
import { MobileToolLayout } from "@/components/MobileToolLayout";

export default function ToolPage() {
  return (
    <MobileToolLayout
      title="Tool Name"
      icon={icon}
    >
      {content}
    </MobileToolLayout>
  );
}
```

3. **Replace cards with MobileToolCard**
```tsx
// Before
<div className="card" onClick={...}>
  <Icon /> Tool Name
</div>

// After
<MobileToolCard
  name="Tool Name"
  description="Description"
  icon={Icon}
  href="/tools/tool"
  color="#color"
/>
```

4. **Use mobile form components**
```tsx
// Before
<input type="text" />
<button>Submit</button>

// After
<MobileInput
  value={value}
  onChange={setValue}
  icon={Icon}
/>
<MobileButton onClick={handleSubmit}>
  Submit
</MobileButton>
```

## Examples

See the following files for implementation examples:
- `src/components/MobileNav.tsx` - Bottom navigation
- `src/components/MobileHeader.tsx` - Top header with menu
- `src/components/MobileToolCard.tsx` - Touch-friendly cards
- `src/components/MobileActionSheet.tsx` - Bottom sheets
- `src/app/layout.tsx` - PWA configuration

## Testing

### Browser Testing
- Safari iOS (primary target)
- Chrome iOS
- Safari macOS (responsive mode)

### Device Testing
- iPhone 12/13/14/15 (standard)
- iPhone 12/13/14/15 Pro Max (large)
- iPhone SE (small)
- iPad (tablet view)

### PWA Testing
1. Add to Home Screen
2. Test in standalone mode
3. Verify safe area insets
4. Check offline capability (future)
5. Test orientation lock

## Future Enhancements

- [ ] Service worker for offline support
- [ ] Push notifications
- [ ] App shortcuts
- [ ] Share target API
- [ ] Background sync
- [ ] Install prompts
- [ ] Swipe gestures
- [ ] Pull-to-refresh (controlled)

## Support

For questions or issues with the mobile design system:
- Check component docs above
- Review example implementations
- Test on actual iOS devices
- Consult iOS Human Interface Guidelines
