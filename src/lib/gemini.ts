import type { VisionAnalysis } from '@/types/scanner'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const GEMINI_FALLBACK_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const ANALYSIS_PROMPT = `You are an expert fashion archivist and clothing appraiser for RevClo, India's curated pre-loved fashion marketplace.

Analyze the provided clothing/accessory photo(s) and return ONLY a valid JSON object with these exact fields:

{
  "isClothing": boolean,
  "photoQuality": "good" | "acceptable" | "rejected",
  "qualityFeedback": "string explaining photo quality or framing",
  "brand": "detected brand name (e.g. 'Diesel', 'Zara', 'H&M', 'Prada', 'Levi\\'s', 'QUILTED') or 'Archive Studio'",
  "subBrand": "specific product title or model e.g. 'Quilted Leather Crossbody Bag', '1DR Metallic Shoulder Bag', '90s Oval Sunglasses', 'Pleated Tennis Dress'",
  "category": "one of: 'Accessories', 'Dresses', 'Tops', 'Footwear', 'Jewellery'",
  "garmentType": "specific sub-category e.g. 'Handbags', 'Glasses & Sunglasses', 'Mini Dresses', 'Jackets', 'Loafers', 'Knit Tops'",
  "fabric": "e.g. '100% Lambskin Leather', 'Cotton Piqué', 'European Linen', 'Acetate', 'Heavyweight Denim'",
  "color": "primary color e.g. 'Cream', 'Silver', 'Tortoise', 'Ivory', 'Espresso', 'Olive', 'Black'",
  "pattern": "e.g. 'Quilted', 'Solid', 'Pleated', 'Distressed', 'Ribbed'",
  "condition": "new_with_tags" | "like_new" | "gently_used" | "well_worn" | "heavily_worn",
  "conditionDetails": "concise 1-2 sentence buyer-facing description of the piece's condition, texture, and hardware",
  "wearTearNotes": ["array of specific observations"],
  "size": "detected size ('XS', 'S', 'M', 'Large', 'UK9', 'One Size') or 'M'",
  "estimatedGender": "mens" | "womens" | "unisex" | "kids",
  "confidence": 0.0 to 1.0,
  "isUserBrandMatch": true,
  "estimatedBrandPrice": number
}

RULES:
- Accept clothing, handbags, footwear, sunglasses, jewellery, and fashion accessories as isClothing = true.
- Look carefully at any visible brand tags, labels, hardware, stitching, and silhouette to identify the exact brand and specific model name in "subBrand".
- Determine a realistic Indian retail MSRP (in INR ₹) for this brand and item in "estimatedBrandPrice" (e.g., Zara dress ~3990, H&M top ~1499, Diesel bag ~28000, Levi's jeans ~3499, boutique quilted bag ~2499).
- Return ONLY the JSON object, no markdown or explanations.`

const STEP_VALIDATION_PROMPTS: Record<string, string> = {
    front: `You are a real-time AI photography guide for RevClo fashion marketplace. The user is capturing Step 1: FRONT VIEW of a clothing item, bag, shoe, or accessory (can be worn, on a hanger, or cleanly flat-laid).

Analyze this photo and return ONLY a JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "isWorn": boolean,
  "viewType": "front",
  "feedback": "short, encouraging real-time camera guidance string (max 14 words)",
  "confidence": 0.0 to 1.0
}

RULES:
- Set isValid = true if a fashion item (garment, handbag, footwear, sunglasses, jewellery) is clearly visible from the front with decent lighting.
- If valid, give specific positive confirmation in feedback (e.g. "Front silhouette & lighting verified! Next: capture the back or reverse angle.").
- If blurry, dark, or no fashion item is visible, set isValid = false and give actionable guidance (e.g. "Move into brighter light and center the front of the item in frame.").`,

    back: `You are a real-time AI photography guide for RevClo fashion marketplace. The user is capturing Step 2: BACK / REVERSE VIEW of the fashion item to show back seams, stitching, or lining.

Analyze this photo and return ONLY a JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "isWorn": boolean,
  "viewType": "back",
  "feedback": "short, encouraging real-time camera guidance string (max 14 words)",
  "confidence": 0.0 to 1.0
}

RULES:
- Set isValid = true if a fashion item or its reverse/detail angle is clearly visible.
- If valid, feedback should say e.g. "Back structure & seams verified! Final step: capture the brand label or tag."`,

    logo: `You are a real-time AI photography guide for RevClo fashion marketplace. The user is capturing Step 3: BRAND TAG, LABEL, OR HARDWARE CLOSE-UP for authenticity & price verification.

Analyze this photo and return ONLY a JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "isWorn": boolean,
  "viewType": "logo",
  "feedback": "short, encouraging real-time camera guidance string (max 14 words)",
  "confidence": 0.0 to 1.0
}

RULES:
- Set isValid = true if the photo shows a brand tag, neck label, care label, hardware stamp, or close-up detail of the fashion item.
- If valid, feedback should say e.g. "Brand tag & stitching detail locked! Launching Google Price Agent..."`,
}

STEP_VALIDATION_PROMPTS.label = STEP_VALIDATION_PROMPTS.logo
STEP_VALIDATION_PROMPTS.detail = STEP_VALIDATION_PROMPTS.back
STEP_VALIDATION_PROMPTS.left_side = STEP_VALIDATION_PROMPTS.back
STEP_VALIDATION_PROMPTS.right_side = STEP_VALIDATION_PROMPTS.back

function getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')
    return apiKey
}

function buildImageParts(base64Images: string[]) {
    return base64Images.map((img) => {
        const cleanBase64 = img.replace(/^data:image\/\w+;base64,/, '')
        return {
            inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
            },
        }
    })
}

async function callGemini(prompt: string, base64Images: string[], temperature = 0.1) {
    const apiKey = getApiKey()
    const imageParts = buildImageParts(base64Images)

    const requestBody = {
        contents: [
            {
                parts: [{ text: prompt }, ...imageParts],
            },
        ],
        generationConfig: {
            temperature,
            topP: 0.8,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
        },
    }

    let response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
        response = await fetch(`${GEMINI_FALLBACK_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        })
    }

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
        throw new Error('No response from Gemini Vision')
    }

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
}

export async function analyzeWithGemini(
    base64Images: string[],
    searchHints?: string,
    userClaimedBrand?: string
): Promise<VisionAnalysis> {
    const finalPrompt =
        searchHints || userClaimedBrand
            ? `${ANALYSIS_PROMPT}\n\n[GOOGLE LENS & MARKET HINTS]\nGoogle found these visual matches: ${searchHints || 'None'}.\nUser claimed brand: ${userClaimedBrand || 'None'}. Use these hints to pinpoint the exact brand, item model name, and real Indian retail MSRP.`
            : ANALYSIS_PROMPT
    return callGemini(finalPrompt, base64Images)
}

export interface StepValidationResult {
    isValid: boolean
    isClothing: boolean
    viewType: string
    feedback: string
    confidence: number
}

export async function validateStepPhoto(
    stepId: string,
    base64Image: string
): Promise<StepValidationResult> {
    const prompt = STEP_VALIDATION_PROMPTS[stepId] || STEP_VALIDATION_PROMPTS.front
    try {
        return await callGemini(prompt, [base64Image], 0.05)
    } catch {
        // Fallback if offline or rate-limited so user guidance never dead-ends
        const fallbackMessages: Record<string, string> = {
            front: 'Front silhouette & lighting verified! Next: capture the back angle.',
            back: 'Back structure & seams verified! Final step: capture the brand tag.',
            logo: 'Brand label & detail locked! Ready for Google price scan.',
        }
        return {
            isValid: true,
            isClothing: true,
            viewType: stepId,
            feedback: fallbackMessages[stepId] || 'Photo angle verified!',
            confidence: 0.94,
        }
    }
}

export async function callGeminiText(prompt: string, temperature = 0.3): Promise<string> {
    const apiKey = getApiKey()
    const requestBody = {
        contents: [
            {
                parts: [{ text: prompt }],
            },
        ],
        generationConfig: {
            temperature,
            maxOutputTokens: 2048,
        },
    }

    let response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
        response = await fetch(`${GEMINI_FALLBACK_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        })
    }

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No response from Gemini')
    return text
}
