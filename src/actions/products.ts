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
                .select('id, title, description, price, images, status, created_at')
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
        .select('id, title, description, price, images, status, created_at')
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
        .select('id, title, description, price, images, status, created_at')
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

export async function createProduct(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('You must be logged in to list an item.')
    }
    const userId = session.user.id

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const images = JSON.parse(formData.get('images') as string || '[]') as string[]

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
            status: 'ACTIVE' as ProductStatus
        })
        .select()
        .single()

    if (error) handleSupabaseError(error)

    revalidatePath('/')
    revalidatePath('/seller')
    return data as Product
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
