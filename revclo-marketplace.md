# Revclo Fashion Marketplace — Production Implementation Plan

## 1. Design System & Tokens (Figma `4s7XmrGNfsHoqVlFdfFaiS`)
- **Color Palette:**
  - Terracotta: `--terracotta-50: #fdf5f3` through `--terracotta-950: #361c15` (Primary Brand `#8b4736`, Deep `#693629`, Badge `#532b21`)
  - Locust (Olive/Sage): `--locust-50: #f6f7f2` through `--locust-900: #36392a` (`#a5ad86` accent)
  - Cod Gray & Warm Sand Neutrals:
    - App Canvas: `#f2f2f2`
    - Card Surface: `#f7f6f3`
    - Elevated Surface: `#ffffff`
    - Primary Border: `#dcd6cd`
    - Card Frame Border: `#cdc8bf`
    - Text Primary: `#161616`
    - Text Secondary: `#5e5e5e`
    - Text Muted: `#7c7c7c`
    - Pristine Badge: `#f2fedf` bg / `#007a00` text / `#b0c988` border
- **Typography:**
  - `Inter` (Body, UI labels, prices, badges)
  - `Fraunces` (Editorial serif headers)
  - `Caveat` & `Caveat Brush` (Handwritten script accents: `Certified Fits`, `Diesel`, `The Finds`, `The Loop`, `Take me to the sauce`)

## 2. Supabase Schema & Server Actions
- **Database Schema (`src/db/migration.sql`):**
  - Extend `products` with `trust_score`, `department`, `sub_category`, `color`, `material`, `brand_slug`, `collection_slug`
  - Add `brands`, `collections`, `conversations`, `messages`, `addresses`, and `order_ratings` tables with idempotent `CREATE TABLE IF NOT EXISTS` and seed rows
- **Server Actions (`src/actions/marketplace.ts` & `src/actions/products.ts`):**
  - Live Supabase queries with automatic fallback to `src/lib/revcloSeedData.ts` so every screen works out-of-the-box and persists mutations to Supabase when connected.

## 3. Routes & Screens
1. `/` (`src/app/page.tsx`, `src/components/revclo/HomeMarketplace.tsx`):
   - Discovery Feed Mode (`71:992`) + Outfit Masonry Grid Mode (`71:1782`) + Onboarding Modal (`360:4006`, `369:5219`)
2. `/search` & `/shop` (`src/app/search/page.tsx`, `src/app/shop/page.tsx`):
   - Top Searches & Full Catalog with Filter & Sort Sheet (`86:4587`, `98:3346`)
3. `/creator/[handle]` (`src/app/creator/[handle]/page.tsx`):
   - Creator Storefront (`93:3543` — Jenny Kayne `@jenny._`, Emily Stochl `@emillyy`)
4. `/collection/[slug]` (`src/app/collection/[slug]/page.tsx`):
   - Curated Collection Page (`93:4650` — `Summer Inspirations`, `Curated Classics`, `Summer Loving`)
5. `/brand/[slug]` (`src/app/brand/[slug]/page.tsx`):
   - Brand Storefront (`102:3591` — `Diesel`, `Lethal`, `Prada`, `Versace`)
6. `/chat` & `/chat/[id]` (`src/app/chat/page.tsx`, `src/app/chat/[id]/page.tsx`):
   - Direct Messages Inbox (`118:7954`) & Real-time Conversation Thread (`139:2583`)
7. `/sell` & `/closet/add` (`src/app/sell/page.tsx`, `src/app/closet/add/page.tsx`):
   - 3-Step AI-Assisted Listing Flow (`263:11704`, `263:11852`)
8. `/closet` (`src/app/closet/page.tsx`):
   - Self Closet & Seller Dashboard (`287:13579`, `297:13954`)
9. `/settings` (`src/app/settings/page.tsx`):
   - Settings, Verification, Linked Accounts, Report Problem (`178:5309`), User Policy (`178:6011`)
10. `/orders` (`src/app/orders/page.tsx`):
    - Past Orders (`270:5235`) + Expandable Bill Summary (`186:3024`) + Interactive Star Rating (`174:5443`)
11. `/addresses` (`src/app/addresses/page.tsx`):
    - My Saved Addresses (`180:3665`) + Add New Address Sheet (`197:5873`)
12. `/product/[id]`, `/cart`, `/checkout`:
    - Product Detail with AI Trust Score (`92–98`), Bag, and Checkout with Saved Address selection.
