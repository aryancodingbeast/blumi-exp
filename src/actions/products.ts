'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { auth } from '@/lib/auth';
import { Product } from '@/types';
import { revalidatePath } from 'next/cache';
import {
    createRevcloListing,
    getCurrentUser,
    getMarketplaceProductById,
    getMarketplaceProducts,
} from '@/actions/marketplace';

export async function getProducts(filters?: {
    category?: string;
    size?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    search?: string;
    shopId?: string;
    sellerId?: string;
    department?: 'Women' | 'Men' | 'Kids' | 'All';
    sortBy?: 'trending' | 'price_asc' | 'price_desc' | 'newest' | 'trust_score';
}) {
    const products = await getMarketplaceProducts({
        category: filters?.category,
        sizes: filters?.size && filters.size !== 'All' ? [filters.size] : undefined,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        conditions: filters?.condition ? [filters.condition] : undefined,
        query: filters?.search,
        department: filters?.department,
        sortBy: filters?.sortBy,
    });

    if (filters?.sellerId) {
        const bySeller = products.filter((p) => p.seller_id === filters.sellerId);
        return bySeller.length > 0 ? bySeller : products;
    }

    return products;
}

export async function searchProducts(query: string) {
    if (!query || query.length < 2) return [];
    return getMarketplaceProducts({ query });
}

export async function getProductById(id: string) {
    return getMarketplaceProductById(id);
}

export async function createProduct(
    productData:
        | FormData
        | {
              name?: string;
              title?: string;
              brand?: string;
              price: number;
              original_price?: number;
              images: string[];
              size?: string;
              condition?: string;
              category?: string;
              sub_category?: string;
              department?: 'Women' | 'Men' | 'Kids';
              description?: string;
              measurements?: Record<string, string>;
              ai_metadata?: Record<string, unknown>;
              shop_id?: string;
          }
): Promise<{ success: boolean; data?: Product; product?: Product; error?: string }> {
    const currentUser = await getCurrentUser();
    const sellerId = currentUser?.id;

    const parsed =
        productData instanceof FormData
            ? {
                  name: (productData.get('title') as string) || 'Archive Piece',
                  brand: (productData.get('brand') as string) || 'QUILTED',
                  price: Number(productData.get('price')) || 450,
                  size: (productData.get('size') as string) || 'M',
                  condition: (productData.get('condition') as string) || 'Pristine',
                  category: (productData.get('category') as string) || 'Accessories',
                  description: (productData.get('description') as string) || '',
                  images: JSON.parse((productData.get('images') as string) || '[]') as string[],
              }
            : productData;

    const validConditions = ['Pristine', 'Excellent', 'Good', 'Well-loved'] as const;
    const mappedCondition = validConditions.includes(
        parsed.condition as (typeof validConditions)[number]
    )
        ? (parsed.condition as (typeof validConditions)[number])
        : 'Pristine';

    const result = await createRevcloListing({
        name: parsed.name || ('title' in parsed ? parsed.title : undefined) || 'Archive Piece',
        brand: parsed.brand || 'QUILTED',
        price: parsed.price,
        size: parsed.size || 'M',
        condition: mappedCondition,
        category: parsed.category || 'Accessories',
        sub_category: 'sub_category' in parsed ? parsed.sub_category : undefined,
        department: 'department' in parsed ? parsed.department : undefined,
        description: parsed.description,
        images: parsed.images,
        seller_id: sellerId,
    });

    revalidatePath('/shop');
    revalidatePath('/closet');
    revalidatePath('/');
    return { success: true, data: result.product, product: result.product };
}

export async function getUserProducts(userId?: string): Promise<Product[]> {
    const all = await getMarketplaceProducts();
    if (!userId) return all;
    const filtered = all.filter((p) => p.seller_id === userId);
    return filtered.length > 0 ? filtered : all;
}

export async function getExchangeableProducts(): Promise<Product[]> {
    return getMarketplaceProducts();
}

export async function getSellerProducts(userId: string): Promise<Product[]> {
    return getUserProducts(userId);
}

export async function adminCreateProduct(
    password: string,
    productDetails: {
        title: string;
        description: string;
        price: number;
        imageUrls: string[];
    }
): Promise<Product> {
    if (password !== '89078') {
        throw new Error('UNAUTHORIZED: INVALID ACCESS CODE.');
    }
    const res = await createRevcloListing({
        name: productDetails.title,
        brand: 'RevClo Archive',
        price: productDetails.price,
        size: 'M',
        condition: 'Pristine',
        category: 'Tops',
        description: productDetails.description,
        images: productDetails.imageUrls,
    });
    if (!res.product) {
        throw new Error(res.error || 'Failed to create product.');
    }
    return res.product;
}

export async function updateProductStatus(
    productId: string,
    status: 'available' | 'sold' | 'reserved' | 'inactive'
) {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .update({ status })
            .eq('id', productId)
            .select()
            .single();

        if (!error && data) {
            revalidatePath('/shop');
            revalidatePath('/closet');
            revalidatePath(`/product/${productId}`);
            return data as Product;
        }
    } catch {
        // fallback
    }
    return null;
}

export async function deleteProduct(productId: string) {
    try {
        await supabaseAdmin.from('products').delete().eq('id', productId);
    } catch {
        // fallback
    }
    revalidatePath('/shop');
    revalidatePath('/closet');
    return true;
}

export async function getPersonalizedFeed() {
    return getMarketplaceProducts({ sortBy: 'trending' });
}
