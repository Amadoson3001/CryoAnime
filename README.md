# CryoAnime

CryoAnime is a sleek, high-performance anime discovery platform built on Next.js 16 and TypeScript. It provides a modern, glassmorphism-inspired UI for browsing, searching, and exploring anime using the public AniList GraphQL API, with careful attention to performance, responsiveness, and user experience.

This project is suitable as:

- A production-ready anime discovery frontend
- A reference for building optimized, API-driven Next.js applications
- A portfolio-grade showcase of UI/UX, caching, and real-world data integration

## Gallery

| Home Page | Explore by Season |
|:-:|:-:|
| <img src="ScreenShots/Screenshot 2026-05-14 172050.png" width="450"> | <img src="ScreenShots/Screenshot 2026-05-14 172138.png" width="450"> |
| **Anime Details** | **Library** |
| <img src="ScreenShots/Screenshot 2026-05-14 172229.png" width="450"> | <img src="ScreenShots/Screenshot 2026-05-14 172425.png" width="450"> |

<details>
<summary>Click to expand / collapse full-size screenshots</summary>

### Home Page

<picture>
  <img src="ScreenShots/Screenshot 2026-05-14 172050.png" alt="Home page" width="960">
</picture>

### Explore by Season

<picture>
  <img src="ScreenShots/Screenshot 2026-05-14 172138.png" alt="Anime details" width="960">
</picture>

### Anime Details

<picture>
  <img src="ScreenShots/Screenshot 2026-05-14 172229.png" alt="Explore by genre" width="960">
</picture>

### Library

<picture>
  <img src="ScreenShots/Screenshot 2026-05-14 172425.png" alt="Search results" width="960">
</picture>

</details>

## Features

- Modern anime discovery experience:
  - Home page with hero and featured sections
  - Detailed anime pages with rich metadata, trailers, and character cards
  - Anime-by-genre exploration with sorting and pagination
  - Top-rated anime listing
  - Trending/seasonal anime listing by current season
  - Movies view via the server-side AniList query boundary
  - Search with instant suggestions and full search results view
  - Weekly airing schedule with today-first ordering

- Data and performance:
  - Powered by the public AniList GraphQL API
  - Server-only typed AniList client with:
    - Cache Components and operation-specific freshness windows
    - Genuine stale data during transient upstream failures
    - An 8-second timeout and typed retryable errors
    - Separate Mature and Explicit content filtering
    - Image URL optimization and responsive `next/image` cards

- User experience:
  - Dark, cool blue theme with subtle gradients and transparent surfaces
  - Local semantic layout primitives and the focused Radix Accordion primitive
  - Responsive layout optimized for desktop and mobile
  - Search suggestions dropdown with debounced queries
  - Animated skeletons, loaders, and transitions
  - Anime schedule and seasonal pages optimized to avoid rate limiting

- Personalization and safety:
  - Mature/Explicit preferences persisted in a secure, same-site, HTTP-only 30-day cookie
  - One-time migration from the legacy local-storage preference keys
  - Content filtering applied at the API layer and on detail pages
  - Cookie consent component
  - Optimizations for low-end devices (“potato mode”) to reduce visual overhead

- Extras:
  - Live2D waifu integration via dedicated wrapper component
  - Dedicated About page showcasing the creator’s profile and skills
  - Clear code organization using the Next.js App Router

## Tech Stack

Core:

- Next.js 16 (App Router)
- React 19
- TypeScript
- Local layout primitives in `components/ui-primitives.tsx`
- Lucide React icons
- AniList GraphQL API (external anime data source)

Tooling:

- ESLint with `eslint-config-next`
- TypeScript strict tooling
- Next.js Image Optimization (configured for AniList CDN artwork)

Key internal modules:

- [`lib/anilist.ts`](lib/anilist.ts): Server-only typed AniList boundary with Cache Components
- [`lib/cache.ts`](lib/cache.ts): In-process compatibility cache (no browser response persistence)
- [`lib/contentPreferences.ts`](lib/contentPreferences.ts): Secure preference-cookie serialization
- [`lib/contentRatings.ts`](lib/contentRatings.ts): Content classification and local provider overrides
- [`components/anime_cards.tsx`](components/anime_cards.tsx): Anime grid and cards
- [`components/animesearchcard.tsx`](components/animesearchcard.tsx): Search result rendering
- [`components/layout/header.tsx`](components/layout/header.tsx): Global navigation, search, and content filters
- [`components/layout/footer.tsx`](components/layout/footer.tsx): Global footer
- [`components/hero.tsx`](components/hero.tsx): Landing hero
- [`components/featured-section.tsx`](components/featured-section.tsx): Featured/landing content
- [`components/live2d-waifu.tsx`](components/live2d-waifu.tsx), [`components/Live2dWaifuWrapper.tsx`](components/Live2dWaifuWrapper.tsx): Live2D integration
- [`components/cookie-consent.tsx`](components/cookie-consent.tsx): Cookie consent banner
- [`components/PaginationLinks.tsx`](components/PaginationLinks.tsx): Server-rendered pagination links

## Project Structure (Overview)

- `app/`
  - `layout.tsx`: Root layout, global theme, Live2D wrapper, cookie consent
  - `page.tsx`: Landing page with hero and featured content
  - `about/`: Creator/portfolio page
  - `anime/[id]/`: Detailed anime view (stats, synopsis, genres, characters, trailers)
  - `trending/`: Seasonal/trending anime list
  - `top-rated/`: Top-rated anime list
  - `seasonal/`: Season + year browser
  - `movies/`: Movies listing
  - `Explore/`: Genre-based exploration
  - `search/`: Full search results page
  - `schedule/`: Weekly airing schedule
  - `faq/`, `privacy/`, etc.: Static informational pages (if present)
- `components/`: UI components, layout, cards, search results, Live2D
- `lib/`: API client, caching, utilities, user preferences
- `public/`: Static assets (favicon, etc.)
- Config: `next.config.js`, `tsconfig.json`, `eslint.config.mjs`

## Prerequisites

- Node.js 20.9+ (required by Next.js 16)
- npm (canonical package manager)
- Internet access (for AniList GraphQL and external image host)

No database is required; all data is fetched from AniList.

## Installation

1. Clone the repository:

   ```bash
   git clone <YOUR_REPO_URL> cryoanime
   cd cryoanime
   ```

2. Install dependencies:

```bash
npm install
```

## Configuration

By default, CryoAnime uses:

- AniList GraphQL API at `https://graphql.anilist.co`
- Remote images from `s4.anilist.co` (configured in `next.config.js:images`)

Optional environment variables (to be added by maintainers as needed):

- `ANILIST_API_URL`
  Override the server-side AniList endpoint when using an AniList-compatible
  proxy or a self-hosted GraphQL gateway.
- Any Live2D-related configuration keys (if your implementation requires them).

If you introduce environment variables:

- Document them in this section.
- Keep server-only values out of `NEXT_PUBLIC_*` so browser code cannot bypass
  the same-origin API boundary.

## Running the Development Server

Start the dev server:

```bash
npm run dev
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

- Content filtering:
  - Mature and Explicit controls are available independently in the header.
  - Preferences are stored in a secure, same-site, HTTP-only functional cookie.
  - Existing local-storage preference keys are migrated once and then removed.
  - AniList's adult flag and mature tags map to the Mature bucket; Hentai labels map to Explicit (`Rx - Hentai`). Local overrides handle nuanced classifications.

- Performance:
  - Server responses use operation-specific Cache Components profiles and a bounded stale cache.
  - Upstream requests are bounded by an 8-second timeout and return typed retryable errors.
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

All anime data requests are fetched server-side through the typed AniList boundary; the browser only calls same-origin routes. The included GitHub Actions workflow validates tests, types, the production build, and browser smoke tests; deploy the successful build to your hosting platform of choice.

Ensure:

- Node version on the server matches the prerequisites.
- Environment variables (if any) are set in your hosting provider.

## Running Tests

Run the reliability suite:

```bash
npm test -- --run
```

The CI workflow also checks TypeScript and creates a complete production build:

```bash
npm run type-check
npm run build
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
  - Keep server API logic in `lib/anilist.ts` and keep client components on compact models.
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
