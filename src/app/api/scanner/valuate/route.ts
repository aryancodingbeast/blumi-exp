import { NextRequest, NextResponse } from 'next/server'
import { analyzeWithGemini } from '@/lib/gemini'
import { searchLens, extractPlatform } from '@/lib/serper'
import type { VisionAnalysis, PriceLookupResult, Valuation, ScanResult } from '@/types/scanner'

const BRAND_DESIRABILITY: Record<string, 'luxury' | 'high' | 'medium' | 'low' | 'budget'> = {
    'zara': 'luxury', 'mango': 'luxury', 'nike': 'luxury', 'adidas': 'luxury', 
    'lacoste': 'luxury', 'superdry': 'luxury', 'marks & spencer': 'luxury',
    'levis': 'high', 'puma': 'high', 'h&m': 'high', 'van heusen': 'high',
    'louis philippe': 'high', 'raymond': 'high', 'allen solly': 'medium',
    'peter england': 'medium', 'park avenue': 'medium', 'us polo': 'medium',
    'forever 21': 'low', 'meesho': 'budget', 'max': 'budget', 'zudio': 'budget',
}

const BRAND_MULTIPLIER: Record<string, number> = {
    luxury: 1.25, high: 1.1, medium: 0.9, low: 0.75, budget: 0.55
}

const CONDITION_DEPRECIATION: Record<string, { min: number; max: number }> = {
    new_with_tags: { min: 0.65, max: 0.85 },
    like_new: { min: 0.50, max: 0.70 },
    gently_used: { min: 0.35, max: 0.55 },
    well_worn: { min: 0.20, max: 0.35 },
    heavily_worn: { min: 0.10, max: 0.20 },
}

function calculateValuation(
    vision: VisionAnalysis,
    market: PriceLookupResult & { hasDirectMatch?: boolean },
    vettingData?: any
): Valuation {
    const condition = vettingData?.condition || vision.condition
    const depreciation = CONDITION_DEPRECIATION[condition] || CONDITION_DEPRECIATION.gently_used
    const brandKey = (vettingData?.brand || vision.brand).toLowerCase()
    const desirability = BRAND_DESIRABILITY[brandKey] || 'medium'
    const multiplier = BRAND_MULTIPLIER[desirability]

    let basePrice = market.resaleAvg || market.msrp || vision.estimatedBrandPrice || 0
    if (basePrice === 0) basePrice = desirability === 'budget' ? 399 : 899

    const averageBrandPrice = vision.estimatedBrandPrice || basePrice;
    if (vettingData?.originalPrice) {
        const userPrice = parseInt(vettingData.originalPrice, 10);
        if (!isNaN(userPrice) && userPrice > 0) {
            // "if he has entered a higher price. So you should see the average price of the clothes that are found in the... brand"
            if (userPrice > averageBrandPrice * 1.5) {
                basePrice = averageBrandPrice; // Fallback to market average to prevent inflation
            } else {
                basePrice = userPrice;
            }
        }
    }

    let lowFactor = depreciation.min
    let highFactor = depreciation.max
    
    if (market.hasDirectMatch) {
        lowFactor = Math.max(0.55, depreciation.min * 1.15)
        highFactor = Math.min(0.95, depreciation.max * 0.95)
    }

    const resaleLow = Math.round(basePrice * lowFactor * multiplier)
    const resaleHigh = Math.round(basePrice * highFactor * multiplier)

    let confidence = vision.confidence * 0.35
    if (market.msrp) confidence += 0.15
    if (market.hasDirectMatch) confidence += 0.3
    if (market.numListingsFound > 5) confidence += 0.1
    if (vettingData?.isVintage) confidence += 0.1 // Vintage is unique

    confidence = Math.min(Math.round(confidence * 100), 98)

    let resellScore = 5
    if (desirability === 'luxury') resellScore += 2
    if (condition === 'new_with_tags') resellScore += 2
    if (market.marketDemand === 'high') resellScore += 2
    if (vettingData?.isVintage) resellScore += 1

    resellScore = Math.max(1, Math.min(10, resellScore))

    let recommendation: 'BUY' | 'SELL' | 'SKIP'
    let reason: string

    if (resellScore >= 7) {
        recommendation = 'BUY'
        reason = `High-value find. ${market.hasDirectMatch ? 'Perfect digital twin identified.' : ''} Strong market presence for ${brandKey}.`
    } else if (resellScore >= 4) {
        recommendation = 'SELL'
        reason = `Solid resale potential. Condition is ${condition.replace(/_/g, ' ')}. Fair market velocity.`
    } else {
        recommendation = 'SKIP'
        reason = `Limited market interest. ${desirability === 'budget' ? 'Mass-market items have lower resale ROI.' : ''}`
    }

    return {
        resaleLow, resaleHigh, confidence, resellScore,
        recommendation, recommendationReason: reason,
        depreciationRate: Math.round((1 - depreciation.min) * 100),
        brandDesirability: desirability,
    }
}

async function uploadTempImage(base64: string): Promise<string | null> {
    try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/scanner/temp-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
        })
        if (!res.ok) return null
        const { url } = await res.json()
        return url
    } catch { return null }
}

export async function POST(request: NextRequest) {
    try {
        const { images, vettingData } = await request.json()
        if (!images?.length) return NextResponse.json({ error: 'Images required' }, { status: 400 })

        // STEP 1: Visual-First Identification (Google Lens)
        let searchHints = ''
        let lensSources: any[] = []
        
        const frontImage = images[0]
        const tempUrl = await uploadTempImage(frontImage)
        
        if (tempUrl) {
            lensSources = await searchLens(tempUrl)
            searchHints = lensSources
                .slice(0, 5)
                .map(s => `${s.title} (Price: ₹${s.price || '?'})`)
                .join(', ')
        }

        // STEP 2: Gemini Deep Analysis (Structural + Condition)
        const userClaimedBrand = vettingData?.brand
        const vision = await analyzeWithGemini(images, searchHints, userClaimedBrand)

        if (!vision.isClothing) {
            return NextResponse.json({ error: 'Not a clothing item', stage: 'vision' }, { status: 422 })
        }

        if (userClaimedBrand && userClaimedBrand !== 'Unbranded' && vision.isUserBrandMatch === false) {
            return NextResponse.json({ 
                error: `Brand mismatch: You claimed ${userClaimedBrand}, but it does not match the images.`, 
                stage: 'vetting_failure' 
            }, { status: 422 })
        }

        // STEP 3: Integrated Market Intel
        const brand = vettingData?.brand || vision.brand
        const priceLookupBody = {
            brand, category: vision.category, color: vision.color,
            images: [frontImage], // Send the front image for direct matching
        }

        const priceResponse = await fetch(
            `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/scanner/price-lookup`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(priceLookupBody),
            }
        )

        let market: PriceLookupResult & { hasDirectMatch?: boolean }
        if (priceResponse.ok) {
            const priceData = await priceResponse.json()
            market = priceData.market
        } else {
            market = {
                msrp: null, msrpSource: '', resaleLow: 0, resaleHigh: 0, resaleAvg: 0,
                numListingsFound: 0, marketDemand: 'low', sources: [], searchQueries: [],
            }
        }

        // STEP 4: Expert Appraisal
        const valuation = calculateValuation(vision, market, vettingData)

        const result: ScanResult = {
            id: crypto.randomUUID(),
            vision: { ...vision, brand },
            market,
            valuation,
            userCondition: vettingData?.condition,
            createdAt: new Date().toISOString(),
        }

        return NextResponse.json({ result })
    } catch (error: any) {
        console.error('Valuation pipeline failed:', error)
        return NextResponse.json({ error: error.message || 'Valuation failed' }, { status: 500 })
    }
}

