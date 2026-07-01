-- REVCLO Swap Platform — Database Migration
-- Run this in Supabase SQL Editor

-- 1. Extend products table with new columns for the swap platform
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS size TEXT DEFAULT 'Free Size',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Tops',
  ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Good',
  ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS available_for_exchange BOOLEAN DEFAULT true;

-- 2. Create swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swiped_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  offered_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('LEFT', 'RIGHT')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: a user can only swipe once on a product per offered item
CREATE UNIQUE INDEX IF NOT EXISTS idx_swipes_unique 
  ON swipes(swiper_id, swiped_product_id, offered_product_id);

-- Index for fast deck queries (what has this user already swiped on?)
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_product ON swipes(swiped_product_id);

-- 3. Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_a_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_b_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED')),
  user_a_confirmed BOOLEAN DEFAULT false,
  user_b_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_user_a ON matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(user_b_id);

-- 4. Create liked_items table
CREATE TABLE IF NOT EXISTS liked_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_liked_items_unique 
  ON liked_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_liked_items_user ON liked_items(user_id);

-- 5. Enable RLS on new tables
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for swipes
CREATE POLICY "Users can insert their own swipes" ON swipes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read their own swipes" ON swipes
  FOR SELECT USING (true);

-- RLS Policies for matches
CREATE POLICY "Users can read their own matches" ON matches
  FOR SELECT USING (true);
CREATE POLICY "Users can update their own matches" ON matches
  FOR UPDATE USING (true);
CREATE POLICY "System can insert matches" ON matches
  FOR INSERT WITH CHECK (true);

-- RLS Policies for liked_items
CREATE POLICY "Users can manage their liked items" ON liked_items
  FOR ALL USING (true);
