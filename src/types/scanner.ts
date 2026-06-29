export interface ScanPhoto {
    id: string
    slot: 'front' | 'back' | 'left_side' | 'right_side' | 'logo'
    base64: string
    quality: 'good' | 'acceptable' | 'rejected'
    qualityNote?: string
}

export interface VisionAnalysis {
    isClothing: boolean
    photoQuality: 'good' | 'acceptable' | 'rejected'
    qualityFeedback: string
    brand: string
    subBrand: string
    category: string
    garmentType: string
    fabric: string
    color: string
    pattern: string
    condition: 'new_with_tags' | 'like_new' | 'gently_used' | 'well_worn' | 'heavily_worn'
    conditionDetails: string
    wearTearNotes: string[]
    size: string
    estimatedGender: 'mens' | 'womens' | 'unisex' | 'kids'
    confidence: number
    isUserBrandMatch?: boolean
    estimatedBrandPrice: number
}

export interface PriceLookupResult {
    msrp: number | null
    msrpSource: string
    resaleLow: number
    resaleHigh: number
    resaleAvg: number
    numListingsFound: number
    marketDemand: 'high' | 'medium' | 'low'
    sources: PriceSource[]
    searchQueries: string[]
}

export interface PriceSource {
    title: string
    price: number | null
    url: string
    platform: string
    isDirectMatch?: boolean
}

export interface Valuation {
    resaleLow: number
    resaleHigh: number
    confidence: number
    resellScore: number
    recommendation: 'BUY' | 'SELL' | 'SKIP'
    recommendationReason: string
    depreciationRate: number
    brandDesirability: 'luxury' | 'high' | 'medium' | 'low' | 'budget'
}

export interface ScanResult {
    id: string
    vision: VisionAnalysis
    market: PriceLookupResult
    valuation: Valuation
    userCondition?: string
    userBrandOverride?: string
    createdAt: string
}

export interface ScanStep {
    id: number
    label: string
    status: 'pending' | 'active' | 'complete' | 'error'
}

export type ScannerStage =
    | 'capture'
    | 'verifying'
    | 'confirm'
    | 'analyzing'
    | 'result'
    | 'error'

export interface QualityMetrics {
    brightness: number
    blur: number
    isAcceptable: boolean
    feedback: string
}
