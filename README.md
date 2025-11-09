# CryoAnime

CryoAnime is a sleek, high-performance anime discovery platform built on Next.js 15 and TypeScript. It provides a modern, glassmorphism-inspired UI for browsing, searching, and exploring anime using the Jikan API (MyAnimeList data), with careful attention to performance, responsiveness, and user experience.

This project is suitable as:

- A production-ready anime discovery frontend
- A reference for building optimized, API-driven Next.js applications
- A portfolio-grade showcase of UI/UX, caching, and real-world data integration

## Features

- Modern anime discovery experience:
  - Home page with hero and featured sections
  - Detailed anime pages with rich metadata, trailers, and character cards
  - Anime-by-genre exploration with sorting and pagination
  - Top-rated anime listing
  - Trending/seasonal anime listing by current season
  - Movies view (via type-based filtering in API utilities)
  - Search with instant suggestions and full search results view
  - Weekly airing schedule with today-first ordering

- Data and performance:
  - Powered by the public Jikan REST API (MyAnimeList data)
  - Centralized API client with:
    - Request deduplication
    - Smart in-memory and localStorage caching
    - Rate limiting and retry logic
    - NSFW-aware filtering
    - Image URL optimization and preloading helpers

- User experience:
  - Dark, cool blue theme with subtle gradients and transparent surfaces
  - Radix UI and Lucide icons for accessible, consistent components
  - Responsive layout optimized for desktop and mobile
  - Search suggestions dropdown with debounced queries
  - Animated skeletons, loaders, and transitions
  - Anime schedule and seasonal pages optimized to avoid rate limiting

- Personalization and safety:
  - NSFW preference toggle persisted via local storage
  - Optional NSFW filtering applied at the API layer
  - Cookie consent component
  - Optimizations for low-end devices (“potato mode”) to reduce visual overhead

- Extras:
  - Live2D waifu integration via dedicated wrapper component
  - Dedicated About page showcasing the creator’s profile and skills
  - Clear code organization using the Next.js App Router

## Tech Stack

Core:

- Next.js 15 (App Router)
- React 19
- TypeScript
- Radix UI Themes (`@radix-ui/themes`)
- Lucide React icons
- Tailwind CSS v4 (with PostCSS and Autoprefixer)
- Jikan API v4 (external anime data source)

Tooling:

- ESLint with `eslint-config-next`
- TypeScript strict tooling
- Next.js Image Optimization (configured for `cdn.myanimelist.net`)

Key internal modules:

- [`lib/api.ts`](lib/api.ts): Typed Jikan API client (caching, rate-limit handling, helpers)
- [`lib/cache.ts`](lib/cache.ts): Local storage / in-memory caching helpers
- [`lib/userPreferences.ts`](lib/userPreferences.ts): NSFW and preference utilities
- [`components/anime_cards.tsx`](components/anime_cards.tsx): Anime grid and cards
- [`components/animesearchcard.tsx`](components/animesearchcard.tsx): Search result rendering
- [`components/layout/header.tsx`](components/layout/header.tsx): Global navigation, search, NSFW toggle
- [`components/layout/footer.tsx`](components/layout/footer.tsx): Global footer
- [`components/hero.tsx`](components/hero.tsx): Landing hero
- [`components/featured-section.tsx`](components/featured-section.tsx): Featured/landing content
- [`components/live2d-waifu.tsx`](components/live2d-waifu.tsx), [`components/Live2dWaifuWrapper.tsx`](components/Live2dWaifuWrapper.tsx): Live2D integration
- [`components/cookie-consent.tsx`](components/cookie-consent.tsx): Cookie consent banner
- [`components/Pagination.tsx`](components/Pagination.tsx): Pagination component

## Project Structure (Overview)

- `app/`
  - `layout.tsx`: Root layout, global theme, Live2D wrapper, cookie consent
  - `page.tsx`: Landing page with hero and featured content
  - `about/`: Creator/portfolio page
  - `anime/[id]/`: Detailed anime view (stats, synopsis, genres, characters, trailers)
  - `trending/`: Seasonal/trending anime list
  - `top-rated/`: Top-rated anime list
  - `seasonal/`: Season + year browser
  - `movies/`: Movies listing (via API utilities)
  - `Explore/`: Genre-based exploration
  - `search/`: Full search results page
  - `schedule/`: Weekly airing schedule
  - `faq/`, `privacy/`, etc.: Static informational pages (if present)
- `components/`: UI components, layout, cards, search results, Live2D
- `lib/`: API client, caching, utilities, user preferences
- `public/`: Static assets (favicon, etc.)
- Config: `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `.eslintrc.json`

## Prerequisites

- Node.js 18.18+ or 20+ (recommended for Next.js 15)
- npm (default), pnpm, or yarn
- Internet access (for Jikan API and external image host)

No database is required; all data is fetched from the Jikan API.

## Installation

1. Clone the repository:

   ```bash
   git clone <YOUR_REPO_URL> cryoanime
   cd cryoanime
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

## Configuration

By default, CryoAnime uses:

- Jikan API v4 at `https://api.jikan.moe/v4`
- Remote images from `cdn.myanimelist.net` (configured in `next.config.js:images`)

Optional environment variables (to be added by maintainers as needed):

- `NEXT_PUBLIC_JIKAN_BASE_URL`  
  Override the default Jikan endpoint (if you proxy or self-host).
- Any Live2D-related configuration keys (if your implementation requires them).

If you introduce environment variables:

- Document them in this section.
- Ensure they are referenced via `process.env.NEXT_PUBLIC_...` where appropriate.

## Running the Development Server

Start the dev server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Then open:

- <http://localhost:3000>

Key routes:

- `/` — Landing page
- `/trending` — Current seasonal anime
- `/top-rated` — Top rated anime
- `/seasonal` — Season/year selector
- `/movies` — Anime movies
- `/Explore` — Anime by genre
- `/search` — Full search results
- `/anime/[id]` — Anime details
- `/schedule` — Weekly airing schedule
- `/about` — About/portfolio page

## Usage Notes

- Searching:
  - Use the global search bar in the header.
  - Type at least 2 characters to trigger suggestions.
  - Press Enter or click the search icon to navigate to `/search?q=...`.

- NSFW Content:
  - Toggle via the shield icon in the header.
  - Preference is stored in local storage.
  - When disabled (default), NSFW titles are filtered out at the API layer.

- Performance:
  - API responses are cached in-memory and optionally in local storage to reduce calls.
  - Requests are deduplicated, throttled, and retried on transient errors.
  - Images are optimized via URL selection and `next/image` integration.

- Live2D Waifu:
  - Handled by the Live2d wrapper components.
  - If a model fails to load or is disabled, the core app still functions normally.

## Building for Production

Build:

```bash
npm run build
```

Start production server (after build):

```bash
npm run start
```

This runs a Next.js production server. For deployment:

- Vercel (recommended): Import the repository and deploy directly.  
- Custom hosting: Use `npm run build` and `npm run start` behind a reverse proxy.

Ensure:

- Node version on the server matches the prerequisites.
- Environment variables (if any) are set in your hosting provider.

## Running Tests

This repository currently does not include an automated test suite configuration.

Recommended next steps for maintainers:

- Add unit tests for `lib/api.ts` (caching, rate limiting, NSFW filtering).
- Add component tests for core UI (cards, search, schedule).
- Add integration tests for key routes.

Document test commands here once implemented, for example:

```bash
npm test
# or
npm run test:e2e
```

## Contribution Guidelines

Contributions are welcome. To keep the project clean and maintainable:

- Fork the repository and create a feature branch:
  - `feat/...` for new features
  - `fix/...` for bug fixes
  - `chore/...` for maintenance
- Follow the existing coding style:
  - TypeScript for all new logic
  - Prefer functional React components with hooks
  - Keep API logic in `lib/api.ts` or related utilities
- Run before opening a PR:
  - `npm run lint`
  - `npm run build` (to ensure type and route correctness)
- Keep commits focused and messages descriptive.

For larger changes (API behavior, caching strategy, or UI overhauls), open an issue or design proposal first.

## License

This project includes a `LICENSE` file in the repository.

- If this is not the intended license, maintainers should update:
  - The `LICENSE` file
  - This section to match the chosen license.

## Maintainer / Contact

Primary maintainer:

- Mtechsin (as referenced in the About page)

For issues, feature requests, or support:

- Open a GitHub Issue in this repository.
- Or contact via the email/GitHub link provided on the `/about` page.

If this deployment is used in production for a specific organization, maintainers should:

- Add official contact information here.
- Add any branding, usage, or API rate-limit notices required by their environment.
