'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
    DEFAULT_DEMO_USER,
    SEED_ADDRESSES,
    SEED_BRANDS,
    SEED_COLLECTIONS,
    SEED_CONVERSATIONS,
    SEED_CREATORS,
    SEED_PAST_ORDERS,
    SEED_PRODUCTS,
} from '@/lib/revcloSeedData';
import {
    Brand,
    ChatMessage,
    Collection,
    Conversation,
    CreatorProfile,
    MarketplaceFilterState,
    PastOrder,
    Product,
    SavedAddress,
} from '@/types';
import { revalidatePath } from 'next/cache';

// In-memory runtime overlay so user actions (new listings, chat messages, new addresses, ratings, likes)
// persist across server action calls even if Supabase env vars or tables are not yet migrated.
const runtimeStore = {
    addedProducts: [] as Product[],
    likedIds: new Set<string>(['prod-diesel-bag-2', 'prod-lethal-jacket-5']),
    conversations: structuredClone(SEED_CONVERSATIONS) as Conversation[],
    addresses: structuredClone(SEED_ADDRESSES) as SavedAddress[],
    orders: structuredClone(SEED_PAST_ORDERS) as PastOrder[],
    followedCollections: new Set<string>(['summer-inspirations']),
    followedBrands: new Set<string>(['diesel']),
};

function mergeProductsWithSeed(dbProducts: Product[] | null | undefined): Product[] {
    const combinedMap = new Map<string, Product>();

    for (const p of runtimeStore.addedProducts) {
        combinedMap.set(p.id, {
            ...p,
            name: p.name || p.title || 'Archive Piece',
            title: p.title || p.name || 'Archive Piece',
            is_liked: runtimeStore.likedIds.has(p.id),
        });
    }

    if (dbProducts && dbProducts.length > 0) {
        for (const p of dbProducts) {
            const validImages = (p.images || []).filter(
                (img) => img && (img.startsWith('/') || img.startsWith('data:') || img.startsWith('http'))
            );
            const resolvedName = p.name || p.title || 'Archive Piece';
            combinedMap.set(p.id, {
                ...p,
                name: resolvedName,
                title: p.title || resolvedName,
                images: validImages.length > 0 ? validImages : ['/figma/14bdb6af-eb9e-4d33-ba53-2b0e83cb8918.png'],
                trust_score: p.trust_score || 92,
                department: p.department || 'Women',
                is_liked: runtimeStore.likedIds.has(p.id),
            });
        }
    }

    for (const seed of SEED_PRODUCTS) {
        if (!combinedMap.has(seed.id)) {
            combinedMap.set(seed.id, {
                ...seed,
                title: seed.title || seed.name,
                is_liked: runtimeStore.likedIds.has(seed.id),
            });
        }
    }

    return Array.from(combinedMap.values());
}

export async function getMarketplaceProducts(filters?: MarketplaceFilterState): Promise<Product[]> {
    let dbRows: Product[] = [];
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*, shop:shops(*), seller:users(*)')
            .order('created_at', { ascending: false })
            .limit(60);

        if (!error && data) {
            dbRows = data as Product[];
        }
    } catch {
        // Fallback silently to seed + runtime store
    }

    let items = mergeProductsWithSeed(dbRows).filter((p) => p.status !== 'inactive');

    if (!filters) return items;

    if (filters.department && filters.department !== 'All') {
        items = items.filter(
            (p) => !p.department || p.department.toLowerCase() === filters.department!.toLowerCase()
        );
    }

    if (filters.category && filters.category !== 'All') {
        const cat = filters.category.toLowerCase();
        items = items.filter(
            (p) =>
                p.category.toLowerCase().includes(cat) ||
                (p.sub_category && p.sub_category.toLowerCase().includes(cat))
        );
    }

    if (filters.sub_category) {
        const sub = filters.sub_category.toLowerCase();
        items = items.filter(
            (p) =>
                (p.sub_category && p.sub_category.toLowerCase().includes(sub)) ||
                p.category.toLowerCase().includes(sub)
        );
    }

    if (filters.brands && filters.brands.length > 0) {
        const brandSet = new Set(filters.brands.map((b) => b.toLowerCase()));
        items = items.filter(
            (p) =>
                brandSet.has(p.brand.toLowerCase()) ||
                (p.brand_slug && brandSet.has(p.brand_slug.toLowerCase()))
        );
    }

    if (filters.sizes && filters.sizes.length > 0) {
        const sizeSet = new Set(filters.sizes.map((s) => s.toLowerCase()));
        items = items.filter((p) => sizeSet.has(p.size.toLowerCase()));
    }

    if (filters.colors && filters.colors.length > 0) {
        const colorSet = new Set(filters.colors.map((c) => c.toLowerCase()));
        items = items.filter((p) => p.color && colorSet.has(p.color.toLowerCase()));
    }

    if (filters.materials && filters.materials.length > 0) {
        const matSet = new Set(filters.materials.map((m) => m.toLowerCase()));
        items = items.filter((p) => p.material && matSet.has(p.material.toLowerCase()));
    }

    if (typeof filters.minPrice === 'number') {
        items = items.filter((p) => p.price >= filters.minPrice!);
    }

    if (typeof filters.maxPrice === 'number' && filters.maxPrice > 0) {
        items = items.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.query && filters.query.trim()) {
        const q = filters.query.trim().toLowerCase();
        items = items.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.brand.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.sub_category && p.sub_category.toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q))
        );
    }

    switch (filters.sortBy) {
        case 'price_asc':
            items.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            items.sort((a, b) => b.price - a.price);
            break;
        case 'trust_score':
            items.sort((a, b) => (b.trust_score || 92) - (a.trust_score || 92));
            break;
        case 'newest':
            items.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            break;
        case 'trending':
        default:
            items.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
            break;
    }

    return items;
}

export async function getMarketplaceProductById(id: string): Promise<Product | null> {
    const all = await getMarketplaceProducts();
    const found = all.find((p) => p.id === id);
    if (found) return found;

    try {
        const { data } = await supabaseAdmin
            .from('products')
            .select('*, shop:shops(*), seller:users(*)')
            .eq('id', id)
            .single();
        if (data) return data as Product;
    } catch {
        // ignore
    }

    return all[0] || null;
}

export async function toggleProductLike(productId: string): Promise<{ liked: boolean; likes_count: number }> {
    const isCurrentlyLiked = runtimeStore.likedIds.has(productId);
    if (isCurrentlyLiked) {
        runtimeStore.likedIds.delete(productId);
    } else {
        runtimeStore.likedIds.add(productId);
    }

    const all = await getMarketplaceProducts();
    const target = all.find((p) => p.id === productId);
    const baseLikes = target?.likes_count || 42;
    const nextLikes = isCurrentlyLiked ? Math.max(0, baseLikes - 1) : baseLikes + 1;

    try {
        await supabaseAdmin
            .from('products')
            .update({ likes_count: nextLikes })
            .eq('id', productId);
    } catch {
        // ignore
    }

    return { liked: !isCurrentlyLiked, likes_count: nextLikes };
}

export async function createRevcloListing(input: {
    name: string;
    brand: string;
    price: number;
    size: string;
    condition: 'Pristine' | 'Excellent' | 'Good' | 'Well-loved';
    category: string;
    sub_category?: string;
    department?: 'Women' | 'Men' | 'Kids';
    description?: string;
    images: string[];
    active?: boolean;
    seller_id?: string;
}): Promise<{ success: boolean; product: Product }> {
    const sellerId = input.seller_id || DEFAULT_DEMO_USER.id;
    const brandSlug = input.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newProduct: Product = {
        id: `prod-${Date.now()}`,
        seller_id: sellerId,
        name: input.name || 'Quilted Archive Piece',
        title: input.name || 'Quilted Archive Piece',
        brand: input.brand || 'QUILTED',
        brand_slug: brandSlug,
        price: Number(input.price) || 450,
        original_price: Math.round((Number(input.price) || 450) * 1.8),
        images:
            input.images && input.images.length > 0
                ? input.images
                : ['/figma/1d5e9b8b-39ab-467d-a10d-68b083d67d8e.png'],
        size: input.size || 'M',
        condition: input.condition || 'Pristine',
        category: input.category || 'Accessories',
        sub_category: input.sub_category || 'Handbags',
        department: input.department || 'Women',
        color: 'Cream',
        material: 'Leather',
        trust_score: input.condition === 'Pristine' ? 96 : input.condition === 'Excellent' ? 92 : 88,
        description:
            input.description ||
            'Verified closet listing uploaded via RevClo AI Scanner. Ready to ship within 24 hours.',
        status: input.active === false ? 'inactive' : 'available',
        ai_metadata: {
            style_tags: [input.category, input.condition, 'Verified Closet'],
            photo_consistency: true,
            brand_tag_verified: true,
        },
        likes_count: 1,
        created_at: new Date().toISOString(),
        is_liked: false,
    };

    runtimeStore.addedProducts.unshift(newProduct);

    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                seller_id: sellerId,
                name: newProduct.name,
                brand: newProduct.brand,
                brand_slug: newProduct.brand_slug,
                price: newProduct.price,
                original_price: newProduct.original_price,
                images: newProduct.images,
                size: newProduct.size,
                condition: newProduct.condition,
                category: newProduct.category,
                sub_category: newProduct.sub_category,
                department: newProduct.department,
                trust_score: newProduct.trust_score,
                description: newProduct.description,
                status: newProduct.status,
                ai_metadata: newProduct.ai_metadata,
            })
            .select()
            .single();

        if (!error && data) {
            newProduct.id = data.id;
        }
    } catch {
        // Keep in runtimeStore
    }

    revalidatePath('/');
    revalidatePath('/closet');
    revalidatePath('/search');
    return { success: true, product: newProduct };
}

export async function getBrandBySlug(slug: string): Promise<{ brand: Brand; products: Product[]; isFollowed: boolean }> {
    const normalized = slug.toLowerCase();
    const brand =
        SEED_BRANDS.find((b) => b.slug.toLowerCase() === normalized || b.name.toLowerCase() === normalized) || {
            id: `brand-${normalized}`,
            name: slug.charAt(0).toUpperCase() + slug.slice(1),
            slug: normalized,
            bio: `${slug.toUpperCase()} is an iconic fashion label curated by verified sellers across RevClo.`,
            logo_url: '/figma/8f8af114-71d6-4ca1-b034-ca5f309d72e6.png',
            hero_image_url: '/figma/8f8af114-71d6-4ca1-b034-ca5f309d72e6.png',
            website_url: 'https://diesel.com',
            followers_count: 4200,
            is_featured: true,
        };

    const allProducts = await getMarketplaceProducts();
    const matching = allProducts.filter(
        (p) =>
            p.brand.toLowerCase() === brand.name.toLowerCase() ||
            (p.brand_slug && p.brand_slug.toLowerCase() === normalized)
    );

    return {
        brand,
        products: matching.length > 0 ? matching : allProducts,
        isFollowed: runtimeStore.followedBrands.has(brand.slug),
    };
}

export async function getCollectionBySlug(slug: string): Promise<{
    collection: Collection;
    products: Product[];
    isFollowed: boolean;
}> {
    const normalized = slug.toLowerCase();
    const collection =
        SEED_COLLECTIONS.find((c) => c.slug.toLowerCase() === normalized) || SEED_COLLECTIONS[0];

    const allProducts = await getMarketplaceProducts();
    const matching = allProducts.filter((p) => p.collection_slug === collection.slug);

    return {
        collection,
        products: matching.length >= 4 ? matching : allProducts,
        isFollowed: runtimeStore.followedCollections.has(collection.slug),
    };
}

export async function getCreatorByHandle(handle: string): Promise<{
    creator: CreatorProfile;
    products: Product[];
    brands: Brand[];
}> {
    const clean = decodeURIComponent(handle).replace(/^@/, '').toLowerCase();
    const creator =
        SEED_CREATORS.find(
            (c) => c.handle.toLowerCase() === clean || c.id.toLowerCase() === clean
        ) || SEED_CREATORS[1]; // Default to Jenny Kayne @jenny._

    const allProducts = await getMarketplaceProducts();
    const sellerItems = allProducts.filter((p) => p.seller_id === creator.id);

    return {
        creator,
        products: sellerItems.length >= 4 ? sellerItems : allProducts,
        brands: SEED_BRANDS,
    };
}

export async function getConversations(): Promise<Conversation[]> {
    return runtimeStore.conversations;
}

export async function getConversationById(id: string): Promise<Conversation> {
    const found = runtimeStore.conversations.find((c) => c.id === id);
    return found || runtimeStore.conversations[0];
}

export async function sendConversationMessage(
    conversationId: string,
    text: string
): Promise<{ success: boolean; message: ChatMessage; autoReply?: ChatMessage }> {
    const conv =
        runtimeStore.conversations.find((c) => c.id === conversationId) ||
        runtimeStore.conversations[0];

    const now = new Date();
    const timeLabel = now.toTimeString().slice(0, 5);

    const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: conv.id,
        sender: 'me',
        text: text.trim(),
        timestamp_label: timeLabel,
        created_at: now.toISOString(),
    };

    conv.messages.push(newMsg);
    conv.last_message = newMsg.text;
    conv.last_message_time = timeLabel;
    conv.unread_count = 0;

    try {
        await supabaseAdmin.from('messages').insert({
            conversation_id: conv.id,
            sender: 'me',
            text: newMsg.text,
            timestamp_label: timeLabel,
        });
    } catch {
        // ignore
    }

    revalidatePath('/chat');
    revalidatePath(`/chat/${conv.id}`);
    return { success: true, message: newMsg };
}

export async function updateConversationStatus(
    conversationId: string,
    action: 'mark_unread' | 'archive' | 'unarchive' | 'delete'
): Promise<Conversation[]> {
    if (action === 'delete') {
        runtimeStore.conversations = runtimeStore.conversations.filter(
            (c) => c.id !== conversationId
        );
    } else {
        const conv = runtimeStore.conversations.find((c) => c.id === conversationId);
        if (conv) {
            if (action === 'mark_unread') conv.unread_count = Math.max(1, conv.unread_count + 1);
            if (action === 'archive') conv.folder = 'archived';
            if (action === 'unarchive') conv.folder = 'all';
        }
    }
    revalidatePath('/chat');
    return runtimeStore.conversations;
}

export async function getSavedAddresses(): Promise<SavedAddress[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('addresses')
            .select('*')
            .order('is_default', { ascending: false });

        if (!error && data && data.length > 0) {
            return data as SavedAddress[];
        }
    } catch {
        // Fallback to runtimeStore
    }
    return runtimeStore.addresses;
}

export async function addSavedAddress(input: {
    label: 'Home' | 'Studio / Work' | 'Friends & Family' | 'Other';
    receiver_name: string;
    receiver_phone: string;
    address_line1: string;
    address_line2?: string;
    landmark?: string;
    area: string;
    city?: string;
    pincode?: string;
}): Promise<SavedAddress[]> {
    const newAddr: SavedAddress = {
        id: `addr-${Date.now()}`,
        user_id: DEFAULT_DEMO_USER.id,
        label: input.label || 'Home',
        receiver_name: input.receiver_name || 'Ishan',
        receiver_phone: input.receiver_phone || '+91 98112 45890',
        address_line1: input.address_line1,
        address_line2: input.address_line2,
        landmark: input.landmark,
        area: input.area || 'Lajpat Nagar',
        city: input.city || 'New Delhi',
        pincode: input.pincode || '110024',
        distance_km: input.area?.toLowerCase().includes('lajpat') ? 14.0 : 2.4,
        is_default: runtimeStore.addresses.length === 0,
    };

    runtimeStore.addresses.unshift(newAddr);

    try {
        await supabaseAdmin.from('addresses').insert({
            user_id: newAddr.user_id,
            label: newAddr.label,
            receiver_name: newAddr.receiver_name,
            receiver_phone: newAddr.receiver_phone,
            address_line1: newAddr.address_line1,
            address_line2: newAddr.address_line2,
            landmark: newAddr.landmark,
            area: newAddr.area,
            city: newAddr.city,
            pincode: newAddr.pincode,
            distance_km: newAddr.distance_km,
            is_default: newAddr.is_default,
        });
    } catch {
        // ignore
    }

    revalidatePath('/addresses');
    revalidatePath('/checkout');
    return runtimeStore.addresses;
}

export async function deleteSavedAddress(id: string): Promise<SavedAddress[]> {
    runtimeStore.addresses = runtimeStore.addresses.filter((a) => a.id !== id);
    try {
        await supabaseAdmin.from('addresses').delete().eq('id', id);
    } catch {
        // ignore
    }
    revalidatePath('/addresses');
    return runtimeStore.addresses;
}

export async function getPastOrders(): Promise<PastOrder[]> {
    return runtimeStore.orders;
}

export async function ratePastOrder(
    orderId: string,
    rating: number,
    feedback?: string
): Promise<PastOrder[]> {
    const order = runtimeStore.orders.find((o) => o.id === orderId);
    if (order) {
        order.rating = rating;
        if (feedback !== undefined) order.feedback = feedback;
    }

    try {
        await supabaseAdmin
            .from('orders')
            .update({ rating, feedback })
            .eq('id', orderId);
    } catch {
        // ignore
    }

    revalidatePath('/orders');
    return runtimeStore.orders;
}

export async function removeOrderFromHistory(orderId: string): Promise<PastOrder[]> {
    runtimeStore.orders = runtimeStore.orders.filter((o) => o.id !== orderId);
    revalidatePath('/orders');
    return runtimeStore.orders;
}
