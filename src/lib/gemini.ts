import type { VisionAnalysis } from '@/types/scanner'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent'

const ANALYSIS_PROMPT = `You are an expert clothing appraiser for the Indian second-hand fashion market.

Analyze the provided clothing photo(s) and return ONLY a valid JSON object with these exact fields:

{
  "isClothing": boolean,
  "photoQuality": "good" | "acceptable" | "rejected",
  "qualityFeedback": "string explaining any photo issues",
  "brand": "detected brand name or 'Unknown'",
  "subBrand": "sub-brand line e.g. 'Zara Man', 'H&M Divided' or ''",
  "category": "e.g. 'Shirt', 'Jeans', 'Jacket', 'Dress'",
  "garmentType": "specific type e.g. 'Oxford Button-Down', 'Slim Fit Chinos'",
  "fabric": "e.g. '100% Cotton', 'Polyester Blend', 'Denim'",
  "color": "primary color",
  "pattern": "e.g. 'Solid', 'Striped', 'Checked', 'Floral'",
  "condition": "new_with_tags" | "like_new" | "gently_used" | "well_worn" | "heavily_worn",
  "conditionDetails": "detailed description of the item's condition",
  "wearTearNotes": ["array of specific wear/damage observations"],
  "size": "detected size or 'Unknown'",
  "estimatedGender": "mens" | "womens" | "unisex" | "kids",
  "confidence": 0.0 to 1.0,
  "isUserBrandMatch": boolean,
  "estimatedBrandPrice": number
}

RULES:
- If photo is blurry, too dark, or at a bad angle, set photoQuality to "rejected" and explain why.
- If the item is NOT clothing, set isClothing to false immediately.
- For brand detection, look at logos, labels, tags, stitching patterns, and design elements.
- [USER BRAND VERIFICATION]: If a claimed brand is provided in the hints, verify if the garment matches visually or via tags. Set isUserBrandMatch to true if it is plausible or verified. Set it to false ONLY if there is clear evidence of a mismatch (e.g. they claim Gucci but it clearly says Zara or looks generic). If no claimed brand is provided or it's 'Unbranded', set it to true.
- [BRAND PRICE EST]: Use your world knowledge to determine a realistic baseline MSRP/original price (in Indian Rupees, ₹) for this brand's average clothing item in the detected category (e.g. Zara shirts are ~2990, H&M is ~1499, unknown/budget is 500). Return this as a number in "estimatedBrandPrice".
- If multiple photos are provided, merge all information. The label/tag photo is most reliable for brand and fabric.
- Be specific with Indian market brands: Raymond, Allen Solly, Peter England, Van Heusen, etc.
- Return ONLY the JSON object, no markdown or explanations.`

const STEP_VALIDATION_PROMPTS: Record<string, string> = {
    front: `You are an AI garment scanner. The user MUST BE WEARING the clothing item while taking the photo. This photo should show the FRONT VIEW.

Analyze this photo and return ONLY a JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "isWorn": boolean,
  "viewType": "front" | "back" | "left_side" | "right_side" | "logo" | "unknown",
  "feedback": "short feedback string",
  "confidence": 0.0 to 1.0
}

RULES:
- The garment MUST be worn by a person. If the clothing is on a hanger, laid flat on a surface, folded, or not on a human body, set isValid = false and isWorn = false.
- isValid = true ONLY if:
  1. A person is visibly wearing the garment
  2. The photo shows the front view (chest area, collar, front buttons/graphics visible)
- If the garment is not being worn, feedback should say "Please wear the garment and try again."
- If worn but wrong angle, explain what's wrong.
- Return ONLY the JSON, no markdown.`,

    back: `You are an AI garment scanner. The user MUST BE WEARING the clothing item while taking the photo. This photo should show the BACK VIEW.

Analyze this photo and return ONLY a JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "isWorn": boolean,
  "viewType": "front" | "back" | "left_side" | "right_side" | "logo" | "unknown",
  "feedback": "short feedback string",
  "confidence": 0.0 to 1.0
}

RULES:
- The garment MUST be worn by a person. If the clothing is on a hanger, laid flat on a surface, folded, or not on a human body, set isValid = false and isWorn = false.
- isValid = true ONLY if:
  1. A person is visibly wearing the garment
  2. The photo shows the back view (back of shoulders, back design, no front-facing elements)
- If the garment is not being worn, feedback should say "Please wear the garment and try again."
- Return ONLY the JSON, no markdown.`,

    left_side: `You are an AI garment scanner. The user MUST BE WEARING the clothing item while taking the photo. This photo should show the LEFT SIDE profile.

Analyze this photo and return ONLY a JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "isWorn": boolean,
  "viewType": "front" | "back" | "left_side" | "right_side" | "logo" | "unknown",
  "feedback": "short feedback string",
  "confidence": 0.0 to 1.0
}

RULES:
- The garment MUST be worn by a person.
- isValid = true ONLY if:
  1. A person is visibly wearing the garment
  2. The photo shows the left side profile view.
- If the garment is not worn, feedback "Please wear the garment and try again."
- Return ONLY the JSON, no markdown.`,

    right_side: `You are an AI garment scanner. The user MUST BE WEARING the clothing item while taking the photo. This photo should show the RIGHT SIDE profile.

Analyze this photo and return ONLY a JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "isWorn": boolean,
  "viewType": "front" | "back" | "left_side" | "right_side" | "logo" | "unknown",
  "feedback": "short feedback string",
  "confidence": 0.0 to 1.0
}

RULES:
- The garment MUST be worn by a person.
- isValid = true ONLY if:
  1. A person is visibly wearing the garment
  2. The photo shows the right side profile view.
- If the garment is not worn, feedback "Please wear the garment and try again."
- Return ONLY the JSON, no markdown.`,

    logo: `You are an AI garment scanner. The user should capture a CLOSE-UP of the brand LOGO, LABEL, or TAG while wearing the garment.

Analyze this photo and return ONLY a JSON object:
{
  "isValid": boolean,
  "isClothing": boolean,
  "isWorn": boolean,
  "viewType": "front" | "back" | "left_side" | "right_side" | "logo" | "unknown",
  "feedback": "short feedback string",
  "confidence": 0.0 to 1.0
}

RULES:
- isValid = true if the photo shows a closeup of a clothing label, tag, brand logo on fabric, care instructions, or size tag.
- The label/logo can be photographed while the garment is being worn (e.g. pulling collar to show inner tag).
- If the clothing is clearly laid flat or on a hanger (not worn), set isWorn = false but isValid can still be true for the logo step since close-ups are harder while wearing.
- If it shows no label, tag, or logo at all, set isValid = false.
- Return ONLY the JSON, no markdown.`,
}

function getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')
    return apiKey
}

function buildImageParts(base64Images: string[]) {
    return base64Images.map(img => {
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
                parts: [
                    { text: prompt },
                    ...imageParts,
                ],
            },
        ],
        generationConfig: {
            temperature,
            topP: 0.8,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
        },
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    })

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

export async function analyzeWithGemini(base64Images: string[], searchHints?: string, userClaimedBrand?: string): Promise<VisionAnalysis> {
    const finalPrompt = searchHints || userClaimedBrand
        ? `${ANALYSIS_PROMPT}\n\n[SEARCH CONTEXT / HINTS]\nGoogle Lens found the following top matches: ${searchHints || 'None'}.\nUser claimed brand (MUST VERIFY): ${userClaimedBrand || 'None'}. Use this to cross-reference with tags and labels for maximum accuracy and determine isUserBrandMatch.`
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

export async function validateStepPhoto(stepId: string, base64Image: string): Promise<StepValidationResult> {
    const prompt = STEP_VALIDATION_PROMPTS[stepId]
    if (!prompt) throw new Error(`Unknown step: ${stepId}`)
    return callGemini(prompt, [base64Image], 0.05)
}
