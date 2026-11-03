# Frontend — AI Powered AICTE Document Verification

React + TypeScript frontend for the AICTE EoA pre-validation system.

## Setup

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build → dist/
npm run lint       # TypeScript type check
```

## Stack

- **React 19** + TypeScript
- **Vite 8** (dev server + bundler)
- **Tailwind CSS 4** (utility-first styling)
- **Recharts** (dashboard charts)
- **Lucide React** (icons)

## API

All `/api/*` requests are proxied to `http://127.0.0.1:8000` (FastAPI backend). See `vite.config.ts`.

## Environment

Copy `.env.example` to `.env.local` and fill in values before running.
