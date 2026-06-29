import { NextRequest, NextResponse } from 'next/server'
import type { PriceLookupResult, PriceSource } from '@/types/scanner'
import { searchLens, extractPlatform } from '@/lib/serper'

const SERPER_API_URL = 'https://google.serper.dev/search'
const SERPER_LENS_URL = 'https://google.serper.dev/lens'

async function searchSerper(query: string): Promise<any> {
    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey) throw new Error('SERPER_API_KEY is not configured')

    const response = await fetch(SERPER_API_URL, {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            q: query,
            gl: 'in',
            hl: 'en',
            num: 10,
        }),
    })

    if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`)
    }

    return response.json()
}



function extractPricesFromResults(results: any): PriceSource[] {
    const sources: PriceSource[] = []
    const priceRegex = /₹\s?[\d,]+(?:\.\d{2})?|Rs\.?\s?[\d,]+(?:\.\d{2})?|INR\s?[\d,]+(?:\.\d{2})?/gi

    const allResults = [
        ...(results.organic || []),
        ...(results.shopping || []),
    ]

    for (const result of allResults) {
        const text = `${result.title || ''} ${result.snippet || ''} ${result.price || ''}`
        const matches = text.match(priceRegex) || []

        for (const match of matches) {
            const numStr = match.replace(/[₹Rs.INR\s,]/gi, '').trim()
            const price = parseFloat(numStr)

            if (price > 50 && price < 500000) {
                sources.push({
                    title: result.title || 'Unknown',
                    price,
                    url: result.link || '',
                    platform: extractPlatform(result.link || ''),
                    isDirectMatch: false,
                })
            }
        }

        if (result.price) {
            const cleanPrice = String(result.price).replace(/[₹Rs.INR\s,]/gi, '').trim()
            const shoppingPrice = parseFloat(cleanPrice)
            if (shoppingPrice > 50 && shoppingPrice < 500000) {
                sources.push({
                    title: result.title || 'Unknown',
                    price: shoppingPrice,
                    url: result.link || '',
                    platform: extractPlatform(result.link || ''),
                    isDirectMatch: false,
                })
            }
        }
    }

    return sources
}



export async function POST(request: NextRequest) {
    try {
        const { brand, subBrand, category, garmentType, fabric, color, pattern, images } = await request.json()

        if (!brand || !category) {
            return NextResponse.json(
                { error: 'Brand and category are required' },
                { status: 400 }
            )
        }

        const descriptors = [
            subBrand,
            garmentType || category,
            pattern !== 'Solid' ? pattern : '',
            color,
            fabric !== 'Unknown' ? fabric : ''
        ].filter(Boolean).join(' ')

        const searchQueries = [
            `${brand} ${descriptors} price India`,
            `${brand} ${subBrand || ''} ${garmentType || category} official buy online India`,
            `${brand} ${garmentType || category} ${pattern || ''} India resale price`,
            `${brand} clothing average retail price India`,
        ]

        // Enhanced Multi-Image Lens Lookup
        const lensPromises = (images || []).map(async (base64Img: string) => {
            try {
                const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
                const uploadRes = await fetch(`${baseUrl}/api/scanner/temp-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64Img }),
                })
                if (!uploadRes.ok) return []
                const { url } = await uploadRes.json()
                return searchLens(url)
            } catch { return [] }
        })

        const [textResults, ...lensResultsArrays] = await Promise.all([
            Promise.all(searchQueries.map(q => searchSerper(q).catch(() => null))),
            ...lensPromises
        ])

        const lensSources = lensResultsArrays.flat()
        const allSources: PriceSource[] = [...lensSources]
        for (const result of textResults) {
            if (result) {
                allSources.push(...extractPricesFromResults(result))
            }
        }

        const uniqueSources = allSources.filter(
            (source, idx, self) =>
                idx === self.findIndex(s => s.url === source.url && s.price === source.price)
        )

        const directMatchSources = uniqueSources.filter(s => s.isDirectMatch)
        const hasDirectMatch = directMatchSources.length > 0

        const prices = uniqueSources
            .map(s => s.price)
            .filter((p): p is number => p !== null && p > 0)
            .sort((a, b) => a - b)

        let msrp: number | null = null
        let msrpSource = ''

        // Prioritize Lens results for MSRP if they clearly link to a retailer
        const directRetailMatch = directMatchSources.find(s => 
            ['Amazon India', 'Flipkart', 'Myntra', 'AJIO', 'Tata CLiQ'].some(p => s.platform.includes(p))
        )

        if (directRetailMatch) {
            msrp = directRetailMatch.price
            msrpSource = directRetailMatch.platform
        } else {
            const retailSources = uniqueSources.filter(s =>
                ['Amazon India', 'Flipkart', 'Myntra', 'AJIO', 'Tata CLiQ'].includes(s.platform)
            )
            if (retailSources.length > 0) {
                const lowestRetail = retailSources.reduce((min, s) =>
                    (s.price || 0) < (min.price || Infinity) ? s : min
                )
                msrp = lowestRetail.price
                msrpSource = lowestRetail.platform
            }
        }

        let resaleLow = 0
        let resaleHigh = 0
        let resaleAvg = 0

        if (prices.length > 0) {
            if (hasDirectMatch) {
                // If we have direct matches, weigh them 70% of the average
                const directPrices = directMatchSources
                    .map(s => s.price)
                    .filter((p): p is number => p !== null && p > 0)
                
                const directAvg = directPrices.reduce((a, b) => a + b, 0) / directPrices.length
                
                const q1 = Math.floor(prices.length * 0.25)
                const q3 = Math.floor(prices.length * 0.75)
                const globalMedian = prices[Math.floor(prices.length / 2)]

                // Resale average is skewed towards direct matches
                resaleAvg = Math.round((directAvg * 0.7) + (globalMedian * 0.3))
                resaleLow = Math.round(resaleAvg * 0.85) // Tighter range for direct matches
                resaleHigh = Math.round(resaleAvg * 1.15)
            } else {
                const q1 = Math.floor(prices.length * 0.25)
                const q3 = Math.floor(prices.length * 0.75)
                resaleLow = prices[q1] || prices[0]
                resaleHigh = prices[q3] || prices[prices.length - 1]
                
                const mid = Math.floor(prices.length / 2)
                resaleAvg = prices.length % 2 !== 0 
                    ? prices[mid] 
                    : Math.round((prices[mid - 1] + prices[mid]) / 2)
            }
        }

        const demand: 'high' | 'medium' | 'low' =
            uniqueSources.length > 8 ? 'high' :
                uniqueSources.length > 3 ? 'medium' : 'low'

        const result: PriceLookupResult & { hasDirectMatch: boolean } = {
            msrp,
            msrpSource,
            resaleLow,
            resaleHigh,
            resaleAvg,
            numListingsFound: uniqueSources.length,
            marketDemand: demand,
            sources: uniqueSources.slice(0, 10),
            searchQueries,
            hasDirectMatch,
        }

        return NextResponse.json({ market: result })
    } catch (error: any) {
        console.error('Price lookup error:', error)
        return NextResponse.json(
            { error: error.message || 'Price lookup failed' },
            { status: 500 }
        )
    }
}
