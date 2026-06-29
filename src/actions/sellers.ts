'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { auth } from '@/lib/auth'

export async function applyAsOgSeller(formData: {
    name: string
    email: string
}): Promise<{ success: boolean; message: string; data?: any }> {
    try {
        const cleanName = formData.name.trim()
        const cleanEmail = formData.email.trim().toLowerCase()

        // 1. Strict validation checks
        if (!cleanName || cleanName.length < 2) {
            return { success: false, message: "Invalid Entry: Name must be at least 2 characters." }
        }

        const isIgdtuw = /^[a-zA-Z0-9._%+-]+@igdtuw\.ac\.in$/i.test(cleanEmail)
        if (!isIgdtuw) {
            return { success: false, message: "Verification Failed: Only IGDTUW student email addresses (@igdtuw.ac.in) are eligible." }
        }

        // 2. Attempt to write to dedicated 'og_sellers' table
        try {
            const { data, error } = await supabaseAdmin
                .from('og_sellers')
                .insert({
                    name: cleanName,
                    email: cleanEmail,
                    created_at: new Date().toISOString()
                })
                .select()
                .maybeSingle()

            if (!error) {
                return { success: true, message: "Verification complete! Your application to become an OG Seller is secured.", data }
            }

            // If error is about relation not existing, fall back gracefully
            if (error.message && (error.message.includes('relation') || error.message.includes('does not exist'))) {
                console.warn("[applyAsOgSeller] 'og_sellers' table not found. Falling back to 'waitlist' table...")
            } else {
                console.error("[applyAsOgSeller] Database error during insert:", error)
                return { success: false, message: error.message || "Failed to submit application. Please try again." }
            }
        } catch (dbErr) {
            console.warn("[applyAsOgSeller] Exception during 'og_sellers' insert, falling back:", dbErr)
        }

        // 3. Graceful Fallback: Insert into guaranteed 'waitlist' table
        // We set a high waitlist number (e.g. 99000 + random) or resolve dynamically
        const waitlistNum = Math.floor(1000 + Math.random() * 9000)
        
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
            .from('waitlist')
            .insert({
                name: `[OG_SELLER_APPLICANT] ${cleanName}`,
                email: cleanEmail,
                waitlist_number: waitlistNum
            })
            .select()
            .maybeSingle()

        if (fallbackError) {
            console.error("[applyAsOgSeller] Fallback failed:", fallbackError)
            return { success: false, message: "Failed to secure application in fallback systems." }
        }

        return { 
            success: true, 
            message: "Verification complete! Your application has been secured in the system (Fallback Mode).",
            data: fallbackData 
        }

    } catch (err: any) {
        console.error("[applyAsOgSeller] Unexpected execution error:", err)
        return { success: false, message: "An unexpected verification error occurred." }
    }
}
