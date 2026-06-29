'use server'

import { supabase, handleSupabaseError } from '@/lib/supabase'
import { Shop } from '@/types'

export async function getShopByOwnerId(ownerId: string): Promise<Shop | null> {
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle()

    if (error) handleSupabaseError(error)
    return data as Shop | null
}

export async function getShopById(shopId: string): Promise<Shop | null> {
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single()

    if (error) handleSupabaseError(error)
    return data as Shop | null
}

export async function updateShop(shopId: string, updates: Partial<Pick<Shop, 'name' | 'logo_url' | 'description'>>) {
    const { data, error } = await supabase
        .from('shops')
        .update(updates)
        .eq('id', shopId)
        .select()
        .single()

    if (error) handleSupabaseError(error)
    return data as Shop
}
