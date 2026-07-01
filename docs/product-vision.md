# Product Vision — REVCLO

## 1. Vision & Mission

### Vision Statement
A world where fashion is fully circular, allowing everyone to rotate and refresh their wardrobe continuously without financial cost or environmental waste.

### Mission Statement
REVCLO enables instant clothing exchange through a swipe-to-match marketplace, eliminating selling friction and lowball negotiations.

### Founder's Why
Aryan Singh's journey as a full-stack engineer and product builder led directly to the creation of REVCLO. Witnessing the massive volume of fast-fashion purchases among peers combined with the high friction of listing, selling, and bargaining on traditional marketplaces, it became obvious that the circular economy was broken for fashion. People have closets full of clothing they’ve worn once or twice, yet they continue to spend money on new outfits. Traditional platforms like Depop or Vinted treat clothing as a cash asset to be liquidated, creating high friction, low-value deals, and endless messaging. By treating clothing as a tradeable currency and using game-like matching mechanics, REVCLO turns closet rotation into a delightful, zero-cost interaction.

### Core Values
* **Circular first:** Every feature, design pattern, and user prompt is designed to encourage wardrobe rotation and reuse over raw consumption.
* **Zero friction swaps:** Swap matches must be instant and direct. The product avoids bargaining loops, messaging negotiations, and complex pricing formulas.
* **Premium thrift aesthetics:** Treat vintage and pre-loved clothes with the high-fashion editorial care they deserve. The platform looks like a curated scrapbook magazine, not a bargain bin.
* **Community trust:** Swaps are built on peer-to-peer verification and transparent catalog listing requirements (at least 4 images per item).

### Strategic Pillars
* **Swap over sell:** Exchange matching is the core loop. Cash transactions are a secondary, premium alternative for users who prefer direct buyouts.
* **Frictionless matching:** All clothes listed in the exchange catalog must be instantly tradeable. No delayed approvals or "is this still available" loops.
* **Curated styling:** Visual presentation matters. High-quality imagery, warm colors, and retro-polaroid frames elevate thrifting to an editorial experience.

### Success Looks Like
In 12 months, REVCLO will be the go-to circular fashion exchange platform for college campuses, hosting over 10,000 active users and facilitating 5,000+ successful instant clothing exchanges. Users will feel like their wardrobes are effectively infinite, rotating items regularly for weekend events.

---

## 2. User Research

### Primary Persona
* **Chloe, 20 (College Sophomore, Fashion enthusiast)**
  * **Daily routine:** Chloe buys trendy outfits for weekend events and posts them on Instagram. She has a closet full of clothes she has worn exactly once. She is on a tight student budget and cannot afford to keep buying new items.
  * **Pain point:** Chloe lists her items on Depop but gets lowball offers, gets ghosted in DMs, or waits weeks to sell an item for $10.
  * **Desired transformation:** Chloe wants to instantly trade her once-worn Zara dress for a vintage leather jacket someone else listed, without dealing with lowball offers or spending cash.

### Secondary Personas
* **Eco-conscious Thrifter (Liam, 22):** Dedicated to reducing carbon footprint, swaps exclusively to avoid buying new garments. Focuses on vintage and high-quality materials.
* **Independent Streetwear Seller (Marcus, 21):** Curates vintage streetwear drops. Lists unique items to find trades for rare grails, using REVCLO as a sourcing and swap network.

### Jobs To Be Done
* **Functional:** Easily swap unworn clothes for fresh styles without spending money or coordinating selling details.
* **Emotional:** Feel the excitement of acquiring new clothes without the guilt of spending or fast-fashion waste.
* **Social:** Be perceived as a stylish, sustainable trendsetter in her social circle.

### Pain Points
1. **DM haggling friction:** Traditional apps require negotiating prices and shipping with stranger-to-stranger messages. (High severity, happens on every transaction).
2. **Slow liquidation times:** Listing an item on Depop takes minutes, but finding a buyer takes weeks or months. (High severity, limits wardrobe rotation speed).
3. **High platforms fees:** Platform commissions and payment processing take a significant cut of low-price garments. (Medium severity).

### Current Alternatives & Competitive Landscape
* **Depop / Vinted:** Direct resale marketplaces. Excellent item catalog depth, but high friction due to negotiation, buyer inquiries, and listing management.
* **Instagram Trading DMs:** Informal peer-to-peer trades. High trust risk, no structured catalog matching, and manual shipping arrangement.
* **Thrift Store Swaps:** Physical events. Good community feel but restricted by geography, timing, and limited catalog sizes.

### Key Assumptions to Validate
* **We assume** users are willing to trade items rather than liquidate for cash. *Validation:* Offer instant trade vs direct buy choices on liked items and track user preference splits.
* **We assume** college students have high-quality items to list. *Validation:* Track listing rejection rates and user reports on item condition.
* **We assume** 4 images per item is achievable and reduces item condition disputes. *Validation:* Track user conversion rates on listing flows requiring 4 image uploads.

### User Journey Map
1. **Awareness:** Chloe sees a TikTok showing how another student swapped a dress for a designer top on REVCLO.
2. **Consideration:** Chloe visits the site and is wowed by the scrapbook aesthetic and clean list of available garments.
3. **First Use:** Chloe signs in via Google, takes 4 quick photos of a dress she won't wear again, and adds it to her catalog.
4. **Magic Moment:** Chloe enters the swiping deck, selects her dress as the offered item, swipes right on a leather jacket, and instantly gets the "It's a Match!" pop-up because the owner liked Chloe's dress.
5. **Advocacy:** Thrilled with her zero-cost swap, Chloe shares a screenshot of the match on her Instagram story.

---

## 3. Product Strategy

### Product Principles
* **Match-driven mechanics:** Everything is designed to lead to a match. No endless browsing; swipe with intent to swap.
* **Mandatory item quality:** Requiring at least 4 photos forces users to present their items honestly and clearly.
* **Editorial scrapbook look:** Tactile polaroids, rotated elements, washi-tape headers, and warm editorial fonts elevate the digital circular fashion experience.

### Market Differentiation
Unlike Depop and Vinted, which are cash-centric marketplaces with listing-to-sale timelines of weeks, REVCLO is a **match-first exchange network**. Matches are instant: both users select their offered items, and if they both swipe right on each other's items, the swap is locked instantly. The value proposition is time and friction reduction.

### Magic Moment Design
The magic moment is the **Tinder Match Overlay**. When a user swipes right and a mutual swap match is detected, the screen dims and displays the side-by-side Polaroid cards of the two matched garments with celebration particles and a direct action to complete the swap. This is optimized to trigger within the first 10 swipes for new users by promoting active items in their size.

### MVP Definition
* **OAuth Login:** Single-click secure Google Sign-In.
* **Closet Management:** Add items (title, brand, size, description, condition, category, and minimum 4 images) and manage listings.
* **Tinder Swipe Deck:** Interactive card swiping interface. Users select which of their listed items to offer for swap, then swipe through recommendations.
* **Match Dashboard:** List pending and completed matches, showing the item details and owner contact info.
* **Buy Directly:** Standard shopping cart and checkout gateway to purchase liked items directly.

### Explicitly Out of Scope
* **Direct messaging chat:** Swapping users are given contact/shipping details on match confirmation to arrange exchange. In-app chat is deferred to v2.
* **In-app shipping labels:** Users arrange their own shipping/pickup for v1. Managed shipping labels will be integrated in v2.

### Feature Priority (MoSCoW)
* **Must Have:**
  * Catalog listing upload (at least 4 images)
  * Swiping interface with offer-selector widget
  * Database match-detection engine (mutual right-swipes)
  * Match dashboard with confirmation states
* **Should Have:**
  * Direct buying cart and checkout flow
  * Warm paper scrapbook design theme with Polaroid cards
* **Could Have:**
  * User rating / review system
* **Won't Have:**
  * In-app chat / direct messages (V2)
  * Auto-generated shipping labels (V2)

### Core User Flows
* **Flow 1: Add garment to Closet**
  * Trigger: User click "List your clothes"
  * Steps: Upload 4 photos -> Fill size/brand -> Submit
  * Outcome: Item added to catalog and active for exchange matches.
* **Flow 2: Swipe and Match**
  * Trigger: User visits "/swipe"
  * Steps: Choose offer item -> Swipe right on target items -> Trigger match pop-up on mutual swipe.
  * Outcome: Match state written to DB.

### Success Metrics
* **Core Metric:** Swap Match Rate (number of mutual matches per 100 swipes).
* **Secondary Metric:** Listings per active user (target: average of 3 listings per user).
* **Retention Metric:** Weekly active swiping users.

### Risks
* **Risk: Low match liquidity.** Users swipe but don't match because of size mismatches. *Mitigation:* Filter the swiping deck strictly by the user's size and category preferences.
* **Risk: Poor item representation.** Users upload low-quality photos. *Mitigation:* Strict validation enforcing 4 photo slots.

---

## 4. Brand Strategy

### Positioning Statement
For Gen Z fashion enthusiasts who want to refresh their wardrobes continuously on a budget, REVCLO is a circular clothing swap platform that matches and exchanges garments instantly. Unlike traditional resale apps that require haggling, lowball negotiation, and listing fees, REVCLO enables instant clothes-for-clothes matching with zero fee swaps.

### Brand Personality
REVCLO behaves like a stylish, eco-conscious fashion editor. She is creative, curated, warm, and structured. Her wardrobe is vintage-heavy but clean. She loves high-quality materials and retro styling, and she makes thrifting feel like an art form.

### Voice & Tone Guide
| Context | Tone | Do | Don't |
| --- | --- | --- | --- |
| **Onboarding** | Welcoming & Curious | "Welcome to the collective. Let's upload your closet." | "Create your account to start selling." |
| **Error state** | Calm & Curated | "Oh no! We couldn't load your closet. Let's try refreshing." | "ERROR 500: Database failed." |
| **Empty state** | Encouraging | "Your closet is empty. Add your first item to start matching!" | "No items found." |
| **Match Success** | Celebratory | "It's a Match! You and Chloe liked each other's items." | "Exchange match registered." |
| **Payment Success**| Gratified | "Success! Your new style is locked in." | "Payment completed successfully." |

### Messaging Framework
* **Tagline:** Your closet is someone else's treasure.
* **Homepage Headline:** SWAP. DON'T SHOP.
* **Value Propositions:**
  * Circular Wardrobe: Infinite clothing rotations for zero cash.
  * Frictionless Exchange: Swipe, match, and swap instantly.
  * High-Fashion Editorial: Thrifting styled like a designer magazine.

### Elevator Pitches
* **5-second:** Tinder for sustainable clothes swapping.
* **30-second:** REVCLO lets young fashion lovers rotate their wardrobe for free. You list your clothes, swipe right on others, and when there's a mutual match, you instantly trade garments.
* **2-minute:** Every year, millions of tons of garments sit unused in closets because selling them on resale apps takes weeks and involves lowball offers and high fees. REVCLO turns clothes into trading currency. Users list their items with 4 photos, choose an item to offer, and swipe on other listings. When two users like each other's pieces, they match and swap instantly. It's a game-like, zero-cost circular fashion network.

### Competitive Differentiation Narrative
Traditional apps like Depop or Vinted treat garments as liquid assets. This forces sellers to act as commercial shops: negotiating prices, dealing with lowballs, and paying platform commissions. REVCLO removes the cash equation entirely. By centering the app around a mutual swiping card system, we match intent directly: you want what I have, and I want what you have. It turns wardrobe renewal into a direct swap experience.

---

## 5. Visual Design

Visual design tokens (colors, typography, spacing, components, motion) live in `docs/design.md`. If that file does not yet exist, run the Design System skill with image references to generate it before building.
