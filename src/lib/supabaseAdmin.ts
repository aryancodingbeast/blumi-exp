import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client bypasses Row Level Security
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false
    },
    global: {
        fetch: ((url, options) => fetch(url, { ...options, cache: 'no-store' })) as typeof fetch
    }
})
