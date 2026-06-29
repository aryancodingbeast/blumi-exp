'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { UserRole } from '@/types'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const SELLER_INVITE_CODE = 'SELLER2026'

export async function registerAsShop(formData: {
    inviteCode: string
    shopName: string
    shopDescription: string
    logoBase64: string | null
}) {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
        throw new Error('You must be logged in to register as a seller.')
    }

    if (formData.inviteCode !== SELLER_INVITE_CODE) {
        throw new Error('Invalid invite code. Please check and try again.')
    }

    if (!formData.shopName || formData.shopName.trim().length < 2) {
        throw new Error('Shop name must be at least 2 characters.')
    }

    const userId = session.user.id

    // Check if already a seller
    const { data: existingShop } = await supabaseAdmin
        .from('shops')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle()

    if (existingShop) {
        throw new Error('You already have a shop registered.')
    }

    // Create the shop
    const { data: shop, error: shopError } = await supabaseAdmin
        .from('shops')
        .insert({
            owner_id: userId,
            name: formData.shopName.trim(),
            logo_url: formData.logoBase64 || null,
            description: formData.shopDescription?.trim() || null,
        })
        .select()
        .single()

    if (shopError) {
        console.error('Shop creation error:', shopError)
        throw new Error('Failed to create shop. Please try again.')
    }

    // Update user profile to SELLER and link shop
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            role: 'SELLER' as UserRole,
            shop_id: shop.id,
        })
        .eq('id', userId)

    if (profileError) {
        // Rollback: delete the created shop
        await supabaseAdmin.from('shops').delete().eq('id', shop.id)
        console.error('Profile update error:', profileError)
        throw new Error('Failed to activate seller account. Please try again.')
    }

    revalidatePath('/seller')
    revalidatePath('/')
    return shop
}
