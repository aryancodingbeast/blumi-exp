'use server'
 
import { handleSupabaseError } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { Order, OrderStatus, OrderItem } from '@/types'
import { revalidatePath } from 'next/cache'
import { isDropExpired } from '@/lib/expiry'
import { auth } from '@/lib/auth'

export async function placeOrder(buyerId: string, items: { productId: string, price: number, title?: string }[], discountedTotal?: number) {
    if (isDropExpired()) {
        throw new Error('UNAUTHORIZED: THIS EXCLUSIVE DROP HAS ARCHIVED. ORDER REGISTRATION IS DISABLED.')
    }

    const totalAmount = discountedTotal !== undefined ? discountedTotal : items.reduce((sum, item) => sum + item.price, 0)

    let safeBuyerId = buyerId
    
    // Resolve session dynamically on server to ensure correct UUID matching
    try {
        const session = await auth()
        const sessionEmail = session?.user?.email
        if (sessionEmail) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .ilike('email', sessionEmail.trim().toLowerCase())
                .maybeSingle()
                
            if (profile) {
                safeBuyerId = profile.id
            }
        }
    } catch (e) {
        console.error('[placeOrder] Failed to resolve secure user session:', e)
    }

    // Fallback checks
    if (safeBuyerId === buyerId) {
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(buyerId)
        if (!isValidUuid) {
            console.warn(`[placeOrder] buyerId "${buyerId}" is not a valid UUID. Falling back to default buyer "8f89e27c-0b8c-4f1e-9a1b-3c4d5e6f7a8b".`)
            safeBuyerId = "8f89e27c-0b8c-4f1e-9a1b-3c4d5e6f7a8b"
        } else {
            try {
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('id', buyerId)
                    .maybeSingle()
                    
                if (!profile) {
                    console.warn(`[placeOrder] buyerId "${buyerId}" does not exist in profiles table. Falling back to default buyer "8f89e27c-0b8c-4f1e-9a1b-3c4d5e6f7a8b".`)
                    safeBuyerId = "8f89e27c-0b8c-4f1e-9a1b-3c4d5e6f7a8b"
                }
            } catch (e) {
                console.error('[placeOrder] Failed to verify buyer profile existence:', e)
                safeBuyerId = "8f89e27c-0b8c-4f1e-9a1b-3c4d5e6f7a8b"
            }
        }
    }

    // 1. Atomically claim products (mark as SOLD only if currently ACTIVE) to prevent double selling/race conditions on 1/1 garments
    const productIds = items.map(item => item.productId)
    const { data: updatedProducts, error: productsError } = await supabaseAdmin
        .from('products')
        .update({ status: 'SOLD' })
        .in('id', productIds)
        .eq('status', 'ACTIVE')
        .select('id')

    if (productsError) handleSupabaseError(productsError)

    // Concurrency Check: If the number of products claimed is less than expected, someone bought it first!
    if (!updatedProducts || updatedProducts.length < productIds.length) {
        // Rollback any successfully claimed products in this request to keep them ACTIVE for other shoppers
        if (updatedProducts && updatedProducts.length > 0) {
            const successfullyClaimedIds = updatedProducts.map(p => p.id)
            await supabaseAdmin
                .from('products')
                .update({ status: 'ACTIVE' })
                .in('id', successfullyClaimedIds)
        }
        throw new Error('CONCURRENCY_ERROR: One or more 1/1 exclusive items in your bag have already been checked out by another buyer! Please return to the shop.')
    }

    // 2. Create the order
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            buyer_id: safeBuyerId,
            total_amount: totalAmount,
            status: 'PLACED' as OrderStatus
        })
        .select()
        .single()

    if (orderError) {
        // Rollback claimed products if order insertion fails
        const successfullyClaimedIds = updatedProducts.map(p => p.id)
        await supabaseAdmin
            .from('products')
            .update({ status: 'ACTIVE' })
            .in('id', successfullyClaimedIds)
        handleSupabaseError(orderError)
    }

    // 3. Create order items
    const orderItemsData = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        price: item.price
    }))

    const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItemsData)

    if (itemsError) {
        // Rollback claimed products and delete order if order items insertion fails
        const successfullyClaimedIds = updatedProducts.map(p => p.id)
        await supabaseAdmin
            .from('products')
            .update({ status: 'ACTIVE' })
            .in('id', successfullyClaimedIds)
        await supabaseAdmin
            .from('orders')
            .delete()
            .eq('id', order.id)
        handleSupabaseError(itemsError)
    }

    revalidatePath('/')
    revalidatePath('/orders')
    return order as Order
}

export async function getUserOrders(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })

    if (error) handleSupabaseError(error)
    return (data || []) as Order[]
}

export async function getSellerOrders(sellerId: string) {
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items!inner(*, products!inner(*))')
        .eq('order_items.products.seller_id', sellerId)
        .order('created_at', { ascending: false })

    if (error) handleSupabaseError(error)
    return (data || []) as Order[]
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

    if (error) handleSupabaseError(error)

    revalidatePath('/seller/orders')
    return data as Order
}
