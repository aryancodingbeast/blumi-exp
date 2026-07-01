'use server'

import { supabase, handleSupabaseError } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { Product, ProductStatus } from '@/types'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import crypto from 'crypto'

export async function getProducts() {
    let retries = 3
    let delay = 1500

    while (retries > 0) {
        try {
            const { data, error } = await supabaseAdmin
                .from('products')
                .select('id, title, description, price, images, status, size, category, condition, brand, available_for_exchange, seller_id, created_at')
                .in('status', ['ACTIVE', 'SOLD'])
                .order('created_at', { ascending: false })

            if (error) {
                if (error.message && error.message.includes('statement timeout') && retries > 1) {
                    console.warn(`[getProducts] Supabase warming up. Retrying... (${retries - 1} retries left)`)
                    retries--
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }
                handleSupabaseError(error)
            }
            return data as Product[]
        } catch (err: any) {
            if (err.message && err.message.includes('statement timeout') && retries > 1) {
                console.warn(`[getProducts] Catch statement timeout. Retrying... (${retries - 1} retries left)`)
                retries--
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
            }
            throw err
        }
    }
    return [] as Product[]
}

export async function searchProducts(query: string) {
    if (!query || query.length < 2) return []

    const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, title, description, price, images, status, size, category, condition, brand, available_for_exchange, seller_id, created_at')
        .in('status', ['ACTIVE', 'SOLD'])
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10)

    if (error) handleSupabaseError(error)
    return data as Product[]
}

export async function getProductById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

    if (error) handleSupabaseError(error)
    return data as Product
}

export async function getRelatedProducts(productId: string) {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, title, description, price, images, status, size, category, condition, brand, available_for_exchange, seller_id, created_at')
        .in('status', ['ACTIVE', 'SOLD'])
        .neq('id', productId)
        .limit(4)

    if (error) handleSupabaseError(error)
    return data as Product[]
}

async function uploadBase64ToStorage(base64Str: string, productId: string, index: number): Promise<string> {
    if (!base64Str || !base64Str.startsWith('data:image')) {
        return base64Str
    }

    try {
        const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/)
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 format')
        }

        const contentType = matches[1]
        const base64Data = matches[2]
        const buffer = Buffer.from(base64Data, 'base64')
        
        const fileExtension = contentType.split('/')[1] || 'webp'
        const fileName = `${productId}/${index}.${fileExtension}`
        
        const { error } = await supabaseAdmin
            .storage
            .from('products')
            .upload(fileName, buffer, {
                contentType: contentType,
                upsert: true
            })

        if (error) {
            console.error('[uploadBase64ToStorage] Upload error:', error)
            throw error
        }

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('products')
            .getPublicUrl(fileName)

        return publicUrl
    } catch (err) {
        console.error('[uploadBase64ToStorage] Failed to upload image:', err)
        return base64Str
    }
}

/**
 * Create a product with full swap-platform fields.
 * Used by the /closet/add listing form.
 */
export async function createProduct(formData: FormData): Promise<{ success: boolean; data?: Product; error?: string }> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: 'You must be logged in to list an item.' }
        }
        const userId = session.user.id

        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const price = parseFloat(formData.get('price') as string || '0')
        const images = JSON.parse(formData.get('images') as string || '[]') as string[]
        const size = (formData.get('size') as string) || 'Free Size'
        const category = (formData.get('category') as string) || 'Tops'
        const condition = (formData.get('condition') as string) || 'Good'
        const brand = (formData.get('brand') as string) || ''

        if (images.length < 4) {
            return { success: false, error: 'Please upload at least 4 images.' }
        }

        const productId = crypto.randomUUID()
        const uploadedUrls: string[] = []

        for (let i = 0; i < images.length; i++) {
            const url = await uploadBase64ToStorage(images[i], productId, i)
            uploadedUrls.push(url)
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                id: productId,
                title,
                description,
                price,
                images: uploadedUrls,
                seller_id: userId,
                status: 'ACTIVE' as ProductStatus,
                size,
                category,
                condition,
                brand,
                available_for_exchange: true
            })
            .select()
            .single()

        if (error) {
            console.error('[createProduct] Database insert error:', error)
            if (error.message && (error.message.includes('column "size"') || error.message.includes('column "available_for_exchange"'))) {
                return {
                    success: false,
                    error: 'Database schema is not updated. Please execute the SQL migration commands in "src/db/migration.sql" in your Supabase SQL Editor first.'
                }
            }
            return { success: false, error: error.message || 'An unexpected error occurred.' }
        }

        revalidatePath('/')
        revalidatePath('/closet')
        return { success: true, data: data as Product }
    } catch (err: any) {
        console.error('[createProduct] Unhandled error:', err)
        return { success: false, error: err.message || 'Failed to list item.' }
    }
}

/**
 * Get all products listed by a specific user (for "My Closet")
 */
export async function getUserProducts(userId?: string): Promise<Product[]> {
    const session = await auth()
    const targetUserId = userId || session?.user?.id
    if (!targetUserId) return []

    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('seller_id', targetUserId)
        .in('status', ['ACTIVE', 'EXCHANGED'])
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[getUserProducts] Error:', error)
        return []
    }
    return data as Product[]
}

/**
 * Get user's products that are available for exchange (for the exchange selector)
 */
export async function getExchangeableProducts(): Promise<Product[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('seller_id', session.user.id)
        .eq('status', 'ACTIVE')
        .eq('available_for_exchange', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[getExchangeableProducts] Error:', error)
        return []
    }
    return data as Product[]
}

export async function getSellerProducts(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })

    if (error) handleSupabaseError(error)
    return data as Product[]
}

export async function adminCreateProduct(password: string, productDetails: {
    title: string
    description: string
    price: number
    imageUrls: string[]
}) {
    if (password !== '89078') {
        throw new Error('UNAUTHORIZED: INVALID ACCESS CODE.')
    }

    // Find the first registered seller id to link dynamically
    let sellerId = '854a48cd-d31e-4a7e-a622-58d1f44b73d8' // Default fallback
    try {
        const { data: sellers } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', 'SELLER')
            .limit(1)

        if (sellers && sellers.length > 0) {
            sellerId = sellers[0].id
        }
    } catch (e) {
        console.error('Failed to resolve seller profiles for admin insert:', e)
    }

    const productId = crypto.randomUUID()
    const uploadedUrls: string[] = []

    for (let i = 0; i < productDetails.imageUrls.length; i++) {
        const url = await uploadBase64ToStorage(productDetails.imageUrls[i], productId, i)
        uploadedUrls.push(url)
    }

    const { data, error } = await supabaseAdmin
        .from('products')
        .insert({
            id: productId,
            title: productDetails.title,
            description: productDetails.description,
            price: productDetails.price,
            images: uploadedUrls && uploadedUrls.length > 0 ? uploadedUrls : ['/collage-1.webp'],
            seller_id: sellerId,
            status: 'ACTIVE' as ProductStatus
        })
        .select()
        .single()

    if (error) handleSupabaseError(error)

    revalidatePath('/')
    revalidatePath('/shop')
    return data as Product
}
