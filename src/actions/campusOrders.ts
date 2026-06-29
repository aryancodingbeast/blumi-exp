'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export interface CampusOrderData {
    orderId: string
    buyerId: string
    name: string
    phone: string
    email: string
    totalAmount: number
    items: { productId: string; price: number }[]
}

/**
 * Register a campus order in Supabase with a high-reliability fallback to the waitlist table.
 */
export async function registerCampusOrder(data: CampusOrderData): Promise<{ success: boolean; message: string }> {
    try {
        const cleanName = data.name.trim()
        const cleanPhone = data.phone.trim()
        const cleanEmail = data.email.trim().toLowerCase()
        const itemsJson = JSON.stringify(data.items)

        // 1. Attempt to write to dedicated 'campus_orders' table
        try {
            const { error } = await supabaseAdmin
                .from('campus_orders')
                .insert({
                    order_id: data.orderId,
                    buyer_id: data.buyerId,
                    buyer_name: cleanName,
                    buyer_phone: cleanPhone,
                    buyer_email: cleanEmail,
                    total_amount: data.totalAmount,
                    items: data.items,
                    created_at: new Date().toISOString()
                })

            if (!error) {
                console.log(`[registerCampusOrder] Successfully saved campus order to 'campus_orders' table. Order: ${data.orderId}`)
                return { success: true, message: "Campus order registered successfully in primary database." }
            }

            // Fallback if the table doesn't exist
            if (error.message && (error.message.includes('relation') || error.message.includes('does not exist'))) {
                console.warn("[registerCampusOrder] 'campus_orders' table not found. Transitioning to 'waitlist' fallback...")
            } else {
                console.error("[registerCampusOrder] Supabase primary error:", error)
                throw error
            }
        } catch (dbErr) {
            console.warn("[registerCampusOrder] Exception during primary insert, falling back:", dbErr)
        }

        // 2. Resilience Fallback: Serialize into the guaranteed 'waitlist' table
        // We serialize Name, Phone, OrderId, and Items into the name column.
        const serializedName = `[CAMPUS_ORDER] ${cleanName} | Phone: ${cleanPhone} | Order: ${data.orderId} | Items: ${itemsJson}`
        
        // Waitlist ID can be round of amount
        const fallbackWaitlistNumber = Math.round(data.totalAmount)

        const { error: fallbackError } = await supabaseAdmin
            .from('waitlist')
            .insert({
                name: serializedName,
                email: cleanEmail,
                waitlist_number: fallbackWaitlistNumber
            })

        if (fallbackError) {
            console.error("[registerCampusOrder] Fallback failed:", fallbackError)
            return { success: false, message: "Database write failed in both primary and fallback systems." }
        }

        console.log(`[registerCampusOrder] Successfully registered campus order in waitlist fallback. Order: ${data.orderId}`)
        return { success: true, message: "Campus order registered successfully (Fallback Mode)." }

    } catch (err: any) {
        console.error("[registerCampusOrder] Unexpected server action error:", err)
        return { success: false, message: "An unexpected error occurred during order registration." }
    }
}

/**
 * Retrieve campus orders list, protected by a secure password token '8117'.
 */
export async function getCampusOrders(password: string): Promise<{ success: boolean; data?: any[]; message: string }> {
    try {
        // Strict cryptographic/credential check
        if (password !== '8117') {
            return { success: false, message: "ACCESS DENIED: Invalid cryptographic vault key." }
        }

        // 1. Attempt query from primary 'campus_orders' table
        try {
            const { data, error } = await supabaseAdmin
                .from('campus_orders')
                .select('*')
                .order('created_at', { ascending: false })

            if (!error && data) {
                const formattedData = data.map((order: any) => ({
                    id: order.id,
                    orderId: order.order_id,
                    buyerId: order.buyer_id,
                    name: order.buyer_name,
                    phone: order.buyer_phone,
                    email: order.buyer_email,
                    totalAmount: order.total_amount,
                    items: Array.isArray(order.items) ? order.items : [],
                    createdAt: order.created_at || new Date().toISOString()
                }))
                return { success: true, data: formattedData, message: "Retrieved from primary campus orders ledger." }
            }

            if (error.message && (error.message.includes('relation') || error.message.includes('does not exist'))) {
                console.warn("[getCampusOrders] Primary table not found. Fetching from 'waitlist' fallback ledger...")
            } else {
                console.error("[getCampusOrders] Supabase primary select error:", error)
            }
        } catch (dbErr) {
            console.warn("[getCampusOrders] Exception during primary query:", dbErr)
        }

        // 2. Resilience Fallback: Retrieve and parse records from the guaranteed 'waitlist' table
        const { data: fallbackRecords, error: fallbackError } = await supabaseAdmin
            .from('waitlist')
            .select('*')
            .order('id', { ascending: false })

        if (fallbackError) {
            console.error("[getCampusOrders] Fallback fetch failed:", fallbackError)
            return { success: false, message: "Database query failed across primary and fallback logs." }
        }

        const campusOrders: any[] = []

        if (fallbackRecords) {
            for (const record of fallbackRecords) {
                if (record.name && record.name.startsWith('[CAMPUS_ORDER]')) {
                    try {
                        // Regex matching: [CAMPUS_ORDER] {name} | Phone: {phone} | Order: {orderId} | Items: {items}
                        const match = record.name.match(/^\[CAMPUS_ORDER\]\s*(.*?)\s*\|\s*Phone:\s*(.*?)\s*\|\s*Order:\s*(.*?)(?:\s*\|\s*Items:\s*(.*))?$/i)
                        
                        if (match) {
                            const name = match[1]
                            const phone = match[2]
                            const orderId = match[3]
                            const itemsStr = match[4]
                            
                            let items: any[] = []
                            if (itemsStr) {
                                try {
                                    items = JSON.parse(itemsStr)
                                } catch (e) {
                                    console.warn(`[getCampusOrders] Failed to parse items JSON inside waitlist fallback record:`, e)
                                }
                            }

                            campusOrders.push({
                                id: record.id.toString(),
                                orderId,
                                buyerId: '',
                                name,
                                phone,
                                email: record.email,
                                totalAmount: record.waitlist_number || 0,
                                items,
                                createdAt: new Date().toISOString() // Fallback to current date or relative record ID
                            })
                        }
                    } catch (parseErr) {
                        console.error("[getCampusOrders] Failed to parse serialized waitlist record:", record.name, parseErr)
                    }
                }
            }
        }

        return { 
            success: true, 
            data: campusOrders, 
            message: "Retrieved and parsed from waitlist fallback ledger." 
        }

    } catch (err: any) {
        console.error("[getCampusOrders] Unexpected fetch error:", err)
        return { success: false, message: "An unexpected error occurred while loading orders." }
    }
}
