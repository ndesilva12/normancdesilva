# The Dashboard

A curated collection of AI-powered tools for everyday productivity by Norman C. de Silva.

## Features

- Minimalist, professional design with glassmorphism effects
- Single cyan accent color theme
- Live date and time display
- DuckDuckGo web search
- Google authentication with Firebase
- Firestore database for caching AI responses
- PWA-ready for mobile installation
- Responsive grid layout

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Auth & Database**: Firebase (Auth + Firestore)
- **AI APIs**: Grok, Claude, Gemini
- **Deployment**: Vercel

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication → Sign-in method → Google
   - Create a Firestore database
   - Go to Project Settings → General → Your apps → Add web app
   - Copy the config values to Vercel environment variables

3. Run development server:
   ```bash
   npm run dev
   ```

## Environment Variables (Vercel)

Add these in your Vercel dashboard:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# AI APIs (Grok/xAI uses XAI_API_KEY, not GROK_API_KEY)
XAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

## License

MIT
