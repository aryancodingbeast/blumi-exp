-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create NextAuth Schema and Tables
CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

CREATE TABLE IF NOT EXISTS next_auth.users (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);

GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;

CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessionToken_unique UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;

CREATE TABLE IF NOT EXISTS next_auth.accounts (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    oauth_token_secret text,
    oauth_token text,
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT token_unique UNIQUE (token),
    CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);

GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;

-- 2. Public User Sync Trigger
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL,
    name text,
    email text,
    image text,
    handle text,
    bio text,
    instagram_url text,
    location text DEFAULT 'New Delhi',
    verified boolean DEFAULT true,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_id_fkey FOREIGN KEY (id)
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS handle text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location text DEFAULT 'New Delhi';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified boolean DEFAULT true;

GRANT ALL ON TABLE public.users TO postgres;
GRANT ALL ON TABLE public.users TO service_role;
GRANT SELECT, UPDATE, INSERT ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.users TO anon;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, image, handle, bio)
  VALUES (
    new.id,
    new.name,
    new.email,
    new.image,
    LOWER(REGEXP_REPLACE(COALESCE(new.name, 'revclo_user'), '[^a-zA-Z0-9]', '', 'g')),
    'Curating timeless pre-loved archive pieces on RevClo.'
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, email = EXCLUDED.email, image = EXCLUDED.image;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON next_auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON next_auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Shops Table
CREATE TABLE IF NOT EXISTS public.shops (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    bio text,
    avatar_url text,
    banner_url text,
    location text,
    rating numeric(3,2) DEFAULT 5.00,
    verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT shops_pkey PRIMARY KEY (id)
);

-- 4. Products Table (Extended for Revclo Marketplace)
CREATE TABLE IF NOT EXISTS public.products (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
    seller_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    brand text NOT NULL,
    brand_slug text,
    price integer NOT NULL,
    original_price integer,
    images text[] NOT NULL DEFAULT '{}',
    size text NOT NULL,
    condition text NOT NULL CHECK (condition IN ('Pristine', 'Excellent', 'Good', 'Well-loved', 'New with tags', 'Fair')),
    category text NOT NULL,
    sub_category text,
    department text DEFAULT 'Women',
    color text,
    material text,
    collection_slug text,
    trust_score integer DEFAULT 92,
    description text,
    measurements jsonb DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved', 'inactive')),
    ai_metadata jsonb DEFAULT '{}'::jsonb,
    likes_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT products_pkey PRIMARY KEY (id)
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sub_category text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS department text DEFAULT 'Women';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collection_slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 92;

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_department ON public.products(department);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_slug ON public.products(brand_slug);

-- 5. Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    bio text,
    logo_url text,
    hero_image_url text,
    website_url text,
    followers_count integer DEFAULT 0,
    is_featured boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT brands_pkey PRIMARY KEY (id)
);

-- 6. Collections Table
CREATE TABLE IF NOT EXISTS public.collections (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    subtitle text,
    creator_name text NOT NULL,
    creator_handle text NOT NULL,
    creator_avatar text NOT NULL,
    cover_image text NOT NULL,
    saves_count integer DEFAULT 119,
    items_count integer DEFAULT 12,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collections_pkey PRIMARY KEY (id)
);

-- 7. Likes / Watchlist Table
CREATE TABLE IF NOT EXISTS public.likes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT likes_pkey PRIMARY KEY (id),
    CONSTRAINT user_product_like_unique UNIQUE (user_id, product_id)
);

-- 8. Saved Addresses Table (Revclo My Addresses & Add New Address)
CREATE TABLE IF NOT EXISTS public.addresses (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    label text NOT NULL DEFAULT 'Home',
    receiver_name text NOT NULL,
    receiver_phone text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    landmark text,
    area text NOT NULL,
    city text NOT NULL DEFAULT 'New Delhi',
    pincode text DEFAULT '110053',
    distance_km numeric(4,1) DEFAULT 1.6,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT addresses_pkey PRIMARY KEY (id)
);

-- 9. Direct Messaging Conversations & Messages Tables
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    participant_name text NOT NULL,
    participant_handle text NOT NULL,
    participant_avatar text NOT NULL,
    participant_online boolean DEFAULT true,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    product_title text,
    product_price integer,
    product_size text,
    product_images text[] DEFAULT '{}',
    folder text NOT NULL DEFAULT 'all' CHECK (folder IN ('all', 'requests', 'archived')),
    unread_count integer DEFAULT 0,
    last_message text,
    last_message_time text DEFAULT '12:59',
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT conversations_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender text NOT NULL CHECK (sender IN ('me', 'them')),
    text text NOT NULL,
    timestamp_label text NOT NULL DEFAULT '02:59',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messages_pkey PRIMARY KEY (id)
);

-- 10. Orders Table (Extended with Bill Summary & Star Ratings)
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    order_number text DEFAULT '#8609655814',
    buyer_id uuid NOT NULL REFERENCES public.users(id),
    seller_id uuid NOT NULL REFERENCES public.users(id),
    product_id uuid NOT NULL REFERENCES public.products(id),
    amount integer NOT NULL,
    item_total numeric(10,2) DEFAULT 249.00,
    gst_amount numeric(10,2) DEFAULT 11.40,
    shipping_fee numeric(10,2) DEFAULT 40.00,
    discount_amount numeric(10,2) DEFAULT 100.01,
    total_paid numeric(10,2) DEFAULT 200.39,
    shop_name text DEFAULT 'Thriftitnaa',
    shop_location text DEFAULT 'Siliguri',
    rating integer DEFAULT 0,
    feedback text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
    razorpay_order_id text,
    razorpay_payment_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT orders_pkey PRIMARY KEY (id)
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text DEFAULT '#8609655814';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_total numeric(10,2) DEFAULT 249.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gst_amount numeric(10,2) DEFAULT 11.40;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee numeric(10,2) DEFAULT 40.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 100.01;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_paid numeric(10,2) DEFAULT 200.39;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shop_name text DEFAULT 'Thriftitnaa';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shop_location text DEFAULT 'Siliguri';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rating integer DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS feedback text;

-- 11. Supabase Google Price Scanner Agent Runs Table
CREATE TABLE IF NOT EXISTS public.price_agent_runs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    seller_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    brand text NOT NULL,
    garment_title text NOT NULL,
    category text NOT NULL,
    condition text NOT NULL DEFAULT 'Pristine',
    real_retail_price integer NOT NULL,
    recommended_resale_price integer NOT NULL,
    resale_low integer NOT NULL,
    resale_high integer NOT NULL,
    market_demand text DEFAULT 'high',
    sources jsonb DEFAULT '[]'::jsonb,
    search_queries text[] DEFAULT '{}',
    agent_status text DEFAULT 'completed',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT price_agent_runs_pkey PRIMARY KEY (id)
);

-- Grant permissions for all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
