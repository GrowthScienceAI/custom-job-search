# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A job search aggregator that searches across multiple job boards with a single query, focusing on AI, Product Management, and Marketing roles. Currently integrates with Remotive API and uses mock data for demonstration.

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
- Fetches from Remotive API with 1-hour cache (`revalidate: 3600`)
- Filters local mock jobs by query
- Combines and deduplicates results (by title + company)
- Ranks by relevance (title match > company match > description match)
- Returns max 20 results

**Important:** Helper functions in server action files must NOT be exported (Next.js constraint).

### Search Flow

1. User types in search input ([src/app/page.tsx](src/app/page.tsx))
2. Debounced effect (500ms) triggers
3. Client calls `searchJobs()` server action
4. Server fetches Remotive API + filters mock data
5. Results rendered via `ResultsList` component

### Job Data Model

```typescript
interface Job {
  id: string;              // Format: "remotive-123" or "mock-1"
  title: string;
  company: string;
  location: string;
  salary?: string;
  postedDate: string;      // Human-readable (e.g., "2 days ago")
  description: string;
  sourceBoard: string;     // Which job board
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

- **Real data:** Remotive API (`https://remotive.com/api/remote-jobs`)
- **Mock data:** 5 sample jobs in [src/lib/data/mockJobs.ts](src/lib/data/mockJobs.ts)
- **Job boards:** 60+ boards cataloged in [src/lib/data/jobBoards.ts](src/lib/data/jobBoards.ts) but not yet integrated
- **Mock URLs:** Job links use placeholder domains (aijobs.ai, lennysjobs.com, etc. are not real)

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

### Remotive API

- **Endpoint:** `https://remotive.com/api/remote-jobs?search={query}`
- **Auth:** None required
- **Caching:** 1 hour (`next: { revalidate: 3600 }`)
- **Response:** Array of job objects with title, company, description, etc.

## Configuration Files

- **TypeScript:** Strict mode enabled, ES2017 target
- **Next.js:** Minimal config, no custom webpack or image domains
- **ESLint:** Next.js recommended + TypeScript configs
- **Tailwind:** v4 using `@tailwindcss/postcss` plugin (no separate config file)

## Deployment

See [deployment.md](deployment.md) for platform recommendations (Netlify for prototype, Railway for full platform).

**Build output:** `.next/` directory (gitignored)
