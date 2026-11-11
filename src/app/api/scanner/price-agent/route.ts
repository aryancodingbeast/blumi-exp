import { NextRequest, NextResponse } from 'next/server';
import { runSupabaseGooglePriceAgent } from '@/lib/supabasePriceAgent';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { images, brand, title, condition } = body as {
            images: string[];
            brand?: string;
            title?: string;
            condition?: 'Pristine' | 'Excellent' | 'Good' | 'Well-loved';
        };

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json(
                { error: 'At least one photo is required for the Google Price Agent' },
                { status: 400 }
            );
        }

        const report = await runSupabaseGooglePriceAgent({
            images,
            userBrandHint: brand,
            userTitleHint: title,
            userConditionHint: condition,
        });

        return NextResponse.json({
            success: true,
            report,
        });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : 'Supabase Google Price Agent failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
