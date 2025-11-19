# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A job search aggregator that searches across multiple job boards with a single query, focusing on AI, Product Management, and Marketing roles. Currently integrates with 5 job board APIs (Remotive, Jobicy, Arbeitnow, The Muse, Adzuna) plus mock data for demonstration.

**Tech Stack:**
- Next.js 16.0.3 (App Router)
- React 19.2.0
- TypeScript (strict mode)
- Tailwind CSS 4.x
- Radix UI components
- Lucide React icons

## Development Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Run production server
npm run lint     # Run ESLint
```

**Note:** No test suite is currently configured.

## Architecture

### Project Structure

- `src/app/` - Next.js App Router (layout, pages, global styles)
- `src/components/ui/` - Reusable UI primitives (Button, Badge, Input, etc.)
- `src/components/search/` - Search-specific components (JobCard, ResultsList, FilterPanel)
- `src/components/layout/` - Layout components (Header, Footer)
- `src/lib/search/` - Server actions for job search
- `src/lib/data/` - Static data (job board metadata, mock jobs)

**Path Alias:** Use `@/*` imports (maps to `./src/*`)

### Server Actions Pattern

All data fetching uses Next.js server actions, not API routes.

**Location:** [src/lib/search/searchEngine.ts](src/lib/search/searchEngine.ts)

Key function: `searchJobs(query: string)` marked with `"use server"`
- Fetches from 5 job board APIs in parallel using `Promise.allSettled`
- Each API has 1-hour cache (`revalidate: 3600`)
- Filters local mock jobs by query
- Combines and deduplicates results (by title + company)
- Ranks by relevance (title match > company match > description match)
- Returns combined results from all sources

**Important:** Helper functions in server action files must NOT be exported (Next.js constraint).

### Search Flow

1. User types in search input ([src/app/page.tsx](src/app/page.tsx))
2. Debounced effect (500ms) triggers
3. Client calls `searchJobs()` server action
4. Server fetches from all 5 APIs in parallel + filters mock data
5. Failed API calls are gracefully handled (don't block other sources)
6. Results combined, deduplicated, and ranked
7. Results rendered via `ResultsList` component

### Job Data Model

```typescript
interface Job {
  id: string;              // Format: "remotive-123", "jobicy-456", "arbeitnow-789", "muse-101", "adzuna-202", "mock-1"
  title: string;
  company: string;
  location: string;
  salary?: string;
  postedDate: string;      // Human-readable (e.g., "Jan 15, 2025")
  description: string;
  sourceBoard: string;     // Which job board ("Remotive", "Jobicy", "Arbeitnow", "The Muse", "Adzuna")
  tags: string[];
  url: string;             // Application link
}
```

## Component Patterns

### Server vs Client Components

**Client components** (require `"use client"`):
- [src/app/page.tsx](src/app/page.tsx) - Manages search state
- [src/components/search/FilterPanel.tsx](src/components/search/FilterPanel.tsx)
- All Radix-based components (Checkbox, Label)

**Server components** (default):
- Layout components (Header, Footer)
- ResultsList, JobCard
- All `src/components/ui/` except Checkbox and Label

### UI Component Style

Components follow Shadcn/ui patterns:
- Built on Radix UI primitives for accessibility
- Use CVA (Class Variance Authority) for variants
- Forward refs for composition
- `cn()` utility for class merging (from [src/lib/utils.ts](src/lib/utils.ts))
- Support `asChild` prop pattern via Radix Slot

Example:
```tsx
<Button variant="outline" size="lg">Click me</Button>
```

## Important Caveats

### Non-Functional UI Elements

1. **FilterPanel** ([src/components/search/FilterPanel.tsx](src/components/search/FilterPanel.tsx))
   - Renders category/location/experience filters
   - **Not connected to search logic** - purely visual
   - SearchFilters interface exists but unused

2. **SearchInput Component** ([src/components/search/SearchInput.tsx](src/components/search/SearchInput.tsx))
   - Exists but **not used** in the app
   - Inline input in `page.tsx` instead

### Data Sources

**Active Integrations:**
- **Remotive** - Remote tech jobs (no auth required)
- **Jobicy** - Remote jobs across industries (no auth required)
- **Arbeitnow** - Remote-first tech jobs (no auth required)
- **The Muse** - PM/Marketing/Startup jobs (requires free API key)
- **Adzuna** - Job aggregator with salary data (requires free API credentials)
- **Mock data:** 5 sample jobs in [src/lib/data/mockJobs.ts](src/lib/data/mockJobs.ts)

**Cataloged but Not Integrated:**
- 60+ boards in [src/lib/data/jobBoards.ts](src/lib/data/jobBoards.ts) (most lack public APIs)

## Styling

### Tailwind Configuration

Uses Tailwind CSS 4.x with CSS-based configuration in [src/app/globals.css](src/app/globals.css):
- Custom CSS variables for theming
- Dark mode via `prefers-color-scheme`
- Primary color: Blue (#2563eb)
- Mobile-first responsive design with `lg:` breakpoints

### Class Management

Always use the `cn()` utility when merging classes:
```tsx
import { cn } from "@/lib/utils"
className={cn("base-classes", conditionalClass && "extra-classes", className)}
```

## External Integrations

### Job Board APIs

All APIs are called in parallel using `Promise.allSettled` for resilience. Each has 1-hour caching.

#### 1. Remotive API
- **Endpoint:** `https://remotive.com/api/remote-jobs?search={query}`
- **Auth:** None required
- **Features:** Direct search support, remote tech jobs
- **Response:** `{ jobs: [...] }`

#### 2. Jobicy API
- **Endpoint:** `https://jobicy.com/api/v2/remote-jobs?count=50`
- **Auth:** None required
- **Features:** Fetches latest 50, manual filtering client-side
- **Response:** `{ jobs: [...] }`

#### 3. Arbeitnow API
- **Endpoint:** `https://www.arbeitnow.com/api/job-board-api`
- **Auth:** None required
- **Features:** Remote-first jobs, manual filtering client-side
- **Response:** `{ data: [...] }`

#### 4. The Muse API (Optional)
- **Endpoint:** `https://www.themuse.com/api/public/jobs?api_key={key}`
- **Auth:** Free API key required - Register at [themuse.com/developers](https://www.themuse.com/developers)
- **Env Var:** `THE_MUSE_API_KEY`
- **Features:** Excellent for PM/Marketing roles, startup jobs
- **Response:** `{ results: [...] }`
- **Graceful Degradation:** Skips if API key not provided

#### 5. Adzuna API (Optional)
- **Endpoint:** `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id={id}&app_key={key}&what={query}`
- **Auth:** Free credentials required - Register at [developer.adzuna.com](https://developer.adzuna.com)
- **Env Vars:** `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`
- **Features:** Aggregates multiple sources, includes salary data
- **Free Tier:** 1000 calls/month
- **Response:** `{ results: [...] }`
- **Graceful Degradation:** Skips if credentials not provided

### Environment Variables

Create a `.env.local` file (see [.env.local.example](.env.local.example)):
```bash
THE_MUSE_API_KEY=your_key_here        # Optional
ADZUNA_APP_ID=your_id_here            # Optional
ADZUNA_APP_KEY=your_key_here          # Optional
```

**Note:** App works with 3 job boards (Remotive, Jobicy, Arbeitnow) without any API keys.

## Configuration Files

- **TypeScript:** Strict mode enabled, ES2017 target
- **Next.js:** Minimal config, no custom webpack or image domains
- **ESLint:** Next.js recommended + TypeScript configs
- **Tailwind:** v4 using `@tailwindcss/postcss` plugin (no separate config file)

## Deployment

See [deployment.md](deployment.md) for platform recommendations (Netlify for prototype, Railway for full platform).

**Build output:** `.next/` directory (gitignored)
