export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';
export type ProductStatus = 'ACTIVE' | 'SOLD' | 'BLOCKED';
export type OrderStatus = 'PLACED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

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
    created_at: string;
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
