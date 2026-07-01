'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { auth } from '@/lib/auth'
import { LikedItem } from '@/types'

/**
 * Get all liked items for the current user, with product details.
 * Excludes products that have been matched/exchanged.
 */
export async function getLikedItems(): Promise<LikedItem[]> {
    const session = await auth()
    if (!session?.user?.id) return []
    const userId = session.user.id

    const { data, error } = await supabaseAdmin
        .from('liked_items')
        .select(`
            *,
            product:products(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[getLikedItems] Error:', error)
        // Fallback without joins
        const { data: likedData } = await supabaseAdmin
            .from('liked_items')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (!likedData) return []

        const enriched: LikedItem[] = []
        for (const item of likedData) {
            const { data: product } = await supabaseAdmin
                .from('products')
                .select('*')
                .eq('id', item.product_id)
                .single()
            
            enriched.push({ ...item, product } as LikedItem)
        }
        return enriched
    }

    return (data || []) as LikedItem[]
}

/**
 * Remove an item from liked list
 */
export async function removeLikedItem(productId: string): Promise<{ success: boolean }> {
    const session = await auth()
    if (!session?.user?.id) return { success: false }

    const { error } = await supabaseAdmin
        .from('liked_items')
        .delete()
        .eq('user_id', session.user.id)
        .eq('product_id', productId)

    return { success: !error }
}
