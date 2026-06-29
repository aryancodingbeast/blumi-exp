import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    const { data: products, error: fetchError } = await supabase.from('products').select('id')

    if (fetchError) {
        return NextResponse.json({ success: false, error: fetchError })
    }

    if (products) {
        return NextResponse.json({ success: true, count: products.length, products })
    }

    return NextResponse.json({ success: true, count: 0 })
}
