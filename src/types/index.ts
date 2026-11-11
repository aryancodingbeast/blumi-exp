export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';
export type ProductStatus =
    | 'ACTIVE'
    | 'SOLD'
    | 'INACTIVE'
    | 'BLOCKED'
    | 'EXCHANGED'
    | 'available'
    | 'sold'
    | 'reserved'
    | 'inactive';
export type OrderStatus =
    | 'PLACED'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'pending'
    | 'paid'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
export type SwipeDirection = 'LEFT' | 'RIGHT';
export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Free Size' | string;
export type ClothingCategory =
    | 'Tops'
    | 'Bottoms'
    | 'Dresses'
    | 'Outerwear'
    | 'Shoes'
    | 'Accessories'
    | 'Jewellery'
    | 'Footwear'
    | string;
export type ProductCondition =
    | 'Pristine'
    | 'Excellent'
    | 'Good'
    | 'Well-loved'
    | 'New with tags'
    | 'New with Tags'
    | 'Like New'
    | 'Fair';
export type ClothingCondition = ProductCondition;

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    image?: string;
    handle?: string;
    bio?: string;
    instagram_url?: string;
    location?: string;
    verified?: boolean;
}

export interface Profile {
    id: string;
    name: string | null;
    email: string | null;
    role: UserRole;
    shop_id: string | null;
    created_at: string;
}

export interface Shop {
    id: string;
    owner_id: string;
    name: string;
    slug?: string;
    logo_url?: string | null;
    description?: string | null;
    bio?: string;
    avatar_url?: string;
    banner_url?: string;
    location?: string;
    rating?: number;
    verified?: boolean;
    created_at: string;
    owner?: UserProfile;
    items_count?: number;
}

export interface Product {
    id: string;
    shop_id?: string;
    seller_id: string;
    name: string;
    title: string;
    brand: string;
    brand_slug?: string;
    price: number;
    original_price?: number;
    images: string[];
    size: ClothingSize;
    condition: ProductCondition;
    category: ClothingCategory;
    sub_category?: string;
    department?: 'Women' | 'Men' | 'Kids';
    color?: string;
    material?: string;
    collection_slug?: string;
    trust_score?: number;
    description: string | null;
    available_for_exchange?: boolean;
    measurements?: {
        chest?: string;
        length?: string;
        waist?: string;
        shoulders?: string;
        hips?: string;
        inseam?: string;
    };
    status: ProductStatus;
    ai_metadata?: {
        style_tags?: string[];
        color_palette?: string[];
        vibe?: string;
        fabric_guess?: string;
        authenticity_notes?: string;
        photo_consistency?: boolean;
        brand_tag_verified?: boolean;
    };
    likes_count?: number;
    created_at: string;
    shop?: Shop;
    seller?: UserProfile;
    is_liked?: boolean;
}

export interface Swipe {
    id: string;
    swiper_id: string;
    swiped_product_id: string;
    offered_product_id: string;
    direction: SwipeDirection;
    created_at: string;
}

export interface Match {
    id: string;
    user_a_id: string;
    user_b_id: string;
    product_a_id: string;
    product_b_id: string;
    status: MatchStatus;
    user_a_confirmed: boolean;
    user_b_confirmed: boolean;
    created_at: string;
    product_a?: Product;
    product_b?: Product;
    user_a?: Profile;
    user_b?: Profile;
}

export interface LikedItem {
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
    product?: Product;
}

export interface Order {
    id: string;
    buyer_id: string;
    seller_id?: string;
    product_id?: string;
    amount?: number;
    total_amount: number;
    status: OrderStatus;
    shipping_address?: {
        fullName: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
    };
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    created_at: string;
    product?: Product;
    buyer?: UserProfile;
    seller?: UserProfile;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null;
    price: number;
}

export interface Brand {
    id: string;
    name: string;
    slug: string;
    bio: string;
    logo_url: string;
    hero_image_url: string;
    website_url: string;
    followers_count: number;
    is_featured: boolean;
    items_count?: number;
}

export interface Collection {
    id: string;
    slug: string;
    title: string;
    subtitle?: string;
    creator_name: string;
    creator_handle: string;
    creator_avatar: string;
    cover_image: string;
    saves_count: number;
    items_count: number;
}

export interface CreatorProfile {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    bio: string;
    instagram_url: string;
    location: string;
    verified: boolean;
    live_count: number;
    sold_count: number;
    finds_count: number;
    followers_count: number;
    featured_brands: string[];
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender: 'me' | 'them';
    text: string;
    timestamp_label: string;
    created_at: string;
}

export interface Conversation {
    id: string;
    participant_name: string;
    participant_handle: string;
    participant_avatar: string;
    participant_online: boolean;
    product_id: string;
    product_title: string;
    product_price: number;
    product_size: string;
    product_images: string[];
    folder: 'all' | 'requests' | 'archived';
    unread_count: number;
    last_message: string;
    last_message_time: string;
    messages: ChatMessage[];
}

export interface SavedAddress {
    id: string;
    user_id: string;
    label: 'Home' | 'Studio / Work' | 'Friends & Family' | 'Other';
    receiver_name: string;
    receiver_phone: string;
    address_line1: string;
    address_line2?: string;
    landmark?: string;
    area: string;
    city: string;
    pincode: string;
    distance_km: number;
    is_default: boolean;
}

export interface PastOrder {
    id: string;
    order_number: string;
    type: 'bought' | 'sold';
    shop_name: string;
    shop_slug: string;
    shop_location: string;
    shop_avatar: string;
    product_id: string;
    product_name: string;
    product_brand: string;
    product_size: string;
    product_image: string;
    item_price: number;
    item_total: number;
    gst_amount: number;
    shipping_fee: number;
    discount_amount: number;
    total_paid: number;
    placed_date: string;
    status: 'Delivered' | 'In Transit' | 'Processing' | 'Cancelled';
    delivery_address: string;
    rating: number;
    feedback?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface MarketplaceFilterState {
    query?: string;
    department?: 'Women' | 'Men' | 'Kids' | 'All';
    category?: string;
    sub_category?: string;
    brands?: string[];
    sizes?: string[];
    priceRanges?: string[];
    minPrice?: number;
    maxPrice?: number;
    colors?: string[];
    materials?: string[];
    conditions?: string[];
    sortBy?: 'trending' | 'price_asc' | 'price_desc' | 'newest' | 'trust_score';
}
