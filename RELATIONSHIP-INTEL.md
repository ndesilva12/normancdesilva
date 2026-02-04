# Relationship Intel - Deployment Guide

## ✅ What's Done

- **Route:** `/relationship-intel` (completely standalone page)
- **API:** `/api/relationship-intel/*`
- **Data:** 84 contacts, 428 interactions (414 emails, 14 meetings)
- **GitHub Branch:** `relationship-intel`
- **Style:** Independent dark theme (not connected to main dashboard visually)

## 🚀 Deploy to Vercel

### Option 1: Merge to Main Branch

```bash
cd /home/ubuntu/normancdesilva

# Merge relationship-intel into your main deployment branch
git checkout claude/explore-codebase-ui-dy2iD  # or whatever your main branch is
git merge relationship-intel
git push
```

Vercel will auto-deploy. Access at: **https://normancdesilva.vercel.app/relationship-intel**

### Option 2: Deploy from Branch (Preview)

1. Go to Vercel dashboard
2. Your `normancdesilva` project
3. Enable preview deployments from `relationship-intel` branch
4. Access at: **https://normancdesilva-{hash}.vercel.app/relationship-intel**

## 📦 Database Setup on Vercel

**Important:** The SQLite database needs to be uploaded to Vercel.

### Method 1: Environment Variable (Simple, Limited)

SQLite files can't be in git (too large + binary). Two options:

1. **Use Vercel Blob Storage** (recommended for production)
2. **Keep sync running on this server** and expose API via Railway/ngrok

### Method 2: Vercel Blob + Periodic Sync (Recommended)

```bash
# Install Vercel Blob
npm install @vercel/blob

# Update db.ts to use Vercel Blob for storage
# Sync script uploads to Blob instead of local file
```

### Method 3: Hybrid (Easiest for Now)

Keep the sync service running on **this server**, deploy only the frontend to Vercel:

1. **On this server:** Run the sync + API
2. **Update frontend** to call your server's API instead of `/api/relationship-intel`

```bash
# Install ngrok for public URL
ngrok http 3001

# Update page.tsx API_URL to ngrok URL
```

## 🔄 Auto-Sync Setup

### On This Server

```bash
# Add to crontab
crontab -e
```

Add:
```
0 */6 * * * cd /home/ubuntu/clawd/relationship-intel/api && /usr/bin/node sync-emails.js >> /tmp/relationship-intel-sync.log 2>&1
```

This runs every 6 hours and updates the database. Vercel deployment will read from it.

## 🎨 Current Features

- ✅ Auto-refresh every 5 minutes (toggle)
- ✅ Manual "Sync Emails" button
- ✅ Search contacts by name/email
- ✅ Sort by: Recent, Name A-Z, Most Interactions
- ✅ Status indicators: Active (< 7 days), Warm (< 30 days), Cold (> 30 days)
- ✅ Interaction counts per contact
- ✅ Last contact timestamps
- ✅ This week activity count

## 📊 Data Summary

**Current sync (last 60 days):**
- 84 contacts
- 414 emails
- 14 calendar meetings
- 428 total interactions

**Improved calendar detection** now includes:
- Meetings with keyword matches (cinderella, ncaa, etc.)
- Meetings with ANY contact from your email history

## 🔧 Local Testing

```bash
cd /home/ubuntu/normancdesilva
npm run dev
```

Visit: http://localhost:3000/relationship-intel

API endpoints:
- http://localhost:3000/api/relationship-intel/projects/cinderella
- http://localhost:3000/api/relationship-intel/projects/cinderella/contacts
- http://localhost:3000/api/relationship-intel/sync (POST)

## 🎯 Next Steps

1. **Merge to main** and deploy to Vercel
2. **Set up database sync** (choose Method 1, 2, or 3 above)
3. **Add Listid project** (3-4 years of data)
4. **Build contact detail modal** (click contact → see full email/meeting history)
5. **Add manual notes UI** (edit notes inline)
6. **Email notifications** (alert when important contacts go cold)

## 📝 Files Added

```
src/app/relationship-intel/
  └── page.tsx                           # Main UI (standalone)

src/app/api/relationship-intel/
  ├── lib/
  │   └── db.ts                          # SQLite connection
  ├── projects/[id]/
  │   ├── route.ts                       # GET /api/relationship-intel/projects/:id
  │   └── contacts/
  │       └── route.ts                   # GET /api/relationship-intel/projects/:id/contacts
  └── sync/
      └── route.ts                       # POST /api/relationship-intel/sync

data/
  └── relationship-intel.db              # SQLite database (not in git)
```

## 🔐 Security Notes

- Database contains email content - keep secure
- Consider adding auth middleware for production
- API currently has no rate limiting
- CORS enabled for Vercel domain

## 📚 Related Repos

- Standalone version: https://github.com/ndesilva12/relationship-intel (for reference)
- This implementation: Integrated into normancdesilva monorepo

---

**Ready to deploy!** Let me know which database approach you prefer and I'll help configure it.
