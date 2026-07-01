export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';
export type ProductStatus = 'ACTIVE' | 'SOLD' | 'BLOCKED' | 'EXCHANGED';
export type OrderStatus = 'PLACED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type SwipeDirection = 'LEFT' | 'RIGHT';
export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Free Size';
export type ClothingCategory = 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear' | 'Shoes' | 'Accessories';
export type ClothingCondition = 'New with Tags' | 'Like New' | 'Good' | 'Fair';

export interface Shop {
    id: string;
    owner_id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    created_at: string;
}

export interface Profile {
    id: string;
    name: string | null;
    email: string | null;
    role: UserRole;
    shop_id: string | null;
    created_at: string;
}

export interface Product {
    id: string;
    title: string;
    description: string | null;
    price: number;
    images: string[];
    seller_id: string;
    status: ProductStatus;
    size: ClothingSize;
    category: ClothingCategory;
    condition: ClothingCondition;
    brand: string;
    available_for_exchange: boolean;
    created_at: string;
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
    // Joined data for display
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
    status: OrderStatus;
    total_amount: number;
    created_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null;
    price: number;
}
