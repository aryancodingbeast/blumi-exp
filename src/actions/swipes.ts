'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { auth } from '@/lib/auth'
import { Swipe, Match } from '@/types'

/**
 * Record a swipe and check for a mutual match.
 * 
 * Match logic: A match occurs ONLY when:
 * - User A swipes RIGHT on Product B (offering Product X)
 * - AND Product B's owner (User B) previously swiped RIGHT on Product X (offering Product B)
 * Both must have each other's offered items in their liked/swiped-right list.
 */
export async function recordSwipe(
    swipedProductId: string,
    offeredProductId: string,
    direction: 'LEFT' | 'RIGHT'
): Promise<{ match: Match | null; error?: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { match: null, error: 'Not authenticated' }
    }
    const swiperId = session.user.id

    // Record the swipe
    const { error: swipeError } = await supabaseAdmin
        .from('swipes')
        .upsert({
            swiper_id: swiperId,
            swiped_product_id: swipedProductId,
            offered_product_id: offeredProductId,
            direction
        }, {
            onConflict: 'swiper_id,swiped_product_id,offered_product_id'
        })

    if (swipeError) {
        console.error('[recordSwipe] Error:', swipeError)
        return { match: null, error: swipeError.message }
    }

    // Also record in liked_items if swiped RIGHT
    if (direction === 'RIGHT') {
        await supabaseAdmin
            .from('liked_items')
            .upsert({
                user_id: swiperId,
                product_id: swipedProductId
            }, {
                onConflict: 'user_id,product_id'
            })
    }

    // Only check for match on RIGHT swipes
    if (direction !== 'RIGHT') {
        return { match: null }
    }

    // Find who owns the swiped product
    const { data: swipedProduct } = await supabaseAdmin
        .from('products')
        .select('seller_id')
        .eq('id', swipedProductId)
        .single()

    if (!swipedProduct) {
        return { match: null }
    }

    const otherUserId = swipedProduct.seller_id

    // Don't match with yourself
    if (otherUserId === swiperId) {
        return { match: null }
    }

    // Check for mutual match:
    // Did the other user (owner of swiped product) swipe RIGHT on our offered product,
    // while offering the product we just swiped on?
    const { data: reciprocalSwipe } = await supabaseAdmin
        .from('swipes')
        .select('*')
        .eq('swiper_id', otherUserId)
        .eq('swiped_product_id', offeredProductId)
        .eq('offered_product_id', swipedProductId)
        .eq('direction', 'RIGHT')
        .maybeSingle()

    if (!reciprocalSwipe) {
        return { match: null }
    }

    // Check if a match already exists between these two products
    const { data: existingMatch } = await supabaseAdmin
        .from('matches')
        .select('*')
        .or(`and(product_a_id.eq.${offeredProductId},product_b_id.eq.${swipedProductId}),and(product_a_id.eq.${swipedProductId},product_b_id.eq.${offeredProductId})`)
        .maybeSingle()

    if (existingMatch) {
        return { match: existingMatch as Match }
    }

    // Create the match!
    const { data: newMatch, error: matchError } = await supabaseAdmin
        .from('matches')
        .insert({
            user_a_id: swiperId,
            user_b_id: otherUserId,
            product_a_id: offeredProductId,
            product_b_id: swipedProductId,
            status: 'PENDING',
            user_a_confirmed: false,
            user_b_confirmed: false
        })
        .select()
        .single()

    if (matchError) {
        console.error('[recordSwipe] Match creation error:', matchError)
        return { match: null, error: matchError.message }
    }

    return { match: newMatch as Match }
}

/**
 * Get the swipe deck for a user — products they haven't swiped on yet.
 * Excludes: own products, already-swiped products, products in completed exchanges.
 */
export async function getSwipeDeck(offeredProductId: string) {
    const session = await auth()
    if (!session?.user?.id) return []
    const userId = session.user.id

    // Get all product IDs this user has already swiped on (with this offered product)
    const { data: existingSwipes } = await supabaseAdmin
        .from('swipes')
        .select('swiped_product_id')
        .eq('swiper_id', userId)
        .eq('offered_product_id', offeredProductId)

    const swipedIds = existingSwipes?.map(s => s.swiped_product_id) || []

    // Get products available for swiping
    let query = supabaseAdmin
        .from('products')
        .select('*')
        .eq('status', 'ACTIVE')
        .eq('available_for_exchange', true)
        .neq('seller_id', userId) // Don't show own products
        .neq('id', offeredProductId) // Don't show the offered product itself

    if (swipedIds.length > 0) {
        // Filter out already swiped products
        query = query.not('id', 'in', `(${swipedIds.join(',')})`)
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('[getSwipeDeck] Error:', error)
        return []
    }

    return data || []
}

/**
 * Get count of remaining cards in the deck
 */
export async function getDeckCount(offeredProductId: string): Promise<number> {
    const session = await auth()
    if (!session?.user?.id) return 0
    const userId = session.user.id

    const { data: existingSwipes } = await supabaseAdmin
        .from('swipes')
        .select('swiped_product_id')
        .eq('swiper_id', userId)
        .eq('offered_product_id', offeredProductId)

    const swipedIds = existingSwipes?.map(s => s.swiped_product_id) || []

    let query = supabaseAdmin
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .eq('available_for_exchange', true)
        .neq('seller_id', userId)
        .neq('id', offeredProductId)

    if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`)
    }

    const { count } = await query
    return count || 0
}
