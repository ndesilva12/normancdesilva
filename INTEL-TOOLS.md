# Intelligence Tools Documentation

## Overview

The dashboard includes 4 core intelligence tools for research and content curation. All tools use Firebase for persistence and include real-time history tracking.

## Tools

### 1. Curate (`/tools/curate`)

**Purpose:** AI-powered content curation tailored to Norman's worldview
- Anarcho-capitalist perspective
- Skeptical of centralized power
- Merit-based individualism

**Sources:**
- X/Twitter
- YouTube
- Reddit
- Rumble
- Spotify

**Categories:**
- Short-Unique
- Short-Trending
- Long-Unique
- Long-Trending

**API Endpoint:** `POST /api/curate`
```json
{
  "query": "topic to curate",
  "source": "all" | "news" | "twitter" | "youtube" | "reddit"
}
```

**Storage:** `curate_history` collection in Firebase

**External API:** Calls `${PYTHON_API_URL}/curate` (fire-and-forget)

**Response:**
```json
{
  "id": "history-doc-id",
  "status": "running",
  "message": "Curation started. Check history for results."
}
```

**Results Structure:**
- `summary`: Executive summary
- `patterns`: Identified trends
- `sources`: Array of {title, url, type}
- `insights`: Key takeaways

---

### 2. L3D - Last 30 Days (`/tools/l3d`)

**Purpose:** Research recent trends & insights from the last 30 days

**Sources:**
- Reddit (last 30 days)
- X/Twitter (last 30 days)
- Web (recency-prioritized)

**API Endpoint:** `POST /api/l3d`
```json
{
  "query": "research topic"
}
```

**Storage:** `l3d_history` collection in Firebase

**External API:** Calls `${PYTHON_API_URL}/l3d-research` (fire-and-forget)

**Response:**
```json
{
  "id": "history-doc-id",
  "status": "running",
  "message": "L3D research started. Check history for results."
}
```

**Results Structure:**
- `summary`: Research summary
- `patterns`: Trends over last 30 days
- `sources`: Recent sources
- `insights`: Actionable insights
- `copy_paste_prompts`: Ready-to-use prompts (optional)

---

### 3. Deep Search (`/tools/deep-search`)

**Purpose:** Expert-level research for people who already know the basics

**Philosophy:**
- Assumes reader is already an expert on fundamentals
- 90% advanced nuances, 10% context
- Focus on how things ACTUALLY work vs. simplified narratives
- Counterintuitive findings
- Ongoing expert debates

**API Endpoint:** `POST /api/deep-search`
```json
{
  "query": "research topic"
}
```

**Storage:** `deep_search_history` collection in Firebase

**AI Model:** Gemini 2.0 Flash with Google Search grounding

**Key Features:**
- Real URLs from Google Search (verified, not hallucinated)
- Expert-level analysis
- Social media highlights from experts
- Podcast references with timestamps
- Structured sections

**Response:**
```json
{
  "report": {
    "topic": "query",
    "briefOverview": "2-3 sentence context",
    "sections": [
      {
        "title": "Section title",
        "content": "Deep analysis",
        "links": [{"title": "...", "url": "...", "type": "article|video|podcast|..."}]
      }
    ],
    "hiddenMechanics": ["How X actually works..."],
    "counterintuitiveInsights": ["What challenges conventional wisdom..."],
    "expertDebates": ["Current disagreements among experts..."],
    "underreportedAngles": ["Aspects that deserve more attention..."],
    "socialMediaHighlights": [
      {"platform": "X/Twitter", "author": "@username", "content": "...", "url": "..."}
    ],
    "podcastReferences": [
      {"title": "Podcast", "episode": "Ep #", "timestamp": "1:23:45", "summary": "...", "url": "..."}
    ],
    "links": [{"title": "...", "url": "...", "type": "..."}],
    "timestamp": 1234567890
  }
}
```

**Sections Typically Covered:**
1. The Nuanced Reality - What simplified narrative misses
2. Hidden Mechanics - How it actually works
3. Edge Cases & Exceptions - Where rules break down
4. Historical Context - Backstory that changes understanding
5. Current Expert Debates - What specialists argue about
6. Recent Developments - What's changed recently
7. The Interesting Fringes - Unusual aspects
8. Insider Perspectives - What practitioners know

---

### 4. Dark Search (`/tools/dark-search`)

**Purpose:** Uncensored research exploring ALL perspectives, including controversial and fringe viewpoints

**Philosophy:**
- Governments lie to their own people
- Institutions protect themselves first
- "Conspiracy theory" is a control label
- Mainstream media is compromised
- The Overton window is manufactured

**Research Framework:**
- Question everything, especially official narratives
- Treat skepticism as intellectual virtue
- Explore conspiracy theories as valid hypotheses
- Present info from all angles without prejudging
- Value independent researchers, whistleblowers, alternative media

**Critical Framework - Aligned Interests:**
- WHO MUTUALLY BENEFITS: Groups whose interests ALIGN
- CONVERGENT AGENDAS: Different power centers with overlapping goals
- SHARED INCENTIVES: Multiple entities benefiting from same outcome

**API Endpoint:** `POST /api/dark-search`
```json
{
  "query": "research topic",
  "mode": "long" | "short" | "links"
}
```

**Storage:** `dark_search_history` collection in Firebase

**AI Model:** Gemini 2.0 Flash with Google Search grounding

**Modes:**
- `long`: Comprehensive report (default)
- `short`: Executive summary format
- `links`: Links-focused with brief context

**Response Structure:** (Similar to Deep Search)
```json
{
  "report": {
    "topic": "query",
    "mode": "long",
    "summary": "Comprehensive executive summary",
    "sections": [...],
    "keyTakeaways": ["Main points..."],
    "alternativePerspectives": ["Fringe/alternative views..."],
    "unansweredQuestions": ["What's still unclear..."],
    "socialMediaHighlights": [...],
    "podcastReferences": [...],
    "links": [...],
    "timestamp": 1234567890
  }
}
```

**Sections Typically Covered:**
1. Official Narrative
2. Alternative Perspectives
3. Suppressed Information
4. Follow the Money
5. Historical Parallels
6. Cui Bono (Who Benefits)
7. Mainstream Coverage Analysis
8. Independent Research

---

## History Component

All intel tools share the **IntelToolHistory** component (`/src/components/IntelToolHistory.tsx`)

**Features:**
- Auto-refreshes every 5 seconds
- Search across queries and results
- Filter by status (all/running/completed/failed)
- Expandable results
- Status icons: ⏱️ Running, ✅ Completed, ❌ Failed

**For Curate/L3D:**
- Structured rendering with color-coded sections
- Summary, Patterns, Sources, Insights
- External links with icons

**For Deep/Dark Search:**
- Uses DeepSearchResults component
- Sections displayed as separate blocks
- Color-coded by tool (blue for Deep, red for Dark)
- Social media highlights and podcast references

---

## Navigation

**IntelToolNav Component** provides:
- Back to Dashboard link
- Navigation between all 4 intel tools
- Active tool highlighting
- Color-coded icons

**Keyboard Shortcuts:**
- `Cmd/Ctrl + K`: Open Global Search (searches across all tools)
- Arrow keys: Navigate search results
- Enter: Select result
- Escape: Close search

---

## Environment Variables

Required for intel tools:

```env
# Firebase
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=the-dashboard-50be1

# External Python API (for Curate & L3D)
PYTHON_API_URL=https://api.normancdesilva.com

# Gemini AI (for Deep & Dark Search)
GEMINI_API_KEY=...
```

---

## Admin Endpoints

**Clear All Histories:** `POST /api/admin/clear-history`
- Clears: curate_history, l3d_history, deep_search_history, dark_search_history
- Returns: Count of deleted documents per collection

---

## Future Enhancements

**Planned:**
1. Export results to PDF/Markdown
2. Share results via link
3. Compare multiple searches
4. Tag and organize searches
5. Integration with Raindrop.io for auto-bookmarking
6. Notion export for research results
7. Scheduled/recurring searches
8. Email digest of completed searches

**Ideas:**
- Voice input for queries
- Image-based research (reverse image search integration)
- Multi-query batch processing
- Collaborative research sessions
- Research templates for common topics
