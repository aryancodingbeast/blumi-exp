import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false
    },
    global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
    }
})

export function handleSupabaseError(error: any) {
    if (error.message && (error.message.includes('<!DOCTYPE html>') || error.message.includes('521'))) {
        throw new Error('Supabase project is unreachable. It might be paused due to inactivity. Please resume it in the Supabase Dashboard.')
    }
    if (error.message && error.message.includes('statement timeout')) {
        throw new Error('The database is currently warming up from a sleeping state. Please refresh the page in 5-10 seconds while it completes its wake-up sequence.')
    }
    throw new Error(error.message || 'An unexpected error occurred with the database.')
}
