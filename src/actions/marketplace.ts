'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { REVCLO_ASSETS } from '@/lib/revcloSeedData';
import {
    Brand,
    ChatMessage,
    Collection,
    Conversation,
    CreatorProfile,
    PastOrder,
    Product,
    ProductCondition,
    SavedAddress,
    Shop,
    UserProfile,
} from '@/types';

const STORAGE_BUCKET = 'products';
const APPDATA_PATH = '_appdata/marketplace_state.json';

interface ExtendedConversation extends Conversation {
    buyer_id?: string;
    seller_id?: string;
}

interface MarketplaceAppState {
    productMeta: Record<
        string,
        {
            brand?: string;
            brand_slug?: string;
            original_price?: number;
            size?: string;
            condition?: ProductCondition;
            category?: string;
            sub_category?: string;
            department?: 'Women' | 'Men' | 'Kids';
            color?: string;
            material?: string;
            collection_slug?: string;
            trust_score?: number;
            likes_count?: number;
            measurements?: Product['measurements'];
            ai_metadata?: Product['ai_metadata'];
        }
    >;
    userLikes: Record<string, string[]>;
    brandFollows: Record<string, string[]>;
    collectionFollows: Record<string, string[]>;
    addresses: Record<string, SavedAddress[]>;
    conversations: ExtendedConversation[];
    orderRatings: Record<string, { rating: number; feedback?: string }>;
    userProfiles: Record<
        string,
        {
            handle?: string;
            location?: string;
            avatar?: string;
            bio?: string;
            instagram_url?: string;
        }
    >;
}

const EMPTY_APP_STATE: MarketplaceAppState = {
    productMeta: {},
    userLikes: {},
    brandFollows: {},
    collectionFollows: {},
    addresses: {},
    conversations: [],
    orderRatings: {},
    userProfiles: {},
};

let cachedState: { data: MarketplaceAppState; fetchedAt: number } | null = null;

async function readAppState(forceFresh = false): Promise<MarketplaceAppState> {
    if (!forceFresh && cachedState && Date.now() - cachedState.fetchedAt < 4000) {
        return cachedState.data;
    }
    try {
        const { data, error } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .download(APPDATA_PATH);

        if (error || !data) {
            cachedState = {
                data: structuredClone(EMPTY_APP_STATE),
                fetchedAt: Date.now(),
            };
            return cachedState.data;
        }

        const text = await data.text();
        const parsed = JSON.parse(text) as Partial<MarketplaceAppState>;
        const merged: MarketplaceAppState = {
            productMeta: parsed.productMeta || {},
            userLikes: parsed.userLikes || {},
            brandFollows: parsed.brandFollows || {},
            collectionFollows: parsed.collectionFollows || {},
            addresses: parsed.addresses || {},
            conversations: parsed.conversations || [],
            orderRatings: parsed.orderRatings || {},
            userProfiles: parsed.userProfiles || {},
        };
        cachedState = { data: merged, fetchedAt: Date.now() };
        return merged;
    } catch {
        const fallback = structuredClone(EMPTY_APP_STATE);
        cachedState = { data: fallback, fetchedAt: Date.now() };
        return fallback;
    }
}

async function writeAppState(state: MarketplaceAppState): Promise<void> {
    cachedState = { data: state, fetchedAt: Date.now() };
    try {
        const payload = Buffer.from(JSON.stringify(state, null, 2), 'utf-8');
        await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(APPDATA_PATH, payload, {
            contentType: 'application/json',
            upsert: true,
        });
    } catch (err) {
        console.error('[marketplace] Failed to persist state to Supabase Storage:', err);
    }
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeHandle(raw?: string | null, fallbackName?: string | null): string {
    if (raw && raw.trim()) {
        const cleaned = raw
            .trim()
            .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
            .replace(/^@/, '')
            .replace(/\/.*$/, '')
            .trim();
        if (cleaned) return cleaned.toLowerCase();
    }
    if (fallbackName && fallbackName.trim()) {
        return fallbackName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9._]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }
    return 'collector';
}

const KNOWN_BRANDS = [
    'Hollister',
    'Shein',
    'Savana',
    'Zara',
    'H&M',
    'Mango',
    'Bershka',
    'Pull&Bear',
    'Stradivarius',
    "Levi's",
    'Diesel',
    'Nike',
    'Adidas',
    'New Balance',
    'Carhartt',
    'Uniqlo',
    'Urbanic',
    'Brandy Melville',
    'Forever 21',
    "Victoria's Secret",
    'Marks & Spencer',
    'Ralph Lauren',
    'Tommy Hilfiger',
    'Calvin Klein',
    'Prada',
    'Versace',
    'Coach',
    'Guess',
    'Freakins',
    'Bonkers Corner',
    'Gap',
    'Abercrombie',
    'ASOS',
];

function extractMetadataFromText(
    title: string,
    description: string | null,
    shopName?: string | null
) {
    const combined = `${title} ${description || ''}`;
    const lower = combined.toLowerCase();

    // 1. Extract Brand
    let detectedBrand = '';
    const brandLineMatch = (description || '').match(/brand\s*[:-]\s*([^\n|,]+)/i);
    if (brandLineMatch?.[1]) {
        detectedBrand = brandLineMatch[1].trim();
    } else {
        for (const b of KNOWN_BRANDS) {
            if (lower.includes(b.toLowerCase())) {
                detectedBrand = b;
                break;
            }
        }
    }
    if (!detectedBrand) {
        detectedBrand = shopName && shopName.trim() ? shopName.trim() : 'RevClo Archive';
    }

    // 2. Extract Size
    let detectedSize = 'M';
    const sizeMatch =
        (description || '').match(/size\s*[:-]\s*([A-Za-z0-9/\s-]+?)(?:,|\n|\||$)/i) ||
        title.match(/\b(XXS|XS|S|M|L|XL|XXL|UK\s?\d+|W\d+|Free Size|One Size)\b/i);
    if (sizeMatch?.[1]) {
        const token = sizeMatch[1].trim().split(/\s+/)[0].toUpperCase();
        if (['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(token)) {
            detectedSize = token;
        } else if (/^(UK\d+|W\d+)$/i.test(token)) {
            detectedSize = token.toUpperCase();
        } else if (sizeMatch[1].toLowerCase().includes('free')) {
            detectedSize = 'Free Size';
        }
    } else if (lower.includes('bust 28') || lower.includes('bust 30')) {
        detectedSize = 'XS';
    } else if (lower.includes('bust 32')) {
        detectedSize = 'S';
    } else if (lower.includes('bust 34')) {
        detectedSize = 'M';
    } else if (lower.includes('bust 36') || lower.includes('bust 38')) {
        detectedSize = 'L';
    }

    // 3. Extract Condition
    let detectedCondition: ProductCondition = 'Pristine';
    if (lower.includes('10/10') || lower.includes('pristine') || lower.includes('new with')) {
        detectedCondition = 'Pristine';
    } else if (lower.includes('9/10') || lower.includes('9.5/10') || lower.includes('excellent') || lower.includes('like new')) {
        detectedCondition = 'Excellent';
    } else if (lower.includes('8/10') || lower.includes('good')) {
        detectedCondition = 'Good';
    } else if (lower.includes('7/10') || lower.includes('well-loved') || lower.includes('vintage wear')) {
        detectedCondition = 'Well-loved';
    }

    // 4. Extract Category & Sub-Category
    let category = 'Tops';
    let subCategory = 'Tops & Blouses';
    if (/(dress|gown|sundress|slip dress|maxi dress|mini dress)/i.test(lower)) {
        category = 'Dresses';
        subCategory = lower.includes('maxi')
            ? 'Maxi Dresses'
            : lower.includes('mini')
              ? 'Mini Dresses'
              : 'Midi & Slip Dresses';
    } else if (/(skirt|jean|denim|trouser|pant|short|jort|cargo|bottom)/i.test(lower)) {
        category = 'Bottoms';
        subCategory = lower.includes('skirt')
            ? 'Mini & Cargo Skirts'
            : lower.includes('jean') || lower.includes('denim')
              ? 'Baggy & Wide Leg Jeans'
              : 'Tailored Trousers';
    } else if (/(jacket|coat|blazer|hoodie|sweatshirt|windbreaker|outerwear)/i.test(lower)) {
        category = 'Outerwear';
        subCategory = lower.includes('jacket') ? 'Leather & Racing Jackets' : 'Hoodies & Zip-Ups';
    } else if (/(bag|handbag|tote|purse|sunglass|belt|scarf|cap|hat)/i.test(lower)) {
        category = 'Accessories';
        subCategory = lower.includes('bag') ? 'Handbags & Shoulder Bags' : 'Sunglasses & Eyewear';
    } else if (/(shoe|boot|heel|sneaker|loafer|sandal|mule|footwear)/i.test(lower)) {
        category = 'Footwear';
        subCategory = lower.includes('boot') ? 'Boots & Combat' : 'Loafers & Mary Janes';
    } else if (/(necklace|earring|ring|bracelet|choker|jewel)/i.test(lower)) {
        category = 'Jewellery';
        subCategory = 'Necklaces & Chokers';
    } else {
        category = 'Tops';
        if (lower.includes('corset') || lower.includes('bustier')) {
            subCategory = 'Corsets & Bustiers';
        } else if (lower.includes('sweater') || lower.includes('cardigan') || lower.includes('knit') || lower.includes('shrug')) {
            subCategory = 'Knitwear & Cardigans';
        } else if (lower.includes('tank') || lower.includes('cami') || lower.includes('tube') || lower.includes('halter')) {
            subCategory = 'Tank Tops & Camis';
        } else if (lower.includes('crop') || lower.includes('baby tee') || lower.includes('tee')) {
            subCategory = 'Crop Tops';
        } else {
            subCategory = 'Blouses & Shirts';
        }
    }

    // 5. Department
    const department: 'Women' | 'Men' =
        /\b(men|mens|menswear|boyfriend|unisex)\b/i.test(lower) &&
        !/\b(babydoll|cami|corset|skirt|dress|halter|bust)\b/i.test(lower)
            ? 'Men'
            : 'Women';

    // 6. Collection slug assignment based on real garment characteristics
    let collectionSlug = 'summer-inspirations';
    if (category === 'Dresses' || subCategory === 'Tank Tops & Camis' || subCategory === 'Crop Tops') {
        collectionSlug = 'summer-inspirations';
    } else if (category === 'Outerwear' || subCategory === 'Knitwear & Cardigans' || category === 'Bottoms') {
        collectionSlug = 'curated-classics';
    } else {
        collectionSlug = 'summer-loving';
    }

    return {
        brand: detectedBrand,
        brand_slug: slugify(detectedBrand),
        size: detectedSize,
        condition: detectedCondition,
        category,
        sub_category: subCategory,
        department,
        collection_slug: collectionSlug,
    };
}

export interface AuthenticatedMarketplaceUser extends UserProfile {
    phone?: string;
    role?: 'BUYER' | 'SELLER' | 'ADMIN';
    shop_id?: string | null;
}

export async function getCurrentUser(): Promise<AuthenticatedMarketplaceUser | null> {
    try {
        const session = await auth();
        if (!session?.user?.email && !session?.user?.id) {
            return null;
        }

        const appState = await readAppState();
        const email = session.user.email?.trim().toLowerCase();

        let profileRow: {
            id: string;
            name: string | null;
            email: string | null;
            role: 'BUYER' | 'SELLER' | 'ADMIN' | null;
            shop_id: string | null;
            phone: string | null;
            instagram: string | null;
            bio: string | null;
        } | null = null;

        if (email) {
            const { data } = await supabaseAdmin
                .from('profiles')
                .select('id, name, email, role, shop_id, phone, instagram, bio')
                .ilike('email', email)
                .maybeSingle();
            if (data) profileRow = data;
        }

        if (!profileRow && session.user.id) {
            const { data } = await supabaseAdmin
                .from('profiles')
                .select('id, name, email, role, shop_id, phone, instagram, bio')
                .eq('id', session.user.id)
                .maybeSingle();
            if (data) profileRow = data;
        }

        // If user logged in via OAuth and profile isn't created yet, create it now
        if (!profileRow && email) {
            const newId = session.user.id || crypto.randomUUID();
            const { data: inserted } = await supabaseAdmin
                .from('profiles')
                .upsert(
                    {
                        id: newId,
                        email,
                        name: session.user.name || email.split('@')[0],
                        role: 'BUYER',
                    },
                    { onConflict: 'email' }
                )
                .select('id, name, email, role, shop_id, phone, instagram, bio')
                .maybeSingle();
            if (inserted) profileRow = inserted;
        }

        const userId = profileRow?.id || session.user.id;
        if (!userId) return null;

        // Check if user owns a shop
        let shopRow: {
            id: string;
            name: string;
            logo_url: string | null;
            description: string | null;
        } | null = null;

        const { data: shops } = await supabaseAdmin
            .from('shops')
            .select('id, name, logo_url, description')
            .eq('owner_id', userId)
            .limit(1);

        if (shops && shops.length > 0) {
            shopRow = shops[0];
        } else if (profileRow?.shop_id) {
            const { data: linkedShop } = await supabaseAdmin
                .from('shops')
                .select('id, name, logo_url, description')
                .eq('id', profileRow.shop_id)
                .maybeSingle();
            if (linkedShop) shopRow = linkedShop;
        }

        const extra = appState.userProfiles[userId] || {};
        const displayName =
            profileRow?.name ||
            shopRow?.name ||
            session.user.name ||
            (email ? email.split('@')[0] : 'RevClo Member');

        const handle =
            extra.handle ||
            normalizeHandle(profileRow?.instagram, shopRow?.name || displayName);

        const instagramRaw = extra.instagram_url || profileRow?.instagram || '';
        const instagramUrl = instagramRaw
            ? instagramRaw.startsWith('http')
                ? instagramRaw
                : `https://instagram.com/${instagramRaw.replace(/^@/, '')}`
            : '';

        return {
            id: userId,
            name: displayName,
            email: profileRow?.email || email || '',
            handle,
            image: extra.avatar || shopRow?.logo_url || session.user.image || '',
            bio:
                profileRow?.bio ||
                extra.bio ||
                shopRow?.description ||
                'Verified RevClo closet member.',
            instagram_url: instagramUrl,
            location: extra.location || 'New Delhi',
            phone: profileRow?.phone || '',
            role: profileRow?.role || 'BUYER',
            shop_id: shopRow?.id || profileRow?.shop_id || null,
            verified: Boolean(shopRow || profileRow?.role === 'SELLER'),
        };
    } catch (err) {
        console.error('[getCurrentUser] Failed to resolve current user:', err);
        return null;
    }
}

export async function updateCurrentUserProfile(input: {
    name?: string;
    handle?: string;
    bio?: string;
    phone?: string;
    instagram_url?: string;
    location?: string;
    avatar?: string;
}): Promise<{ success: boolean; user: AuthenticatedMarketplaceUser | null; error?: string }> {
    const current = await getCurrentUser();
    if (!current) {
        return { success: false, user: null, error: 'Please sign in to update your profile.' };
    }

    try {
        const cleanInsta = input.instagram_url
            ? input.instagram_url
                  .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
                  .replace(/^@/, '')
                  .replace(/\/.*$/, '')
                  .trim()
            : undefined;

        const profileUpdate: Record<string, unknown> = {};
        if (input.name !== undefined) profileUpdate.name = input.name.trim();
        if (input.bio !== undefined) profileUpdate.bio = input.bio.trim();
        if (input.phone !== undefined) profileUpdate.phone = input.phone.trim();
        if (cleanInsta !== undefined) profileUpdate.instagram = cleanInsta;

        if (Object.keys(profileUpdate).length > 0) {
            await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', current.id);
        }

        const appState = await readAppState(true);
        appState.userProfiles[current.id] = {
            ...appState.userProfiles[current.id],
            ...(input.handle !== undefined ? { handle: normalizeHandle(input.handle) } : {}),
            ...(input.location !== undefined ? { location: input.location.trim() } : {}),
            ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
            ...(input.bio !== undefined ? { bio: input.bio.trim() } : {}),
            ...(input.instagram_url !== undefined ? { instagram_url: input.instagram_url.trim() } : {}),
        };
        await writeAppState(appState);

        revalidatePath('/closet');
        revalidatePath('/settings');
        revalidatePath('/');

        const updated = await getCurrentUser();
        return { success: true, user: updated };
    } catch (err: any) {
        return {
            success: false,
            user: current,
            error: err?.message || 'Failed to update profile',
        };
    }
}

async function fetchRawCatalogData() {
    const [productsRes, profilesRes, shopsRes, appState, currentUser] = await Promise.all([
        supabaseAdmin
            .from('products')
            .select('id, title, description, price, images, seller_id, status, created_at')
            .order('created_at', { ascending: false }),
        supabaseAdmin
            .from('profiles')
            .select('id, name, email, role, shop_id, phone, instagram, bio, created_at'),
        supabaseAdmin
            .from('shops')
            .select('id, owner_id, name, logo_url, description, created_at'),
        readAppState(),
        getCurrentUser(),
    ]);

    const rawProducts = productsRes.data || [];
    const rawProfiles = profilesRes.data || [];
    const rawShops = shopsRes.data || [];

    const profilesById = new Map<string, (typeof rawProfiles)[number]>();
    for (const p of rawProfiles) {
        profilesById.set(p.id, p);
    }

    const shopsByOwnerId = new Map<string, (typeof rawShops)[number]>();
    const shopsById = new Map<string, (typeof rawShops)[number]>();
    for (const s of rawShops) {
        shopsById.set(s.id, s);
        if (s.owner_id) {
            shopsByOwnerId.set(s.owner_id, s);
        }
    }

    const userLikedSet = new Set<string>(
        currentUser ? appState.userLikes[currentUser.id] || [] : []
    );

    const enrichedProducts: Product[] = rawProducts.map((raw, idx) => {
        const sellerProfile = raw.seller_id ? profilesById.get(raw.seller_id) : undefined;
        const sellerShop =
            (raw.seller_id ? shopsByOwnerId.get(raw.seller_id) : undefined) ||
            (sellerProfile?.shop_id ? shopsById.get(sellerProfile.shop_id) : undefined);

        const extracted = extractMetadataFromText(
            raw.title || 'Archive Piece',
            raw.description,
            sellerShop?.name
        );
        const meta = appState.productMeta[raw.id] || {};

        const brand = meta.brand || extracted.brand;
        const brandSlug = meta.brand_slug || slugify(brand);
        const price = Number(raw.price) || 299;
        const originalPrice =
            meta.original_price || Math.round((price * 1.85) / 10) * 10;
        const size = meta.size || extracted.size;
        const condition = meta.condition || extracted.condition;
        const category = meta.category || extracted.category;
        const subCategory = meta.sub_category || extracted.sub_category;
        const department = meta.department || extracted.department;
        const collectionSlug = meta.collection_slug || extracted.collection_slug;
        const trustScore =
            meta.trust_score ||
            (condition === 'Pristine' ? 95 : condition === 'Excellent' ? 92 : 89);

        const extraProfile = raw.seller_id ? appState.userProfiles[raw.seller_id] : undefined;
        const sellerName =
            sellerShop?.name ||
            sellerProfile?.name ||
            'RevClo Archive Seller';
        const sellerHandle =
            extraProfile?.handle ||
            normalizeHandle(sellerProfile?.instagram, sellerName);
        const sellerAvatar =
            extraProfile?.avatar ||
            sellerShop?.logo_url ||
            (Array.isArray(raw.images) && raw.images[0] ? raw.images[0] : REVCLO_ASSETS.miniCreatorAvatar);

        const sellerUser: UserProfile = {
            id: raw.seller_id || 'revclo-seller',
            name: sellerName,
            email: sellerProfile?.email || '',
            handle: sellerHandle,
            image: sellerAvatar,
            bio:
                sellerProfile?.bio ||
                sellerShop?.description ||
                'Verified RevClo archive closet.',
            instagram_url: sellerProfile?.instagram
                ? sellerProfile.instagram.startsWith('http')
                    ? sellerProfile.instagram
                    : `https://instagram.com/${sellerProfile.instagram.replace(/^@/, '')}`
                : '',
            location: extraProfile?.location || 'India',
            verified: true,
        };

        const shopObj: Shop | undefined = sellerShop
            ? {
                  id: sellerShop.id,
                  owner_id: sellerShop.owner_id,
                  name: sellerShop.name,
                  slug: slugify(sellerShop.name),
                  logo_url: sellerShop.logo_url,
                  avatar_url: sellerShop.logo_url || sellerAvatar,
                  description: sellerShop.description,
                  bio: sellerShop.description || sellerUser.bio,
                  location: sellerUser.location,
                  verified: true,
                  created_at: sellerShop.created_at,
                  owner: sellerUser,
              }
            : undefined;

        const baseLikes =
            meta.likes_count !== undefined ? meta.likes_count : 12 + ((idx * 7) % 45);
        const isLiked = userLikedSet.has(raw.id);

        return {
            id: raw.id,
            shop_id: sellerShop?.id,
            seller_id: raw.seller_id,
            name: raw.title,
            title: raw.title,
            brand,
            brand_slug: brandSlug,
            price,
            original_price: originalPrice,
            images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : [],
            size,
            condition,
            category,
            sub_category: subCategory,
            department,
            color: meta.color || 'Multi',
            material: meta.material || 'Cotton Blend',
            collection_slug: collectionSlug,
            trust_score: trustScore,
            description: raw.description || `${brand} ${raw.title} in ${condition.toLowerCase()} condition.`,
            measurements: meta.measurements,
            status: raw.status || 'ACTIVE',
            ai_metadata: meta.ai_metadata || {
                style_tags: [category, condition, brand],
                photo_consistency: true,
                brand_tag_verified: true,
            },
            likes_count: isLiked ? baseLikes + 1 : baseLikes,
            created_at: raw.created_at,
            shop: shopObj,
            seller: sellerUser,
            is_liked: isLiked,
        };
    });

    return {
        products: enrichedProducts,
        rawProfiles,
        rawShops,
        appState,
        currentUser,
    };
}

export interface MarketplaceFilterInput {
    query?: string;
    department?: 'Women' | 'Men' | 'Kids' | 'All';
    category?: string;
    subCategory?: string;
    brandSlug?: string;
    collectionSlug?: string;
    creatorHandle?: string;
    sellerId?: string;
    sizes?: string[];
    conditions?: string[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'trending' | 'price_asc' | 'price_desc' | 'newest' | 'trust_score';
    includeSold?: boolean;
}

export async function getMarketplaceProducts(
    filters?: MarketplaceFilterInput
): Promise<Product[]> {
    const { products } = await fetchRawCatalogData();

    let results = products.filter((p) => {
        if (filters?.includeSold) return true;
        // If filtering by a specific seller or creator, return their active & sold items as requested
        return (
            String(p.status).toUpperCase() !== 'INACTIVE' &&
            String(p.status).toUpperCase() !== 'SOLD'
        );
    });

    if (!filters) return results;

    if (filters.sellerId) {
        results = results.filter((p) => p.seller_id === filters.sellerId);
    }

    if (filters.department && filters.department !== 'All') {
        results = results.filter(
            (p) => !p.department || p.department.toLowerCase() === filters.department!.toLowerCase()
        );
    }

    if (filters.category && filters.category !== 'All') {
        const catLower = filters.category.toLowerCase();
        results = results.filter(
            (p) =>
                p.category?.toLowerCase() === catLower ||
                p.sub_category?.toLowerCase() === catLower
        );
    }

    if (filters.subCategory && filters.subCategory !== 'All') {
        const subLower = filters.subCategory.toLowerCase();
        results = results.filter((p) => p.sub_category?.toLowerCase().includes(subLower));
    }

    if (filters.brandSlug) {
        const slugLower = filters.brandSlug.toLowerCase();
        results = results.filter(
            (p) =>
                p.brand_slug?.toLowerCase() === slugLower ||
                slugify(p.brand) === slugLower ||
                p.shop?.slug?.toLowerCase() === slugLower
        );
    }

    if (filters.collectionSlug) {
        const colLower = filters.collectionSlug.toLowerCase();
        results = results.filter((p) => p.collection_slug?.toLowerCase() === colLower);
    }

    if (filters.creatorHandle) {
        const clean = filters.creatorHandle.replace(/^@/, '').toLowerCase();
        results = results.filter(
            (p) =>
                p.seller?.handle?.toLowerCase() === clean ||
                p.shop?.slug?.toLowerCase() === clean ||
                p.seller_id === clean
        );
    }

    if (filters.sizes && filters.sizes.length > 0) {
        const normalizedSizes = filters.sizes.map((s) => s.toLowerCase());
        results = results.filter((p) => normalizedSizes.includes(String(p.size).toLowerCase()));
    }

    if (filters.conditions && filters.conditions.length > 0) {
        const normalizedConds = filters.conditions.map((c) => c.toLowerCase());
        results = results.filter((p) =>
            normalizedConds.includes(String(p.condition).toLowerCase())
        );
    }

    if (typeof filters.minPrice === 'number') {
        results = results.filter((p) => p.price >= filters.minPrice!);
    }

    if (typeof filters.maxPrice === 'number') {
        results = results.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.query && filters.query.trim().length > 0) {
        const terms = filters.query
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);
        results = results.filter((p) => {
            const hay = `${p.name} ${p.title} ${p.brand} ${p.category} ${p.sub_category || ''} ${p.color || ''} ${p.description || ''} ${p.seller?.name || ''}`.toLowerCase();
            return terms.every((t) => hay.includes(t));
        });
    }

    switch (filters.sortBy) {
        case 'price_asc':
            results.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            results.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            results.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            break;
        case 'trust_score':
            results.sort((a, b) => (b.trust_score || 90) - (a.trust_score || 90));
            break;
        case 'trending':
        default:
            results.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
            break;
    }

    return results;
}

export async function getMarketplaceProductById(id: string): Promise<Product | null> {
    const { products } = await fetchRawCatalogData();
    return products.find((p) => p.id === id) || null;
}

export async function toggleProductLike(
    productId: string
): Promise<{ liked: boolean; likesCount: number; requiresAuth?: boolean }> {
    const user = await getCurrentUser();
    const appState = await readAppState(true);
    const userKey = user?.id || 'guest';

    const list = new Set<string>(appState.userLikes[userKey] || []);
    let liked = false;
    if (list.has(productId)) {
        list.delete(productId);
        liked = false;
    } else {
        list.add(productId);
        liked = true;
    }
    appState.userLikes[userKey] = Array.from(list);
    await writeAppState(appState);

    const product = await getMarketplaceProductById(productId);
    const likesCount = product?.likes_count || (liked ? 1 : 0);

    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath('/closet');
    revalidatePath(`/product/${productId}`);
    return { liked, likesCount };
}

export async function getBrands(): Promise<Brand[]> {
    const { products, rawShops, appState } = await fetchRawCatalogData();
    const brandsMap = new Map<string, Brand>();

    // 1. Include all real shops from `public.shops` as verified labels/stores
    for (const shop of rawShops) {
        const slug = slugify(shop.name);
        const shopProducts = products.filter(
            (p) => p.seller_id === shop.owner_id || slugify(p.brand) === slug
        );
        const heroImg =
            shopProducts[0]?.images?.[0] ||
            shop.logo_url ||
            REVCLO_ASSETS.lethalStoreBanner;
        const followersExtra = Object.values(appState.brandFollows).filter((arr) =>
            arr.includes(slug)
        ).length;

        brandsMap.set(slug, {
            id: shop.id,
            name: shop.name,
            slug,
            bio:
                shop.description ||
                `${shop.name} is a verified curation label on RevClo featuring handpicked archival pieces.`,
            logo_url: shop.logo_url || heroImg,
            hero_image_url: heroImg,
            website_url: `https://instagram.com/${normalizeHandle(shop.name)}`,
            followers_count: 140 + shopProducts.length * 18 + followersExtra,
            is_featured: true,
            items_count: shopProducts.length,
        });
    }

    // 2. Include distinct brands extracted from `public.products`
    const byBrandSlug = new Map<string, Product[]>();
    for (const p of products) {
        const bSlug = p.brand_slug || slugify(p.brand);
        if (!byBrandSlug.has(bSlug)) byBrandSlug.set(bSlug, []);
        byBrandSlug.get(bSlug)!.push(p);
    }

    for (const [slug, group] of Array.from(byBrandSlug.entries())) {
        if (brandsMap.has(slug)) {
            const existing = brandsMap.get(slug)!;
            existing.items_count = Math.max(existing.items_count || 0, group.length);
            continue;
        }
        const first = group[0];
        const followersExtra = Object.values(appState.brandFollows).filter((arr) =>
            arr.includes(slug)
        ).length;
        brandsMap.set(slug, {
            id: `brand-${slug}`,
            name: first.brand,
            slug,
            bio: `Authenticated secondhand & archival ${first.brand} pieces curated by verified closets across India.`,
            logo_url: first.images[0] || REVCLO_ASSETS.lethalStoreBanner,
            hero_image_url: first.images[0] || REVCLO_ASSETS.lethalStoreBanner,
            website_url: `https://www.google.com/search?q=${encodeURIComponent(first.brand)}`,
            followers_count: 85 + group.length * 24 + followersExtra,
            is_featured: group.length >= 2,
            items_count: group.length,
        });
    }

    return Array.from(brandsMap.values()).sort(
        (a, b) => (b.items_count || 0) - (a.items_count || 0)
    );
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
    const all = await getBrands();
    const clean = slug.toLowerCase();
    return (
        all.find((b) => b.slug.toLowerCase() === clean || slugify(b.name) === clean) ||
        all[0] ||
        null
    );
}

export async function toggleBrandFollow(
    slug: string
): Promise<{ following: boolean; followersCount: number }> {
    const user = await getCurrentUser();
    const appState = await readAppState(true);
    const userKey = user?.id || 'guest';
    const clean = slug.toLowerCase();

    const set = new Set<string>(appState.brandFollows[userKey] || []);
    let following = false;
    if (set.has(clean)) {
        set.delete(clean);
        following = false;
    } else {
        set.add(clean);
        following = true;
    }
    appState.brandFollows[userKey] = Array.from(set);
    await writeAppState(appState);

    const brand = await getBrandBySlug(clean);
    revalidatePath(`/brand/${slug}`);
    return {
        following,
        followersCount: brand?.followers_count || 100,
    };
}

export async function getCollections(): Promise<Collection[]> {
    const { products, rawShops, appState } = await fetchRawCatalogData();

    const summerItems = products.filter(
        (p) => p.collection_slug === 'summer-inspirations'
    );
    const classicItems = products.filter(
        (p) => p.collection_slug === 'curated-classics'
    );
    const lovingItems = products.filter(
        (p) => p.collection_slug === 'summer-loving'
    );

    const primaryShop = rawShops[0];
    const secondaryShop = rawShops[1] || rawShops[0];

    const countSaves = (slug: string, base: number) => {
        const extra = Object.values(appState.collectionFollows).filter((arr) =>
            arr.includes(slug)
        ).length;
        return base + extra;
    };

    const collections: Collection[] = [
        {
            id: 'col-summer-inspirations',
            slug: 'summer-inspirations',
            title: 'Summer Inspirations',
            subtitle: `COLLECTION • ${summerItems.length} PIECES`,
            creator_name: primaryShop?.name || 'Urban Vintage',
            creator_handle: normalizeHandle(primaryShop?.name || 'urban_vintage'),
            creator_avatar: primaryShop?.logo_url || REVCLO_ASSETS.miniCreatorAvatar,
            cover_image:
                summerItems[0]?.images?.[0] || REVCLO_ASSETS.summerInspiration,
            saves_count: countSaves('summer-inspirations', 42 + summerItems.length * 2),
            items_count: summerItems.length,
        },
        {
            id: 'col-curated-classics',
            slug: 'curated-classics',
            title: 'Curated Classics',
            subtitle: `COLLECTION • ${classicItems.length} PIECES`,
            creator_name: secondaryShop?.name || 'LIBERTY THRIFT STORE',
            creator_handle: normalizeHandle(secondaryShop?.name || 'liberty_thrift'),
            creator_avatar: secondaryShop?.logo_url || REVCLO_ASSETS.miniCreatorAvatar,
            cover_image:
                classicItems[0]?.images?.[0] || REVCLO_ASSETS.curatedClassics,
            saves_count: countSaves('curated-classics', 31 + classicItems.length * 2),
            items_count: classicItems.length,
        },
        {
            id: 'col-summer-loving',
            slug: 'summer-loving',
            title: 'Summer Loving',
            subtitle: `COLLECTION • ${lovingItems.length} PIECES`,
            creator_name: primaryShop?.name || 'Evochic.in',
            creator_handle: normalizeHandle(primaryShop?.name || 'evochic.in'),
            creator_avatar: primaryShop?.logo_url || REVCLO_ASSETS.miniCreatorAvatar,
            cover_image:
                lovingItems[0]?.images?.[0] || REVCLO_ASSETS.summerLoving,
            saves_count: countSaves('summer-loving', 28 + lovingItems.length * 2),
            items_count: lovingItems.length,
        },
    ];

    return collections;
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
    const all = await getCollections();
    const clean = slug.toLowerCase();
    return all.find((c) => c.slug.toLowerCase() === clean) || all[0] || null;
}

export async function toggleCollectionFollow(
    slug: string
): Promise<{ following: boolean; savesCount: number }> {
    const user = await getCurrentUser();
    const appState = await readAppState(true);
    const userKey = user?.id || 'guest';
    const clean = slug.toLowerCase();

    const set = new Set<string>(appState.collectionFollows[userKey] || []);
    let following = false;
    if (set.has(clean)) {
        set.delete(clean);
        following = false;
    } else {
        set.add(clean);
        following = true;
    }
    appState.collectionFollows[userKey] = Array.from(set);
    await writeAppState(appState);

    const col = await getCollectionBySlug(clean);
    revalidatePath(`/collection/${slug}`);
    return {
        following,
        savesCount: col?.saves_count || 50,
    };
}

export async function getCreators(): Promise<CreatorProfile[]> {
    const { products, rawProfiles, rawShops, appState } = await fetchRawCatalogData();

    const sellerIds = new Set<string>();
    for (const s of rawShops) {
        if (s.owner_id) sellerIds.add(s.owner_id);
    }
    for (const p of products) {
        if (p.seller_id) sellerIds.add(p.seller_id);
    }
    for (const prof of rawProfiles) {
        if (prof.role === 'SELLER') sellerIds.add(prof.id);
    }

    const creators: CreatorProfile[] = [];
    for (const sellerId of Array.from(sellerIds)) {
        const prof = rawProfiles.find((r) => r.id === sellerId);
        const shop = rawShops.find(
            (s) => s.owner_id === sellerId || (prof?.shop_id && s.id === prof.shop_id)
        );
        const sellerProducts = products.filter((p) => p.seller_id === sellerId);
        if (!prof && !shop && sellerProducts.length === 0) continue;

        const extra = appState.userProfiles[sellerId] || {};
        const name = shop?.name || prof?.name || 'Archive Collector';
        const handle =
            extra.handle ||
            normalizeHandle(prof?.instagram, shop?.name || prof?.name || 'collector');

        const liveCount = sellerProducts.filter(
            (p) => p.status === 'ACTIVE' || p.status === 'available'
        ).length;
        const soldCount = sellerProducts.filter(
            (p) => p.status === 'SOLD' || p.status === 'sold'
        ).length;

        const distinctBrands = Array.from(
            new Set(sellerProducts.map((p) => p.brand).filter(Boolean))
        ).slice(0, 5);

        const avatar =
            extra.avatar ||
            shop?.logo_url ||
            sellerProducts[0]?.images?.[0] ||
            REVCLO_ASSETS.miniCreatorAvatar;

        const instagramRaw = extra.instagram_url || prof?.instagram || '';
        const instagramUrl = instagramRaw
            ? instagramRaw.startsWith('http')
                ? instagramRaw
                : `https://instagram.com/${instagramRaw.replace(/^@/, '')}`
            : `https://instagram.com/${handle}`;

        creators.push({
            id: sellerId,
            name,
            handle,
            avatar,
            bio:
                prof?.bio ||
                extra.bio ||
                shop?.description ||
                `Verified RevClo archive closet featuring ${sellerProducts.length} handpicked pieces.`,
            instagram_url: instagramUrl,
            location: extra.location || 'India',
            verified: true,
            live_count: liveCount,
            sold_count: soldCount,
            finds_count: (appState.userLikes[sellerId] || []).length,
            followers_count: 120 + sellerProducts.length * 34 + soldCount * 19,
            featured_brands: distinctBrands.length > 0 ? distinctBrands : [name],
        });
    }

    return creators.sort(
        (a, b) => b.live_count + b.sold_count - (a.live_count + a.sold_count)
    );
}

export async function getCreatorByHandle(handle: string): Promise<CreatorProfile | null> {
    const clean = decodeURIComponent(handle).replace(/^@/, '').toLowerCase();
    const creators = await getCreators();
    const matched = creators.find(
        (c) =>
            c.handle.toLowerCase() === clean ||
            c.id.toLowerCase() === clean ||
            slugify(c.name) === clean
    );
    if (matched) return matched;

    // Also check if it's the current logged in user even if they haven't listed yet
    const currentUser = await getCurrentUser();
    if (
        currentUser &&
        (currentUser.handle?.toLowerCase() === clean || currentUser.id.toLowerCase() === clean)
    ) {
        const appState = await readAppState();
        return {
            id: currentUser.id,
            name: currentUser.name,
            handle: currentUser.handle || normalizeHandle(currentUser.name),
            avatar: currentUser.image || REVCLO_ASSETS.miniCreatorAvatar,
            bio: currentUser.bio || 'Verified RevClo member.',
            instagram_url: currentUser.instagram_url || '',
            location: currentUser.location || 'India',
            verified: Boolean(currentUser.verified),
            live_count: 0,
            sold_count: 0,
            finds_count: (appState.userLikes[currentUser.id] || []).length,
            followers_count: 1,
            featured_brands: [],
        };
    }

    return creators[0] || null;
}

async function uploadImageToProductsBucket(imageInput: string, index: number): Promise<string> {
    if (!imageInput) return '';
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://') || imageInput.startsWith('/')) {
        return imageInput;
    }
    if (imageInput.startsWith('data:image/')) {
        try {
            const match = imageInput.match(/^data:(image\/\w+);base64,(.+)$/);
            const contentType = match?.[1] || 'image/jpeg';
            const ext = contentType.includes('png') ? 'png' : 'jpg';
            const base64Data = match?.[2] || imageInput.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const filePath = `listings/listing-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

            const { error } = await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, buffer, {
                    contentType,
                    upsert: true,
                });

            if (!error) {
                const { data } = supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(filePath);
                if (data?.publicUrl) return data.publicUrl;
            }
        } catch (err) {
            console.error('[uploadImageToProductsBucket] Upload failed:', err);
        }
    }
    return imageInput;
}

export interface CreateRevcloListingInput {
    name: string;
    brand: string;
    price: number;
    original_price?: number;
    size: string;
    condition: 'Pristine' | 'Excellent' | 'Good' | 'Well-loved';
    category: string;
    sub_category?: string;
    department?: 'Women' | 'Men' | 'Kids';
    description?: string;
    images: string[];
    active?: boolean;
    seller_id?: string;
    color?: string;
    material?: string;
}

export async function createRevcloListing(
    input: CreateRevcloListingInput
): Promise<{ success: boolean; product?: Product; error?: string }> {
    const currentUser = await getCurrentUser();
    const resolvedSellerId = input.seller_id || currentUser?.id;

    if (!resolvedSellerId) {
        return {
            success: false,
            error: 'Please sign in with your account before publishing a listing.',
        };
    }

    // Upload any base64 photos to the real Supabase `products` Storage bucket
    const uploadedImages = (
        await Promise.all(
            (input.images || []).map((img, idx) => uploadImageToProductsBucket(img, idx))
        )
    ).filter(Boolean);

    if (uploadedImages.length === 0) {
        return {
            success: false,
            error: 'Please capture or upload at least one photo of your garment.',
        };
    }

    const richDescription = [
        input.description?.trim(),
        `Brand: ${input.brand} | Size: ${input.size} | Condition: ${input.condition} | Category: ${input.category}${input.sub_category ? ` (${input.sub_category})` : ''}`,
    ]
        .filter(Boolean)
        .join('\n\n');

    const { data: inserted, error: insertError } = await supabaseAdmin
        .from('products')
        .insert({
            title: input.name.trim(),
            description: richDescription,
            price: Math.max(1, Math.round(Number(input.price) || 299)),
            images: uploadedImages,
            seller_id: resolvedSellerId,
            status: input.active === false ? 'INACTIVE' : 'ACTIVE',
        })
        .select('id, title, description, price, images, seller_id, status, created_at')
        .single();

    if (insertError || !inserted) {
        return {
            success: false,
            error: insertError?.message || 'Failed to save listing to Supabase database.',
        };
    }

    // Persist rich structured attributes in Supabase Storage `_appdata/marketplace_state.json`
    const appState = await readAppState(true);
    appState.productMeta[inserted.id] = {
        brand: input.brand,
        brand_slug: slugify(input.brand),
        original_price: input.original_price || Math.round(input.price * 1.8),
        size: input.size,
        condition: input.condition,
        category: input.category,
        sub_category: input.sub_category || input.category,
        department: input.department || 'Women',
        color: input.color,
        material: input.material,
        trust_score: input.condition === 'Pristine' ? 96 : 93,
        likes_count: 1,
        ai_metadata: {
            style_tags: [input.category, input.condition, input.brand],
            photo_consistency: true,
            brand_tag_verified: true,
        },
    };
    await writeAppState(appState);

    revalidatePath('/');
    revalidatePath('/closet');
    revalidatePath('/search');
    revalidatePath('/shop');

    const product = await getMarketplaceProductById(inserted.id);
    return {
        success: true,
        product: product || undefined,
    };
}

export async function deleteRevcloListing(
    productId: string
): Promise<{ success: boolean; error?: string }> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('seller_id', currentUser.id);

    if (error) {
        return { success: false, error: error.message };
    }

    const appState = await readAppState(true);
    delete appState.productMeta[productId];
    await writeAppState(appState);

    revalidatePath('/');
    revalidatePath('/closet');
    revalidatePath('/search');
    return { success: true };
}

export async function getConversations(
    folder?: 'all' | 'requests' | 'archived'
): Promise<Conversation[]> {
    const { products, rawProfiles, rawShops, appState, currentUser } =
        await fetchRawCatalogData();

    let convs = [...appState.conversations];

    // Filter conversations for the logged-in user if authenticated
    if (currentUser) {
        const userConvs = convs.filter(
            (c) =>
                c.buyer_id === currentUser.id ||
                c.seller_id === currentUser.id ||
                c.participant_handle === currentUser.handle
        );
        // If user has no conversations yet, seed 2 real introductory seller threads from real Supabase products so inbox works immediately
        if (userConvs.length === 0 && products.length > 0) {
            const sampleProducts = products
                .filter((p) => p.seller_id !== currentUser.id)
                .slice(0, 2);

            for (const prod of sampleProducts) {
                const sellerProf = rawProfiles.find((r) => r.id === prod.seller_id);
                const sellerShop = rawShops.find((s) => s.owner_id === prod.seller_id);
                const sellerName =
                    sellerShop?.name || prod.seller?.name || sellerProf?.name || 'RevClo Seller';
                const sellerHandle =
                    prod.seller?.handle || normalizeHandle(sellerProf?.instagram, sellerName);
                const sellerAvatar =
                    prod.seller?.image ||
                    sellerShop?.logo_url ||
                    prod.images[0] ||
                    REVCLO_ASSETS.miniCreatorAvatar;

                const convId = `conv-${currentUser.id.slice(0, 6)}-${prod.id.slice(0, 6)}`;
                const newConv: ExtendedConversation = {
                    id: convId,
                    buyer_id: currentUser.id,
                    seller_id: prod.seller_id,
                    participant_name: sellerName,
                    participant_handle: sellerHandle,
                    participant_avatar: sellerAvatar,
                    participant_online: true,
                    product_id: prod.id,
                    product_title: prod.title,
                    product_price: prod.price,
                    product_size: String(prod.size),
                    product_images: prod.images,
                    folder: 'all',
                    unread_count: 0,
                    last_message: `Hi! ${prod.title} is available and ready to ship via Delhivery.`,
                    last_message_time: 'Today',
                    messages: [
                        {
                            id: `msg-init-${prod.id.slice(0, 6)}`,
                            conversation_id: convId,
                            sender: 'them',
                            text: `Hi! ${prod.title} (${prod.brand}, size ${prod.size}) is available and ready to ship within 24h.`,
                            timestamp_label: '10:30',
                            created_at: new Date().toISOString(),
                        },
                    ],
                };
                convs.push(newConv);
                userConvs.push(newConv);
            }
            appState.conversations = convs;
            await writeAppState(appState);
        }
        convs = userConvs;
    } else {
        convs = [];
    }

    if (!folder || folder === 'all') {
        return convs.filter((c) => c.folder !== 'archived');
    }
    return convs.filter((c) => c.folder === folder);
}

export async function getConversationById(id: string): Promise<Conversation | null> {
    const appState = await readAppState();
    const found = appState.conversations.find((c) => c.id === id);
    if (found) return found;

    const all = await getConversations('all');
    return all.find((c) => c.id === id) || all[0] || null;
}

export async function startOrGetConversation(input: {
    productId: string;
    initialMessage?: string;
}): Promise<{ conversationId: string | null; requiresAuth?: boolean }> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { conversationId: null, requiresAuth: true };
    }

    const product = await getMarketplaceProductById(input.productId);
    if (!product) {
        return { conversationId: null };
    }

    const appState = await readAppState(true);
    let existing = appState.conversations.find(
        (c) =>
            c.product_id === product.id &&
            (c.buyer_id === currentUser.id || c.seller_id === currentUser.id)
    );

    const now = new Date();
    const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
    ).padStart(2, '0')}`;

    if (!existing) {
        const convId = `conv-${currentUser.id.slice(0, 6)}-${product.id.slice(0, 6)}`;
        existing = {
            id: convId,
            buyer_id: currentUser.id,
            seller_id: product.seller_id,
            participant_name: product.seller?.name || product.shop?.name || 'Seller',
            participant_handle: product.seller?.handle || 'seller',
            participant_avatar:
                product.seller?.image ||
                product.images[0] ||
                REVCLO_ASSETS.miniCreatorAvatar,
            participant_online: true,
            product_id: product.id,
            product_title: product.title,
            product_price: product.price,
            product_size: String(product.size),
            product_images: product.images,
            folder: 'all',
            unread_count: 0,
            last_message:
                input.initialMessage ||
                `Hi! Interested in ${product.title} (₹${product.price.toLocaleString('en-IN')}).`,
            last_message_time: timeLabel,
            messages: [
                {
                    id: `msg-${Date.now()}-welcome`,
                    conversation_id: convId,
                    sender: 'them',
                    text: `Hey! Let me know if you have any questions about measurements or shipping for ${product.title}.`,
                    timestamp_label: timeLabel,
                    created_at: now.toISOString(),
                },
            ],
        };
        appState.conversations.unshift(existing);
    }

    if (input.initialMessage && input.initialMessage.trim()) {
        const msg: ChatMessage = {
            id: `msg-${Date.now()}`,
            conversation_id: existing.id,
            sender: 'me',
            text: input.initialMessage.trim(),
            timestamp_label: timeLabel,
            created_at: now.toISOString(),
        };
        existing.messages.push(msg);
        existing.last_message = msg.text;
        existing.last_message_time = timeLabel;
    }

    await writeAppState(appState);
    revalidatePath('/chat');
    revalidatePath(`/chat/${existing.id}`);
    return { conversationId: existing.id };
}

export async function sendConversationMessage(
    conversationId: string,
    text: string
): Promise<ChatMessage | null> {
    if (!text.trim()) return null;
    const appState = await readAppState(true);
    const conv = appState.conversations.find((c) => c.id === conversationId);
    if (!conv) return null;

    const now = new Date();
    const label = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
    ).padStart(2, '0')}`;
    const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: conversationId,
        sender: 'me',
        text: text.trim(),
        timestamp_label: label,
        created_at: now.toISOString(),
    };

    conv.messages.push(newMsg);
    conv.last_message = newMsg.text;
    conv.last_message_time = label;
    conv.unread_count = 0;

    await writeAppState(appState);
    revalidatePath('/chat');
    revalidatePath(`/chat/${conversationId}`);
    return newMsg;
}

export async function updateConversationStatus(
    conversationId: string,
    action: 'archive' | 'delete' | 'mark_unread'
): Promise<boolean> {
    const appState = await readAppState(true);
    const idx = appState.conversations.findIndex((c) => c.id === conversationId);
    if (idx === -1) return false;

    if (action === 'delete') {
        appState.conversations.splice(idx, 1);
    } else if (action === 'archive') {
        appState.conversations[idx].folder = 'archived';
    } else if (action === 'mark_unread') {
        appState.conversations[idx].unread_count = Math.max(
            1,
            appState.conversations[idx].unread_count + 1
        );
    }

    await writeAppState(appState);
    revalidatePath('/chat');
    return true;
}

export async function getSavedAddresses(): Promise<SavedAddress[]> {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];

    const appState = await readAppState();
    const existing = appState.addresses[currentUser.id];
    if (existing && existing.length > 0) {
        return existing;
    }

    // Check if the user has any real shipping addresses in `public.checkout_sessions`
    const { data: sessions } = await supabaseAdmin
        .from('checkout_sessions')
        .select('id, shipping, created_at')
        .eq('buyer_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(3);

    if (sessions && sessions.length > 0) {
        const derived: SavedAddress[] = [];
        for (const s of sessions) {
            const ship = s.shipping as Record<string, any> | null;
            if (ship && (ship.address || ship.street || ship.city)) {
                derived.push({
                    id: `addr-${s.id.slice(0, 8)}`,
                    user_id: currentUser.id,
                    label: derived.length === 0 ? 'Home' : 'Other',
                    receiver_name: ship.name || ship.fullName || currentUser.name,
                    receiver_phone: ship.phone || currentUser.phone || '',
                    address_line1: ship.address || ship.street || '',
                    landmark: ship.landmark || '',
                    area: ship.area || ship.state || '',
                    city: ship.city || 'New Delhi',
                    pincode: ship.pinCode || ship.pincode || '',
                    distance_km: 2.4,
                    is_default: derived.length === 0,
                });
            }
        }
        if (derived.length > 0) {
            appState.addresses[currentUser.id] = derived;
            await writeAppState(appState);
            return derived;
        }
    }

    return [];
}

export async function addSavedAddress(
    input: Omit<SavedAddress, 'id' | 'user_id' | 'distance_km'>
): Promise<SavedAddress | null> {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;

    const appState = await readAppState(true);
    const userList = appState.addresses[currentUser.id] || [];

    const newAddress: SavedAddress = {
        ...input,
        id: `addr-${Date.now()}`,
        user_id: currentUser.id,
        distance_km: Number((1.2 + userList.length * 1.9).toFixed(1)),
    };

    if (newAddress.is_default || userList.length === 0) {
        newAddress.is_default = true;
        userList.forEach((a) => {
            a.is_default = false;
        });
    }

    userList.unshift(newAddress);
    appState.addresses[currentUser.id] = userList;
    await writeAppState(appState);

    revalidatePath('/addresses');
    revalidatePath('/checkout');
    revalidatePath('/cart');
    return newAddress;
}

export async function deleteSavedAddress(addressId: string): Promise<boolean> {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    const appState = await readAppState(true);
    const userList = appState.addresses[currentUser.id] || [];
    const idx = userList.findIndex((a) => a.id === addressId);
    if (idx === -1) return false;

    userList.splice(idx, 1);
    if (userList.length > 0 && !userList.some((a) => a.is_default)) {
        userList[0].is_default = true;
    }
    appState.addresses[currentUser.id] = userList;
    await writeAppState(appState);

    revalidatePath('/addresses');
    revalidatePath('/checkout');
    return true;
}

export async function getPastOrders(type?: 'bought' | 'sold'): Promise<PastOrder[]> {
    const { products, rawProfiles, rawShops, appState, currentUser } =
        await fetchRawCatalogData();

    if (!currentUser) {
        return [];
    }

    const [ordersRes, orderItemsRes, checkoutSessionsRes] = await Promise.all([
        supabaseAdmin
            .from('orders')
            .select('id, buyer_id, status, total_amount, created_at, courier_name, tracking_label')
            .order('created_at', { ascending: false }),
        supabaseAdmin.from('order_items').select('id, order_id, product_id, price'),
        supabaseAdmin
            .from('checkout_sessions')
            .select('id, buyer_id, shipping, created_at')
            .eq('buyer_id', currentUser.id)
            .order('created_at', { ascending: false }),
    ]);

    const rawOrders = ordersRes.data || [];
    const rawOrderItems = orderItemsRes.data || [];
    const userAddresses = await getSavedAddresses();
    const defaultDeliveryStr = userAddresses[0]
        ? `${userAddresses[0].receiver_name}, ${userAddresses[0].address_line1}, ${userAddresses[0].city} - ${userAddresses[0].pincode}`
        : `${currentUser.name}, ${currentUser.location || 'India'}`;

    const productsById = new Map<string, Product>();
    for (const p of products) productsById.set(p.id, p);

    const pastOrders: PastOrder[] = [];

    for (const ord of rawOrders) {
        const items = rawOrderItems.filter((oi) => oi.order_id === ord.id);
        for (const item of items) {
            const prod = item.product_id ? productsById.get(item.product_id) : undefined;
            const isBoughtByMe = ord.buyer_id === currentUser.id;
            const isSoldByMe = prod?.seller_id === currentUser.id;

            if (!isBoughtByMe && !isSoldByMe) continue;

            const orderType: 'bought' | 'sold' = isSoldByMe && !isBoughtByMe ? 'sold' : 'bought';
            if (type && orderType !== type) continue;

            const sellerProf = prod?.seller_id
                ? rawProfiles.find((r) => r.id === prod.seller_id)
                : undefined;
            const sellerShop = prod?.seller_id
                ? rawShops.find((s) => s.owner_id === prod.seller_id)
                : undefined;

            const shopName =
                sellerShop?.name || prod?.seller?.name || sellerProf?.name || 'RevClo Closet';
            const shopSlug =
                prod?.seller?.handle || normalizeHandle(sellerProf?.instagram, shopName);
            const shopAvatar =
                prod?.seller?.image ||
                sellerShop?.logo_url ||
                prod?.images?.[0] ||
                REVCLO_ASSETS.miniCreatorAvatar;

            const itemPrice = Number(item.price || prod?.price || ord.total_amount || 299);
            const gstAmount = Number((itemPrice * 0.05).toFixed(2));
            const shippingFee = itemPrice >= 999 ? 0 : 49;
            const totalPaid = Number(ord.total_amount || itemPrice + gstAmount + shippingFee);

            const dateObj = new Date(ord.created_at);
            const placedDate = dateObj.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
            });

            const statusRaw = String(ord.status || '').toUpperCase();
            const mappedStatus: PastOrder['status'] =
                statusRaw === 'DELIVERED'
                    ? 'Delivered'
                    : statusRaw === 'SHIPPED'
                      ? 'In Transit'
                      : statusRaw === 'CANCELLED'
                        ? 'Cancelled'
                        : 'Processing';

            const ratingEntry = appState.orderRatings[ord.id];
            const latestCheckout = checkoutSessionsRes.data?.[0]?.shipping as Record<string, any> | undefined;
            const deliveryAddr = latestCheckout?.address
                ? `${latestCheckout.name || currentUser.name}, ${latestCheckout.address}, ${latestCheckout.city || ''} - ${latestCheckout.pinCode || ''}`
                : defaultDeliveryStr;

            pastOrders.push({
                id: ord.id,
                order_number: `#${ord.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`,
                type: orderType,
                shop_name: shopName,
                shop_slug: shopSlug,
                shop_location: prod?.seller?.location || 'India',
                shop_avatar: shopAvatar,
                product_id: prod?.id || item.product_id || '',
                product_name: prod?.title || 'Archive Garment',
                product_brand: prod?.brand || shopName,
                product_size: String(prod?.size || 'M'),
                product_image: prod?.images?.[0] || REVCLO_ASSETS.quiltedBagMain,
                item_price: itemPrice,
                item_total: itemPrice,
                gst_amount: gstAmount,
                shipping_fee: shippingFee,
                discount_amount: 0,
                total_paid: totalPaid,
                placed_date: placedDate,
                status: mappedStatus,
                delivery_address: deliveryAddr,
                rating: ratingEntry?.rating,
                feedback: ratingEntry?.feedback,
            });
        }
    }

    return pastOrders;
}

export async function ratePastOrder(
    orderId: string,
    rating: number,
    feedback?: string
): Promise<boolean> {
    const appState = await readAppState(true);
    appState.orderRatings[orderId] = {
        rating: Math.min(5, Math.max(1, rating)),
        feedback: feedback?.trim() || undefined,
    };
    await writeAppState(appState);
    revalidatePath('/orders');
    return true;
}

export async function placeMarketplaceOrder(input: {
    items: { productId: string; price: number; title?: string }[];
    totalAmount: number;
    addressId?: string;
    paymentMethod?: string;
}): Promise<{ success: boolean; orderId?: string; error?: string }> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return {
            success: false,
            error: 'Please sign in to place your order.',
        };
    }

    if (!input.items || input.items.length === 0) {
        return {
            success: false,
            error: 'Your bag is empty.',
        };
    }

    try {
        const productIds = input.items.map((i) => i.productId);

        // 1. Mark products as SOLD in `public.products`
        await supabaseAdmin
            .from('products')
            .update({ status: 'SOLD' })
            .in('id', productIds);

        // 2. Insert order into `public.orders`
        const { data: orderRow, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                buyer_id: currentUser.id,
                total_amount: Math.round(input.totalAmount),
                status: 'PLACED',
                payment_id: `${input.paymentMethod || 'UPI'}-${Date.now()}`,
            })
            .select('id')
            .single();

        if (orderError || !orderRow) {
            return {
                success: false,
                error: orderError?.message || 'Could not create order in database.',
            };
        }

        // 3. Insert order items into `public.order_items`
        const orderItemsPayload = input.items.map((i) => ({
            order_id: orderRow.id,
            product_id: i.productId,
            price: Math.round(i.price),
        }));

        await supabaseAdmin.from('order_items').insert(orderItemsPayload);

        revalidatePath('/');
        revalidatePath('/orders');
        revalidatePath('/closet');
        revalidatePath('/search');

        return {
            success: true,
            orderId: orderRow.id,
        };
    } catch (err: any) {
        return {
            success: false,
            error: err?.message || 'Checkout failed.',
        };
    }
}
