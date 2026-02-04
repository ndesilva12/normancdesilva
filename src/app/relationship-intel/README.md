# Relationship Intel

**Professional relationship tracker for the Cinderella project.**

## Route

`/relationship-intel`

## Description

Standalone tool for tracking email and calendar interactions across project contacts. Completely independent UI - no visual connection to main dashboard.

## Features

- **Contact Management:** Track 84+ contacts with interaction history
- **Email Sync:** Automatically pulls from 3 Gmail accounts
- **Calendar Integration:** Tracks meetings with project-related attendees
- **Smart Status:** Active (< 7 days), Warm (< 30 days), Cold (> 30 days)
- **Search & Filter:** Find contacts by name, email, or notes
- **Auto-refresh:** Optional 5-minute polling
- **Manual Sync:** One-click email/calendar update

## API Endpoints

- `GET /api/relationship-intel/projects/cinderella` - Project stats
- `GET /api/relationship-intel/projects/cinderella/contacts` - All contacts
- `POST /api/relationship-intel/sync` - Trigger email sync

## Data

- **Database:** SQLite at `data/relationship-intel.db`
- **Sync Service:** Runs on backend server
- **Scope:** Last 60 days of interactions

## Deployment Notes

Database needs to be accessible to Vercel. Options:

1. **Vercel Blob Storage** (recommended for prod)
2. **Serverless API** via ngrok/Railway
3. **Firestore migration** (future)

See `RELATIONSHIP-INTEL.md` in repo root for full deployment guide.
