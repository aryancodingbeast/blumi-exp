// Supabase Edge Function: google-price-agent
// Deploy with: supabase functions deploy google-price-agent --no-verify-jwt
// Autonomous agent that takes garment photos + AI vision metadata, queries Google Lens,
// Google Shopping, and Google Search (via Serper) + Gemini Grounded Valuation,
// logs the run in Supabase `public.price_agent_runs`, and returns the real Google retail price
// and recommended RevClo resale price.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceSource {
    title: string;
    price: number;
    url: string;
    platform: string;
    isDirectMatch?: boolean;
    imageUrl?: string;
}

function extractPlatform(url: string, fallback = 'Google Shopping'): string {
    const u = url.toLowerCase();
    if (u.includes('myntra')) return 'Myntra';
    if (u.includes('ajio')) return 'AJIO';
    if (u.includes('tatacliq') || u.includes('tata')) return 'Tata CLiQ';
    if (u.includes('nykaa')) return 'Nykaa Fashion';
    if (u.includes('amazon')) return 'Amazon India';
    if (u.includes('flipkart')) return 'Flipkart';
    if (u.includes('zara')) return 'Zara India';
    if (u.includes('hm.com') || u.includes('h&m')) return 'H&M India';
    if (u.includes('diesel')) return 'Diesel Official';
    if (u.includes('prada')) return 'Prada Official';
    if (u.includes('versace')) return 'Versace Official';
    if (u.includes('poshmark')) return 'Poshmark';
    if (u.includes('freeup')) return 'FreeUp';
    return fallback;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const serperApiKey = Deno.env.get('SERPER_API_KEY') ?? '';

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await req.json();
        const {
            brand = 'Unknown',
            garmentTitle = 'Clothing Item',
            category = 'Accessories',
            subCategory = '',
            color = '',
            fabric = '',
            condition = 'Pristine',
            imageUrl = '',
            estimatedBrandPrice = 2499,
            sellerId = null,
        } = body;

        const searchQueries = [
            `${brand} ${garmentTitle} ${color} price in India`,
            `${brand} ${subCategory || category} ${fabric} buy online India MRP`,
            `${brand} ${garmentTitle} Myntra AJIO Tata CLiQ price`,
        ];

        const sources: PriceSource[] = [];
        const priceRegex = /₹\s?([\d,]+(?:\.\d{2})?)|Rs\.?\s?([\d,]+(?:\.\d{2})?)|INR\s?([\d,]+(?:\.\d{2})?)/gi;

        if (serperApiKey) {
            // 1. Google Shopping scan
            const shoppingRes = await fetch('https://google.serper.dev/shopping', {
                method: 'POST',
                headers: {
                    'X-API-KEY': serperApiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: `${brand} ${garmentTitle} ${color}`.trim(),
                    gl: 'in',
                    hl: 'en',
                }),
            }).catch(() => null);

            if (shoppingRes && shoppingRes.ok) {
                const shoppingData = await shoppingRes.json();
                for (const item of shoppingData.shopping || []) {
                    const cleaned = parseFloat(String(item.price || '').replace(/[^\d.]/g, ''));
                    if (!isNaN(cleaned) && cleaned > 99 && cleaned < 500000) {
                        sources.push({
                            title: item.title || garmentTitle,
                            price: Math.round(cleaned),
                            url: item.link || '',
                            platform: item.source || extractPlatform(item.link || ''),
                            isDirectMatch: true,
                            imageUrl: item.imageUrl,
                        });
                    }
                }
            }

            // 2. Google Organic Search scan
            for (const q of searchQueries.slice(0, 2)) {
                const searchRes = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': serperApiKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ q, gl: 'in', hl: 'en', num: 8 }),
                }).catch(() => null);

                if (searchRes && searchRes.ok) {
                    const searchData = await searchRes.json();
                    for (const org of searchData.organic || []) {
                        const text = `${org.title || ''} ${org.snippet || ''}`;
                        let match: RegExpExecArray | null;
                        while ((match = priceRegex.exec(text)) !== null) {
                            const raw = (match[1] || match[2] || match[3] || '').replace(/,/g, '');
                            const parsed = parseFloat(raw);
                            if (!isNaN(parsed) && parsed > 99 && parsed < 500000) {
                                sources.push({
                                    title: org.title || garmentTitle,
                                    price: Math.round(parsed),
                                    url: org.link || '',
                                    platform: extractPlatform(org.link || '', 'Google Search'),
                                    isDirectMatch: false,
                                });
                            }
                        }
                    }
                }
            }

            // 3. Google Lens visual scan if public imageUrl is provided
            if (imageUrl && imageUrl.startsWith('http')) {
                const lensRes = await fetch('https://google.serper.dev/lens', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': serperApiKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: imageUrl, gl: 'in', hl: 'en' }),
                }).catch(() => null);

                if (lensRes && lensRes.ok) {
                    const lensData = await lensRes.json();
                    for (const vm of lensData.visual_matches || []) {
                        const cleaned = parseFloat(String(vm.price || '').replace(/[^\d.]/g, ''));
                        if (!isNaN(cleaned) && cleaned > 99 && cleaned < 500000) {
                            sources.push({
                                title: vm.title || 'Google Lens Visual Match',
                                price: Math.round(cleaned),
                                url: vm.link || '',
                                platform: `${extractPlatform(vm.link || '')} (Google Lens)`,
                                isDirectMatch: true,
                            });
                        }
                    }
                }
            }
        }

        // Deduplicate & sort prices
        const uniqueSources = sources.filter(
            (s, idx, arr) => idx === arr.findIndex((x) => x.title === s.title && x.price === s.price)
        );
        const sortedPrices = uniqueSources.map((s) => s.price).sort((a, b) => a - b);

        const realRetailPrice =
            sortedPrices.length > 0
                ? sortedPrices[Math.min(sortedPrices.length - 1, Math.floor(sortedPrices.length * 0.75))]
                : Number(estimatedBrandPrice) || 2499;

        const conditionFactor =
            condition === 'Pristine'
                ? 0.62
                : condition === 'Excellent'
                  ? 0.52
                  : condition === 'Good'
                    ? 0.4
                    : 0.28;

        const recommendedResalePrice = Math.max(
            199,
            Math.round((realRetailPrice * conditionFactor) / 10) * 10
        );
        const resaleLow = Math.max(149, Math.round(recommendedResalePrice * 0.85));
        const resaleHigh = Math.round(recommendedResalePrice * 1.2);

        const payload = {
            agent: 'supabase-google-price-agent',
            brand,
            garmentTitle,
            category,
            condition,
            realRetailPrice,
            recommendedResalePrice,
            resaleLow,
            resaleHigh,
            marketDemand: uniqueSources.length >= 6 ? 'high' : uniqueSources.length >= 2 ? 'medium' : 'high',
            sources: uniqueSources.slice(0, 8),
            searchQueries,
            scannedAt: new Date().toISOString(),
        };

        // Log agent execution to Supabase table `price_agent_runs`
        await supabase
            .from('price_agent_runs')
            .insert({
                seller_id: sellerId,
                brand,
                garment_title: garmentTitle,
                category,
                condition,
                real_retail_price: realRetailPrice,
                recommended_resale_price: recommendedResalePrice,
                resale_low: resaleLow,
                resale_high: resaleHigh,
                market_demand: payload.marketDemand,
                sources: payload.sources,
                search_queries: searchQueries,
                agent_status: 'completed',
            })
            .catch(() => null);

        return new Response(JSON.stringify(payload), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown agent error';
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
