# Relationship Intel - Firestore Tag Categories Integration

## Overview

Integrating the new tag classification system into the existing relationship-intel tool. This adds Excel/Notion-style categorization while preserving all existing functionality.

## What's Being Integrated

### From `src/lib/relationships-db.ts`:
- **TagCategory system** - Multiple classification types with dropdown options
- **RelationshipMetadata** - Persistent storage for tags, notes, custom fields
- **Auto-save functionality** - Changes saved to Firestore immediately

### Default Tag Categories:
1. **Interest Level** (Green) - Hot, Warm, Cold, Prospect
2. **Industry** (Blue) - Tech, Finance, Real Estate, Sports, Healthcare, Other
3. **Relationship Type** (Purple) - Business, Investor, Partner, Friend, Family, Advisor
4. **Priority** (Orange) - High, Medium, Low

## Existing Features (Preserved):

✅ Email sync from 3 Gmail accounts
✅ Calendar meeting integration
✅ Auto-refresh every 5 minutes
✅ Smart status tracking (Active < 7d, Warm < 30d, Cold > 30d)
✅ Search & filter contacts
✅ Interaction timeline (emails + meetings)
✅ Manual notes per contact
✅ Company/position tracking
✅ Last sync timestamp

## New Features (Added):

✨ Tag category dropdowns in contact detail view
✨ Settings panel to create/edit tag categories
✨ Custom category colors
✨ Auto-save on tag/note changes
✨ Persistent storage via Firestore (contacts + metadata)

## Data Storage

**Firestore Collections:**

1. **`relationship_intel_contacts`** - Contact base data
   ```typescript
   {
     email: string
     name: string
     company?: string
     position?: string
     first_seen: timestamp
     last_seen: timestamp
     interaction_count: number
     projects: string[]
   }
   ```

2. **`relationships`** - Tag/note metadata (from relationships-db)
   ```typescript
   {
     contactId: string (email)
     contactEmail: string
     contactName: string
     tags: { [categoryId: string]: string }  // e.g., { "interest_level": "Hot" }
     notes: string
     customFields: object
     lastUpdated: timestamp
     createdAt: timestamp
   }
   ```

3. **`tag_categories`** - User-defined categories
   ```typescript
   {
     categories: TagCategory[]  // Array of category definitions
     lastUpdated: timestamp
   }
   ```

## API Routes

**Existing:**
- `GET /api/relationship-intel/projects/[id]` - Project stats
- `GET /api/relationship-intel/projects/[id]/contacts` - All project contacts
- `GET /api/relationship-intel/contacts/[email]/interactions` - Contact timeline
- `POST /api/relationship-intel/sync` - Trigger email/calendar sync

**No changes needed** - Tag system is client-side with direct Firestore access

## UI Changes

### Contact Detail Panel (Right Side):

**Before:**
- Header with name/company
- Interaction stats
- Notes textarea
- Email/meeting timeline

**After:**
- Header with name/company ✅ (same)
- Interaction stats ✅ (same)
- **NEW: Tag category dropdowns** (one per category)
- **NEW: Settings button** (create/edit categories)
- Notes textarea with auto-save ✅ (enhanced)
- Email/meeting timeline ✅ (same)

## Sync Script Integration

The backend sync script (`/home/ubuntu/clawd/relationship-intel/api/sync-emails.js`) continues to work unchanged. It populates `relationship_intel_contacts` and `relationship_intel_interactions`. The new tag system adds a parallel layer of metadata via the `relationships` collection.

## Migration

No migration needed! Existing contacts work as-is. Tag metadata is lazily created when user first sets a tag or note.

## Development

```bash
# Sync latest emails/meetings
cd /home/ubuntu/clawd/relationship-intel
npm run sync

# Test in dev
cd /home/ubuntu/clawd/normancdesilva
npm run dev

# Visit: http://localhost:3000/relationship-intel
```

## Deployment

Both systems deploy together:
- Next.js app (Vercel) - includes the React UI with tag categories
- Backend sync (Railway/systemd) - runs email sync script
- Firestore - shared database for both

No configuration changes needed.
