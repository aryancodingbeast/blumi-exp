'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { auth } from '@/lib/auth'
import { Match } from '@/types'

/**
 * Get all matches for the current user, with product and user details joined.
 */
export async function getMatches(): Promise<Match[]> {
    const session = await auth()
    if (!session?.user?.id) return []
    const userId = session.user.id

    const { data, error } = await supabaseAdmin
        .from('matches')
        .select(`
            *,
            product_a:products!matches_product_a_id_fkey(*),
            product_b:products!matches_product_b_id_fkey(*),
            user_a:profiles!matches_user_a_id_fkey(id, name, email),
            user_b:profiles!matches_user_b_id_fkey(id, name, email)
        `)
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[getMatches] Error:', error)
        // Fallback: try without joins
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
            .from('matches')
            .select('*')
            .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
            .order('created_at', { ascending: false })

        if (fallbackError) {
            console.error('[getMatches] Fallback error:', fallbackError)
            return []
        }

        // Manually fetch products and users for each match
        const matches = fallbackData || []
        const enrichedMatches: Match[] = []

        for (const match of matches) {
            const [productA, productB, userA, userB] = await Promise.all([
                supabaseAdmin.from('products').select('*').eq('id', match.product_a_id).single(),
                supabaseAdmin.from('products').select('*').eq('id', match.product_b_id).single(),
                supabaseAdmin.from('profiles').select('id, name, email').eq('id', match.user_a_id).single(),
                supabaseAdmin.from('profiles').select('id, name, email').eq('id', match.user_b_id).single(),
            ])

            enrichedMatches.push({
                ...match,
                product_a: productA.data,
                product_b: productB.data,
                user_a: userA.data,
                user_b: userB.data,
            } as Match)
        }

        return enrichedMatches
    }

    return (data || []) as Match[]
}

/**
 * Confirm the exchange for the current user's side of the match.
 * When both users confirm, the match status moves to COMPLETED and products are locked.
 */
export async function confirmExchange(matchId: string): Promise<{ success: boolean; completed: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, completed: false, error: 'Not authenticated' }
    }
    const userId = session.user.id

    // Fetch the match
    const { data: match, error: fetchError } = await supabaseAdmin
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

    if (fetchError || !match) {
        return { success: false, completed: false, error: 'Match not found' }
    }

    // Determine which user is confirming
    const isUserA = match.user_a_id === userId
    const isUserB = match.user_b_id === userId

    if (!isUserA && !isUserB) {
        return { success: false, completed: false, error: 'Not part of this match' }
    }

    // Update the confirmation flag
    const updateField = isUserA ? 'user_a_confirmed' : 'user_b_confirmed'
    const { error: updateError } = await supabaseAdmin
        .from('matches')
        .update({ [updateField]: true })
        .eq('id', matchId)

    if (updateError) {
        return { success: false, completed: false, error: updateError.message }
    }

    // Check if both users have now confirmed
    const otherConfirmed = isUserA ? match.user_b_confirmed : match.user_a_confirmed
    
    if (otherConfirmed) {
        // Both confirmed! Complete the exchange.
        await supabaseAdmin
            .from('matches')
            .update({ status: 'COMPLETED' })
            .eq('id', matchId)

        // Mark both products as EXCHANGED and no longer available
        await Promise.all([
            supabaseAdmin
                .from('products')
                .update({ status: 'EXCHANGED', available_for_exchange: false })
                .eq('id', match.product_a_id),
            supabaseAdmin
                .from('products')
                .update({ status: 'EXCHANGED', available_for_exchange: false })
                .eq('id', match.product_b_id),
        ])

        return { success: true, completed: true }
    }

    // Update match status to ACCEPTED (at least one side confirmed)
    await supabaseAdmin
        .from('matches')
        .update({ status: 'ACCEPTED' })
        .eq('id', matchId)

    return { success: true, completed: false }
}

/**
 * Decline the exchange. The match is marked as DECLINED.
 */
export async function declineExchange(matchId: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' }
    }
    const userId = session.user.id

    // Verify user is part of this match
    const { data: match } = await supabaseAdmin
        .from('matches')
        .select('user_a_id, user_b_id')
        .eq('id', matchId)
        .single()

    if (!match || (match.user_a_id !== userId && match.user_b_id !== userId)) {
        return { success: false, error: 'Not part of this match' }
    }

    const { error } = await supabaseAdmin
        .from('matches')
        .update({ status: 'DECLINED' })
        .eq('id', matchId)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}
