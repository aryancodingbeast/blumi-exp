'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function checkWaitlistEmail(email: string): Promise<{ success: boolean; isRegistered: boolean; waitlistNumber?: number; name?: string }> {
    try {
        const cleanEmail = email.trim().toLowerCase()
        if (!cleanEmail) {
            return { success: false, isRegistered: false }
        }

        const { data, error } = await supabaseAdmin
            .from('waitlist')
            .select('name, waitlist_number')
            .ilike('email', cleanEmail)
            .maybeSingle()

        if (error) {
            console.error('Supabase query error:', error)
            return { success: false, isRegistered: false }
        }

        if (data) {
            return {
                success: true,
                isRegistered: true,
                waitlistNumber: data.waitlist_number,
                name: data.name
            }
        }

        return { success: true, isRegistered: false }
    } catch (err) {
        console.error('Waitlist email check failed:', err)
        return { success: false, isRegistered: false }
    }
}
