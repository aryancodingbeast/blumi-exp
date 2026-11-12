import type { VisionAnalysis } from '@/types/scanner'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const GEMINI_FAST_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

const ANALYSIS_PROMPT = `You are an expert fashion archivist and clothing appraiser for RevClo, India's curated pre-loved fashion marketplace.

Analyze the provided clothing/accessory photo(s) and return ONLY a valid JSON object with these exact fields:

{
  "isClothing": boolean,
  "photoQuality": "good" | "acceptable" | "rejected",
  "qualityFeedback": "string explaining photo quality or framing",
  "brand": "detected brand name from neck tag/logo/style (e.g. 'Diesel', 'Zara', 'H&M', 'Prada', 'Levi\\'s', 'Uniqlo', 'Nike', 'Mango') or 'Independent Label' if tag is not legible",
  "subBrand": "specific product title or model describing the actual item in the photo (e.g. 'Ribbed Knit Cropped Cardigan', 'Heavyweight Boxy Graphic Tee', 'High-Rise Wide Leg Denim Jeans', 'Structured Leather Shoulder Bag')",
  "category": "one of: 'Tops', 'Dresses', 'Bottoms', 'Outerwear', 'Accessories', 'Footwear', 'Jewellery'",
  "garmentType": "specific sub-category e.g. 'Blouses & Shirts', 'T-Shirts & Tanks', 'Sweaters & Cardigans', 'Mini Dresses', 'Jeans & Denim', 'Jackets & Coats', 'Handbags', 'Sneakers'",
  "fabric": "detected material e.g. '100% Cotton', 'Ribbed Knit', 'European Linen', 'Heavyweight Denim', 'Faux Leather', 'Polyester Blend'",
  "color": "primary color visible in the photo e.g. 'Black', 'Cream', 'Navy', 'Olive', 'Burgundy', 'Charcoal', 'White'",
  "pattern": "e.g. 'Solid', 'Striped', 'Graphic Print', 'Plaid', 'Floral', 'Textured Knit'",
  "condition": "new_with_tags" | "like_new" | "gently_used" | "well_worn" | "heavily_worn",
  "conditionDetails": "concise 1-2 sentence buyer-facing description of the actual piece's condition, fabric drape, stitching, and wear",
  "wearTearNotes": ["array of specific visual observations from the photos"],
  "size": "detected size from label ('XS', 'S', 'M', 'L', 'XL') or best visual estimate ('S', 'M', 'L')",
  "estimatedGender": "mens" | "womens" | "unisex" | "kids",
  "confidence": 0.0 to 1.0,
  "isUserBrandMatch": true,
  "estimatedBrandPrice": number
}

RULES:
- Carefully inspect all provided photos (front view, back view, and close-up brand tag/label).
- Read any text visible on the neck label, care tag, or logo in the 3rd photo to extract the real brand and size.
- Determine a realistic Indian retail MSRP (in INR ₹) for this specific brand and garment in "estimatedBrandPrice" (e.g., H&M tee ~999, Zara dress ~3590, Levi's jeans ~3299, Uniqlo knit ~2490, Nike hoodie ~4495).
- Return ONLY the JSON object, no markdown or explanations.`

const STEP_VALIDATION_PROMPTS: Record<string, string> = {
    front: `You are a real-time AI camera guide for the RevClo fashion marketplace.
The user is pointing their camera to capture STEP 1: FRONT VIEW of a clothing item, shoe, bag, or fashion accessory (it can be held up, worn, on a hanger, or flat-laid).

Inspect this live camera frame and return ONLY a valid JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "viewType": "front",
  "detectedItem": "short 2-4 word description of what you see (e.g. 'Black cotton t-shirt', 'Blue denim jacket', 'Person face only - no garment', 'Blurry / dark frame')",
  "framingScore": number (0 to 100),
  "lightingStatus": "optimal" | "low" | "glare",
  "distanceHint": "optimal" | "move_closer" | "move_back" | "center_item",
  "feedback": "1 short, direct real-time camera coaching instruction (max 14 words)",
  "confidence": 0.0 to 1.0
}

STRICT RULES:
- Set "isValid": true ONLY if a real clothing item, bag, footwear, or fashion accessory is clearly visible, reasonably centered, and not severely blurry or pitch black.
- If the image only shows a blank wall, room background, laptop screen, ceiling, or a person's face without clearly showing the garment, set "isValid": false and "isClothing": false, and tell the user in "feedback" to hold the front of the garment inside the frame.
- If the garment is cut off or too far away, set "isValid": false, set "distanceHint" appropriately, and guide the user (e.g. "Step back slightly so the full front silhouette fits inside the reticle.").
- If valid, confirm the exact item you see in "feedback" (e.g. "Front view of black knit top verified! Turn it around for the back shot.").`,

    back: `You are a real-time AI camera guide for the RevClo fashion marketplace.
The user is pointing their camera to capture STEP 2: BACK / REVERSE VIEW of their fashion item to show back seams, reverse silhouette, or back stitching.

Inspect this live camera frame and return ONLY a valid JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "viewType": "back",
  "detectedItem": "short 2-4 word description of what is visible",
  "framingScore": number (0 to 100),
  "lightingStatus": "optimal" | "low" | "glare",
  "distanceHint": "optimal" | "move_closer" | "move_back" | "center_item",
  "feedback": "1 short, direct real-time camera coaching instruction (max 14 words)",
  "confidence": 0.0 to 1.0
}

STRICT RULES:
- Set "isValid": true ONLY if a clothing item or accessory is clearly visible in the frame with decent lighting and sharpness.
- If no garment is visible or the shot is blurry/dark, set "isValid": false and give specific real-time guidance in "feedback".
- If valid, confirm what you see (e.g. "Back seams & fabric condition verified! Next: move close to the brand tag.").`,

    logo: `You are a real-time AI camera guide for the RevClo fashion marketplace.
The user is pointing their camera to capture STEP 3: BRAND TAG / NECK LABEL / CLOSE-UP FABRIC DETAIL for authenticity and Google price lookup.

Inspect this live camera frame and return ONLY a valid JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "viewType": "logo",
  "detectedItem": "detected brand/tag text or fabric close-up (e.g. 'Zara neck tag', 'Care label & stitching', 'Close-up fabric weave')",
  "framingScore": number (0 to 100),
  "lightingStatus": "optimal" | "low" | "glare",
  "distanceHint": "optimal" | "move_closer" | "move_back" | "center_item",
  "feedback": "1 short, direct real-time camera coaching instruction (max 14 words)",
  "confidence": 0.0 to 1.0
}

STRICT RULES:
- Set "isValid": true if the photo shows a brand tag, neck label, care tag, hardware logo stamp, OR a clear close-up of the garment's collar/stitching/fabric detail.
- If no garment, tag, or fabric is in frame, or if it is too blurry to see any detail, set "isValid": false, "distanceHint": "move_closer", and instruct the user in "feedback" (e.g. "Move 5 inches closer and hold steady on the neck tag or collar stitching.").
- If valid, mention the detected tag or fabric detail in "feedback" (e.g. "Brand label & stitching locked! Launching Google Price Agent...").`,
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
        const mimeMatch = img.match(/^data:(image\/\w+);base64,/)
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
        const cleanBase64 = img.replace(/^data:image\/\w+;base64,/, '')
        return {
            inlineData: {
                mimeType,
                data: cleanBase64,
            },
        }
    })
}

async function callGemini(
    prompt: string,
    base64Images: string[],
    temperature = 0.1,
    preferFastModel = false
) {
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
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
        },
    }

    const primaryUrl = preferFastModel ? GEMINI_FAST_URL : GEMINI_API_URL
    const secondaryUrl = preferFastModel ? GEMINI_API_URL : GEMINI_FAST_URL

    let response = await fetch(`${primaryUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
        response = await fetch(`${secondaryUrl}?key=${apiKey}`, {
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
    return callGemini(finalPrompt, base64Images, 0.1, false)
}

export interface StepValidationResult {
    isValid: boolean
    isClothing: boolean
    viewType: string
    detectedItem?: string
    framingScore?: number
    lightingStatus?: 'optimal' | 'low' | 'glare'
    distanceHint?: 'optimal' | 'move_closer' | 'move_back' | 'center_item'
    feedback: string
    confidence: number
}

export async function validateStepPhoto(
    stepId: string,
    base64Image: string
): Promise<StepValidationResult> {
    const prompt = STEP_VALIDATION_PROMPTS[stepId] || STEP_VALIDATION_PROMPTS.front
    const res = await callGemini(prompt, [base64Image], 0.05, true)
    return {
        isValid: Boolean(res.isValid),
        isClothing: Boolean(res.isClothing),
        viewType: res.viewType || stepId,
        detectedItem: res.detectedItem || (res.isClothing ? 'Garment detected' : 'No garment detected'),
        framingScore: typeof res.framingScore === 'number' ? res.framingScore : res.isValid ? 92 : 45,
        lightingStatus: res.lightingStatus || 'optimal',
        distanceHint: res.distanceHint || (res.isValid ? 'optimal' : 'center_item'),
        feedback: res.feedback || (res.isValid ? 'Shot verified!' : 'Center the garment in bright light and hold steady.'),
        confidence: typeof res.confidence === 'number' ? res.confidence : res.isValid ? 0.92 : 0.3,
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
        response = await fetch(`${GEMINI_FAST_URL}?key=${apiKey}`, {
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
