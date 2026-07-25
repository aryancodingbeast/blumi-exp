const GREETING_ONLY = /^(?:hi+|hey+|hello+|yo|hiya|hey\s+there|hello\s+there|hey\s+stylist|good\s+(?:morning|afternoon|evening))[\s!.,?]*$/i
const SMALL_TALK_ONLY = /^(?:how are you|how's it going|what's up|thanks|thank you|okay|ok|cool|nice)[\s!.,?]*$/i
const STYLING_LANGUAGE = /\b(?:buy|shop|shopping|style|styling|wear|outfit|look|recommend|find|source|dress|shirt|t-shirt|tee|top|corset|blazer|jacket|sweater|hoodie|jeans|pants|trousers|skirt|cargo|shorts|shoes|sneakers|boots|heels|watch|accessory|jewelry|necklace|festival|wedding|date|brunch|gallery|college|campus|work|office|party|event|occasion|interview|dinner|vacation|travel|casual|formal|everyday|daily|night out|go crazy|surprise me)\b/i
const STYLIST_CONTEXT_QUESTION = /what are we dressing for today|tell me the occasion|piece you want to style|mood you(?:'|’)re going for/i

export function getConversationStarterReply(prompt: string): string | null {
    if (!GREETING_ONLY.test(prompt.trim())) return null

    return 'Hey! What are we dressing for today? Tell me the occasion, a piece you want to style, or the mood you’re going for.'
}

export function isStylingRequest(prompt: string, lastStylistMessage = ''): boolean {
    const trimmedPrompt = prompt.trim()
    if (SMALL_TALK_ONLY.test(trimmedPrompt)) return false

    return STYLING_LANGUAGE.test(trimmedPrompt) || STYLIST_CONTEXT_QUESTION.test(lastStylistMessage)
}
