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

export interface SearchProductResult {
    title: string
    price: number
    url: string
    platform: string
    image: string
}

export async function searchProducts(query: string): Promise<SearchProductResult[]> {
    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey) {
        console.warn('SERPER_API_KEY is not configured.')
        return []
    }

    try {
        const response = await fetch('https://google.serper.dev/shopping', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: `${query}`,
                gl: 'in',
                hl: 'en'
            }),
        })

        if (!response.ok) {
            console.error('Serper shopping response failed')
            return []
        }

        const data = await response.json()
        const results: SearchProductResult[] = []

        for (const item of (data.shopping || [])) {
            const title = item.title || 'Product'
            const link = item.link || ''
            const source = item.source || 'Online Store'
            const imageUrl = item.imageUrl || ''
            
            // Extract and clean price
            let price = 1299
            if (item.price) {
                const cleanedPrice = parseFloat(String(item.price).replace(/[^\d.]/g, ''))
                if (!isNaN(cleanedPrice) && cleanedPrice > 0) {
                    price = cleanedPrice
                }
            }

            // Exclude items that are obviously not clothing
            const lowerTitle = title.toLowerCase()
            const isExcluded = lowerTitle.includes('book') || lowerTitle.includes('doll') || lowerTitle.includes('toy') || lowerTitle.includes('poster')

            if (!isExcluded && imageUrl) {
                results.push({
                    title: title.trim(),
                    price,
                    url: link,
                    platform: source,
                    image: imageUrl
                })
            }
        }

        return results.slice(0, 3) // Return top 3 real results
    } catch (err) {
        console.error('Shopping search failed:', err)
        return []
    }
}
