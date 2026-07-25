# Plan — Blumi Concept Transition

Transitioning from a swipe-based swap deck to a conversation-first personal styling storefront with search-based fallbacks.

## Overview
Blumi's front door is a stylist chat interface. The system matches user requests to local 1-of-1 vintage inventory, falling back to Amazon/Flipkart web search results when unavailable, logging failed demands for our buyers, and tracking customer profiles (memory layer).

## Tech Stack
* Next.js (TypeScript)
* Supabase (Postgres & Auth)
* Serper.dev (Google Search visual & text matches)
* Gemini 3.1 Pro / 3.5 Flash (NLP parsing & response generation)
* GSAP & Vanilla CSS (Frosted glassmorphism, clean layouts, no purple/violet)

## File Structure
```
project-root/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── stylist/
│   │   │       └── route.ts       # [NEW] Stylist assistant router
│   │   ├── dashboard/
│   │   │   └── page.tsx           # [NEW] Admin Sourcing & Memory Dashboard
│   │   ├── page.tsx               # [MODIFY] Front door chat
│   │   └── layout.tsx             # [MODIFY] Standard layout imports
│   ├── lib/
│   │   ├── inventory.ts           # [NEW] Local vintage items archive
│   │   └── serper.ts              # [MODIFY] Add Google Search text query
│   └── components/
│       └── Header.tsx             # [MODIFY] Clean nav links
```

## Task Breakdown

### Phase 1: Foundation (Local Archive & Search Fallback)
* **Task 1:** Create `src/lib/inventory.ts` defining local 1-of-1 items.
  * *Input:* Static definitions of vintage corsets, blazers, jackets.
  * *Output:* Exported array of item objects (id, title, desc, price, size, image, tags, stylingNotes).
  * *Verify:* Imported in code, types match perfectly.
* **Task 2:** Update `src/lib/serper.ts` to implement `searchProducts`.
  * *Input:* search query text.
  * *Output:* Fetch `https://google.serper.dev/search` filtering for Amazon/Flipkart links, returning title, price, url, platform.
  * *Verify:* Call function with "black corset" and verify results output.

### Phase 2: Styling Agent Logic & Memory Logging
* **Task 3:** Create `/api/stylist` endpoint.
  * *Input:* POST prompt and user details.
  * *Output:* NLP parsing via Gemini. Local inventory search -> Serper fallback search if not found. Log memory profile & unstocked request logs in database/local state.
  * *Verify:* Test with cURL or postman.

### Phase 3: Conversational Front Door
* **Task 4:** Rewrite `src/app/page.tsx` to showcase the styling chat room.
  * *Input:* User chat panel with styling presets, conversation history, product recommendation frames.
  * *Output:* Dark paper-texture styling workspace (no violet/purple). Beautiful text bubble stream, buy direct buttons, and affiliate link buttons.
  * *Verify:* Verify layout responsiveness on mobile/desktop, no visual overlaps.

### Phase 4: Sourcing & Memory Dashboard
* **Task 5:** Create `src/app/dashboard/page.tsx`.
  * *Input:* Tabbed administration display.
  * *Output:* Sizing/budget memory grid, demand logging leaderboard, revenue graphs (direct vs affiliate).
  * *Verify:* Data correctly syncs with local storage/DB after user clicks/searches in the chat.

## Verification Checklist (Phase X)
* No purple/violet hex codes: [x]
* No standard template layouts: [x]
* Socratic Gate was respected: [x]
* `npx tsc --noEmit` runs clean: [x]
* `npm run build` runs success: [x]

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-07-03
