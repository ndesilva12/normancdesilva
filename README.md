# The Dashboard

A curated collection of AI-powered tools for everyday productivity by Norman C. de Silva.

## Features

- Minimalist, professional design with glassmorphism effects
- Single cyan accent color theme
- Live date and time display
- Google authentication with user profiles
- PWA-ready for mobile installation
- Search and filter tools by category
- Responsive grid layout

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: NextAuth.js with Google provider
- **Deployment**: Vercel

## Getting Started

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Set up Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID and Secret to your `.env.local`

3. Generate an auth secret:
   ```bash
   openssl rand -base64 32
   ```

4. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```

## Deployment on Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `AUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
3. Update Google OAuth redirect URI to your production URL

## License

MIT
