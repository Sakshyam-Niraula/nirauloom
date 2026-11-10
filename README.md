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
VITE_GEMINI_API_KEY=your-gemini-api-key
```

> **Note**: If environment variables are omitted, NIRAULOOM automatically operates in **Local Interactive Preview Mode** with persistent local storage, seed creations, and intelligent heuristic search so every feature is immediately testable.

### 3. Database Migration (Supabase)

1. Open your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Run `supabase/schema.sql` to generate tables, indexes, triggers, and Row Level Security policies.
4. Run `supabase/seed.sql` to populate the 15 core categories, subcategories, tags, and initial creations.

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
