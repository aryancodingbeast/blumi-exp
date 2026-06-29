-- Supabase Database Schema Schema Migration
-- Blumi Streetwear Lookbook Platform

-- =========================================================================
-- 1. OG SELLERS APPLICATION TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.og_sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%%+-]+@igdtuw\.ac\.in$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comments for administrative context
COMMENT ON TABLE public.og_sellers IS 'Stores verified college students applying to become OG streetwear closet sellers.';
COMMENT ON COLUMN public.og_sellers.email IS 'Strictly enforces the campus email suffix verification.';


-- =========================================================================
-- 2. CAMPUS DISTRIBUTION ORDERS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.campus_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    buyer_id TEXT, -- References profile ID if registered
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.campus_orders IS 'Stores secure buyer name, contact, and item ledgers for campus pickup distribution.';
COMMENT ON COLUMN public.campus_orders.items IS 'JSONB array of ordered streetwear garment details.';
