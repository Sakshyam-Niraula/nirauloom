# NIRAULOOM — Digital Creation Discovery Platform

> **"Discover the Internet, One Creation at a Time."**

NIRAULOOM is a global digital creation discovery platform that combines the tactile feel of an app launcher with the depth of a modern product directory. Discover websites, applications, generative tools, creative shaders, indie maker software, and student experiments from creators across the globe.

---

## 🎨 Design System

- **Forest Green** (`#173F35`): Dominant brand color.
- **Sand Beige** (`#E8DCC5`): Secondary brand color.
- **Electric Purple** (`#8B5CF6`): Selective accent & glow color.
- **Aesthetic**: Refined translucent glassmorphism with subtle backdrop blur, accessible contrast, and original geometric woven `N` SVG brand icon.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v7, Lucide icons.
- **Backend / Database**: Supabase (PostgreSQL, Row Level Security, Triggers).
- **AI Engine**: Google Gemini API (with compact token usage & fallback heuristics).
- **Deployment**: Ready for Cloudflare Pages (includes SPA routing `_redirects`).
- **Version Control**: Git.

---

## 🚀 Key Features

1. **App-Launcher Style Discovery**
   - App cards with launcher icons, tags, verified indicators, and appreciation metrics.
   - External links open safely in a new tab (`rel="noopener noreferrer"`).
2. **15 Core Categories & Subcategories**
   - E-commerce (D2C Brands, B2B Marketplaces, Sustainable Retail, Digital Goods, Fashion & Apparel, Artisan Crafts).
   - AI & Machine Learning, Developer Tools, Design & Creative, Productivity, Education, Gaming, Healthcare, and more.
3. **Dedicated Creation Details & Similar Suggestions**
   - Full description, screenshot carousel, creator metadata, appreciation upvoting, bookmarking, and reporting.
   - Algorithmic and semantic similar creations engine.
4. **Creator Studio & Moderation**
   - Creator submissions with pending/approved/rejected states.
   - Admin moderation console to approve/reject submissions with custom feedback and inspect user reports.
   - Creator public profiles with submission showcase and appreciation metrics.
5. **Thematic Stacks & Collections**
   - Create public/private collections.
   - AI Collection Architect: Describe a theme and AI curates approved items from the database.
6. **Real AI Capabilities (Gemini 1.5)**
   - **AI Creation Assistant**: Evaluates URL and title to generate concise tagline, description, category, and tags.
   - **Natural-Language Discovery**: Matches conversational queries (e.g., *"Find free AI tools for students"*) against actual database records.
   - **Graceful Fallbacks**: Works deterministically even if no API key is provided.

---

## 📦 Getting Started

### 1. Installation

```bash
cd nirauloom
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```


> Keep `GEMINI_API_KEY` server-side only. Never use a `VITE_` prefix for Gemini secrets. In Cloudflare Pages, add it as a server-side secret environment variable. The Supabase URL and publishable key are safe to expose in the frontend.

### 3. Database Migration (Supabase)

1. Open your Supabase project dashboard.
2. Apply the current, security-reviewed database migrations for your environment.
3. Run the category, subcategory, and tag seed statements from `supabase/seed.sql` if they are not already present.

> Do not rerun the original `supabase/schema.sql` against an existing production database without reviewing it first; it contains the original policies and is not the hardened migration currently applied to the live project.

### 4. Running Locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 5. Production Build & Deployment

```bash
npm run build
```

To deploy to **Cloudflare Pages**:
- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- The `public/_redirects` file ensures full client-side routing support (`/* /index.html 200`).
