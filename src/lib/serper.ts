import type { PriceSource } from '@/types/scanner'

const SERPER_LENS_URL = 'https://google.serper.dev/lens'

export function extractPlatform(url: string): string {
    if (url.includes('amazon')) return 'Amazon India'
    if (url.includes('flipkart')) return 'Flipkart'
    if (url.includes('myntra')) return 'Myntra'
    if (url.includes('ajio')) return 'AJIO'
    if (url.includes('instagram')) return 'Instagram Thrift'
    if (url.includes('poshmark')) return 'Poshmark'
    if (url.includes('freeup')) return 'Freeup'
    if (url.includes('olx')) return 'OLX'
    if (url.includes('meesho')) return 'Meesho'
    if (url.includes('tata')) return 'Tata CLiQ'
    return 'Web'
}

export async function searchLens(imageUrl: string): Promise<PriceSource[]> {
    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey) return []

    try {
        const response = await fetch(SERPER_LENS_URL, {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: imageUrl, gl: 'in', hl: 'en' }),
        })

        if (!response.ok) return []

        const data = await response.json()
        const sources: PriceSource[] = []
        const priceRegex = /₹\s?[\d,]+(?:\.\d{2})?|Rs\.?\s?[\d,]+(?:\.\d{2})?|INR\s?[\d,]+(?:\.\d{2})?/gi

        // Extract from visual matches
        for (const match of (data.visual_matches || [])) {
            const price = match.price ? parseFloat(String(match.price).replace(/[₹Rs.INR\s,]/gi, '')) : null
            if (price && price > 50 && price < 500000) {
                sources.push({
                    title: match.title || 'Visual Match',
                    price,
                    url: match.link || '',
                    platform: extractPlatform(match.link || '') + ' (Lens)',
                    isDirectMatch: true,
                })
            }
            // Also check title/snippet for prices
            const text = `${match.title || ''} ${match.snippet || ''}`
            const priceMatches = text.match(priceRegex) || []
            for (const pm of priceMatches) {
                const p = parseFloat(pm.replace(/[₹Rs.INR\s,]/gi, ''))
                if (p > 50 && p < 500000) {
                    sources.push({
                        title: match.title || 'Visual Match',
                        price: p,
                        url: match.link || '',
                        platform: extractPlatform(match.link || '') + ' (Lens)',
                        isDirectMatch: true,
                    })
                }
            }
        }

        // Extract from knowledge graph if available
        if (data.knowledgeGraph) {
            const kg = data.knowledgeGraph
            const text = `${kg.title || ''} ${kg.description || ''}`
            const kgPrices = text.match(priceRegex) || []
            for (const pm of kgPrices) {
                const p = parseFloat(pm.replace(/[₹Rs.INR\s,]/gi, ''))
                if (p > 50 && p < 500000) {
                    sources.push({ 
                        title: kg.title || 'Lens ID', 
                        price: p, 
                        url: '', 
                        platform: 'Google Lens',
                        isDirectMatch: true,
                    })
                }
            }
        }

        return sources
    } catch (err) {
        console.error('Lens search failed:', err)
        return []
    }
}
