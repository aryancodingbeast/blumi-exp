import { NextResponse } from 'next/server'
import { callGeminiText } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { VINTAGE_INVENTORY } from '@/lib/inventory'
import { searchProducts } from '@/lib/serper'
import { dashboardStore } from '@/lib/dashboardStore'
import { getConversationStarterReply, isStylingRequest } from '@/lib/stylistConversation'
import { auth } from '@/lib/auth'

const AFFILIATE_COMMISSION = 75

function getPlaceholderImage(category: string, title: string): string[] {
    const c = `${category} ${title}`.toLowerCase()
    if (c.includes('jacket') || c.includes('coat') || c.includes('outerwear')) {
        return ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80']
    }
    if (c.includes('shirt') || c.includes('tee') || c.includes('top') || c.includes('corset')) {
        return ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80']
    }
    if (c.includes('jeans') || c.includes('pants') || c.includes('skirt') || c.includes('cargo') || c.includes('bottom')) {
        return ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80']
    }
    if (c.includes('shoe') || c.includes('sneaker') || c.includes('boot') || c.includes('heel')) {
        return ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80']
    }
    if (c.includes('dress') || c.includes('gown')) {
        return ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80']
    }
    return ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80']
}

async function uploadChatImage(base64Str: string, productId: string): Promise<string> {
    try {
        const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/)
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 format')
        }
        const contentType = matches[1]
        const base64Data = matches[2]
        const buffer = Buffer.from(base64Data, 'base64')
        const fileExtension = contentType.split('/')[1] || 'webp'
        const fileName = `${productId}/0.${fileExtension}`

        const { error } = await supabaseAdmin
            .storage
            .from('products')
            .upload(fileName, buffer, {
                contentType: contentType,
                upsert: true
            })

        if (error) {
            throw error
        }

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('products')
            .getPublicUrl(fileName)

        return publicUrl
    } catch (err) {
        console.error('Failed to upload chat product image:', err)
        return ''
    }
}

function parseBudgetNumeric(budgetStr: string): number | null {
    if (!budgetStr) return null
    const match = budgetStr.replace(/,/g, '').match(/(\d+)/)
    return match && match[1] ? Number(match[1]) : null
}

interface CatalogItem {
    id: string
    title: string
    description: string
    brand: string
    size: string
    category: string
    condition: string
    price: number
    image: string
    vibe: string
    stylingNotes: string
    tags: string[]
}

// Merge Supabase community listings with the curated static archive into one searchable pool
async function loadCatalog(): Promise<CatalogItem[]> {
    let dbProducts: any[] = []
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('id, title, description, price, images, status, size, category, condition, brand, created_at')
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false })
        if (error) {
            console.error('Supabase query error:', error)
        } else {
            dbProducts = data || []
        }
    } catch (dbErr) {
        console.error('Failed to query Supabase products:', dbErr)
    }

    const communityItems: CatalogItem[] = dbProducts.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description || '',
        brand: product.brand || 'Blumi Vintage',
        size: product.size || 'M',
        category: product.category || '',
        condition: product.condition || 'Good',
        price: Number(product.price || 0),
        image: (product.images && product.images.length > 0)
            ? product.images[0]
            : 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&auto=format&fit=crop&q=80',
        vibe: '',
        stylingNotes: 'Stunning one-of-one piece from our community. Pair with straight-leg denim and clean sneakers. Done.',
        tags: []
    }))

    return [...communityItems, ...VINTAGE_INVENTORY]
}

function itemMatchesKeyword(item: CatalogItem, keyword: string): boolean {
    const k = keyword.toLowerCase()
    // Match any significant word of the request ("vintage leather jacket" should hit "90s Leather Bomber Jacket")
    const words = k.split(/\s+/).filter(w => w.length > 3)
    const haystack = [item.title, item.description, item.brand, item.category, ...(item.tags || [])]
        .join(' ')
        .toLowerCase()
    if (haystack.includes(k)) return true
    return words.length > 0 && words.some(w => haystack.includes(w))
}

function itemViolatesDislikes(item: CatalogItem, dislikes: string): boolean {
    if (!dislikes) return false
    const haystack = `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase()
    return dislikes
        .toLowerCase()
        .split(/[,;/]| and /)
        .map(d => d.replace(/\b(hates?|no|avoid|dislikes?)\b/g, '').trim())
        .filter(d => d.length > 3)
        .some(d => haystack.includes(d))
}

function findLocalMatch(
    catalog: CatalogItem[],
    keyword: string,
    size: string,
    budget: number | null,
    dislikes: string
): CatalogItem | null {
    const candidates = catalog.filter(item =>
        itemMatchesKeyword(item, keyword) &&
        (!size || item.size.toLowerCase() === size.toLowerCase()) &&
        (!budget || item.price <= budget) &&
        !itemViolatesDislikes(item, dislikes)
    )
    if (candidates.length > 0) return candidates[0]

    // Relax the size constraint one step rather than dead-ending to external immediately
    const relaxed = catalog.filter(item =>
        itemMatchesKeyword(item, keyword) &&
        (!budget || item.price <= budget) &&
        !itemViolatesDislikes(item, dislikes)
    )
    return relaxed.length > 0 ? relaxed[0] : null
}

export async function POST(req: Request) {
    try {
        const { prompt, userMemory, chatHistory, item, image } = await req.json()
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        // ─── Control actions (memory sync, showcase, dashboard, revenue) ───

        if (prompt.startsWith('LIST_ITEM_CONFIRM:')) {
            const titleMatch = prompt.match(/title="([^"]*)"/)
            const brandMatch = prompt.match(/brand="([^"]*)"/)
            const sizeMatch = prompt.match(/size="([^"]*)"/)
            const priceMatch = prompt.match(/price=([\d\.]+)/)
            const conditionMatch = prompt.match(/condition="([^"]*)"/)
            const categoryMatch = prompt.match(/category="([^"]*)"/)
            const descriptionMatch = prompt.match(/description="([^"]*)"/)

            const sellDetails = {
                title: titleMatch ? titleMatch[1] : 'Vintage Item',
                brand: brandMatch ? brandMatch[1] : 'Blumi Vintage',
                size: sizeMatch ? sizeMatch[1] : 'M',
                price: priceMatch ? Number(priceMatch[1]) : 1500,
                condition: conditionMatch ? conditionMatch[1] : 'Good',
                category: categoryMatch ? categoryMatch[1] : 'clothing',
                description: descriptionMatch ? descriptionMatch[1] : 'Listed directly via chat.'
            }

            const session = await auth()
            const userId = session?.user?.id
            let reply = ''
            if (userId) {
                const productId = crypto.randomUUID()
                let imageUrls = getPlaceholderImage(sellDetails.category, sellDetails.title)

                if (image && image.startsWith('data:image')) {
                    const uploadedUrl = await uploadChatImage(image, productId)
                    if (uploadedUrl) {
                        imageUrls = [uploadedUrl]
                    }
                }

                const { error: dbErr } = await supabaseAdmin
                    .from('products')
                    .insert({
                        id: productId,
                        title: sellDetails.title,
                        description: sellDetails.description,
                        price: sellDetails.price,
                        images: imageUrls,
                        seller_id: userId,
                        status: 'ACTIVE',
                        size: sellDetails.size,
                        category: sellDetails.category,
                        condition: sellDetails.condition,
                        brand: sellDetails.brand,
                        available_for_exchange: true
                    })

                if (dbErr) {
                    console.error('Failed to list item from chat confirmation:', dbErr)
                    reply = `Ooh, I tried to list your item, but our database catalog hit a snag: ${dbErr.message}. Let's try again!`
                } else {
                    reply = `Done! I've listed your ${sellDetails.brand} ${sellDetails.title} in size ${sellDetails.size} for ₹${sellDetails.price.toLocaleString('en-IN')} in the Blumi archive. It's now active for matches and buyouts! Check it on your Closet page.`
                }
            } else {
                reply = "I'd love to list your item, but I couldn't verify your secure session. Please log in first!"
            }

            return NextResponse.json({
                stylistReply: reply,
                matchType: 'local',
                items: [],
                followUpChips: [],
                updatedMemory: dashboardStore.getMemory()
            })
        }

        let lowerPrompt = prompt.toLowerCase()
        const isSellIntent = /\b(sell|list|selling|put up for sale)\b/i.test(lowerPrompt)
        if (isSellIntent) {
            return NextResponse.json({
                stylistReply: "I'd love to help you list your item! Please fill in the details in the form below to register it in our database.",
                matchType: 'local',
                items: [],
                isSelling: true,
                followUpChips: [],
                updatedMemory: dashboardStore.getMemory()
            })
        }

        if (prompt === 'GET_MEMORY_SYNC') {
            if (userMemory) {
                dashboardStore.updateMemory(userMemory)
            }
            return NextResponse.json({ updatedMemory: dashboardStore.getMemory() })
        }

        if (prompt === 'GET_SHOWCASE_SYNC') {
            const catalog = await loadCatalog()
            return NextResponse.json({
                products: catalog.slice(0, 6).map(c => ({
                    title: c.title, size: c.size, price: c.price, images: [c.image]
                }))
            })
        }

        if (prompt === 'GET_DASHBOARD_SYNC') {
            return NextResponse.json({
                demands: dashboardStore.getDemands(),
                revenue: dashboardStore.getRevenue(),
                memory: dashboardStore.getMemory()
            })
        }

        if (prompt === 'REGISTER_PURCHASE') {
            dashboardStore.addDirectSale(Number(item?.price || 0))
            return NextResponse.json({ ok: true, revenue: dashboardStore.getRevenue() })
        }

        if (prompt === 'REGISTER_AFFILIATE') {
            dashboardStore.addAffiliateClick(AFFILIATE_COMMISSION)
            return NextResponse.json({ ok: true, revenue: dashboardStore.getRevenue() })
        }

        const conversationStarterReply = getConversationStarterReply(prompt)
        if (conversationStarterReply) {
            return NextResponse.json({
                stylistReply: conversationStarterReply,
                matchType: 'local',
                items: [],
                followUpChips: [],
                updatedMemory: dashboardStore.getMemory()
            })
        }

        // Every new shopping request starts with a fresh budget check. A budget
        // supplied in the initial request is deliberately reconfirmed.
        const history = Array.isArray(chatHistory) ? chatHistory : []
        const lastStylistMessage = [...history].reverse().find((message: any) => message.sender === 'stylist')
        const lastUserMessage = [...history].reverse().find((message: any) => message.sender === 'user')
        const assistantWasAskingForBudget = /what(?:'s| is) your budget|budget (?:range|cap)|maximum.*spend/i
            .test(lastStylistMessage?.text || '')
        const currentMessageHasBudget = /(?:under|below|budget(?:\s+(?:is|of))?|max(?:imum)?(?:\s+is)?|spend(?:\s+(?:is|up to))?|₹|rs\.?)\s*₹?\s*[\d,]+/i.test(prompt)
            || /^\s*[\d,]+\s*$/.test(prompt)
        const isBudgetFollowUp = assistantWasAskingForBudget && currentMessageHasBudget
        const isShoppingRequest = isStylingRequest(prompt, lastStylistMessage?.text || '')

        if (isShoppingRequest && !isBudgetFollowUp) {
            return NextResponse.json({
                stylistReply: "Before I source anything, what's your budget for this look? I’ll use it as the maximum total spend.",
                matchType: 'local',
                items: [],
                followUpChips: ['₹2,000 max', '₹5,000 max', '₹10,000 max'],
                updatedMemory: dashboardStore.getMemory()
            })
        }

        // Bring the original shopping request forward when the current message
        // is only the answer to the budget question.
        if (isBudgetFollowUp && lastUserMessage?.text) {
            lowerPrompt = `${lastUserMessage.text} ${prompt}`.toLowerCase()
        }

        // ─── 1. Compile user memory context ───

        const savedMemory = dashboardStore.getMemory()
        const currentSize = userMemory?.size || savedMemory.size || ''
        const currentBudget = userMemory?.budget || savedMemory.budget || ''
        const currentVibe = userMemory?.vibe || savedMemory.vibe || ''
        const currentDislikes = userMemory?.dislikes || savedMemory.dislikes || ''
        const currentGender = userMemory?.gender || savedMemory.gender || ''

        // Deterministic pre-parser catches preferences stated in chat even if the LLM call fails
        let preParsedSize = currentSize
        let preParsedGender = currentGender
        let preParsedBudget = currentBudget
        let preParsedItemsWanted: string[] = []

        // lowerPrompt is already declared above

        if (/\bsize\s?xs\b|extra\s?small/i.test(lowerPrompt)) preParsedSize = 'XS'
        else if (/\bsize\s?s\b|\bsmall\b/i.test(lowerPrompt)) preParsedSize = 'S'
        else if (/\bsize\s?m\b|\bmedium\b/i.test(lowerPrompt)) preParsedSize = 'M'
        else if (/\bsize\s?l\b|\blarge\b/i.test(lowerPrompt)) preParsedSize = 'L'
        else if (/\bsize\s?xl\b|extra\s?large/i.test(lowerPrompt)) preParsedSize = 'XL'

        if (/\b(male|men|mens|guy|boys|boy|gentleman|gentlemen|he|him)\b/i.test(lowerPrompt)) {
            preParsedGender = 'male'
        } else if (/\b(female|women|womens|girl|girls|she|her)\b/i.test(lowerPrompt)) {
            preParsedGender = 'female'
        }

        const budgetMatch = lowerPrompt.match(/(?:under|below|budget(?:\s+(?:is|of))?|max(?:imum)?(?:\s+is)?|spend(?:\s+(?:is|up to))?|₹|rs\.?)\s*₹?\s*([\d,]+)/i)
            || (isBudgetFollowUp ? prompt.match(/([\d,]+)/) : null)
        if (budgetMatch && budgetMatch[1]) {
            preParsedBudget = `₹${budgetMatch[1]} max`
        }

        const resolvedSize = preParsedSize || currentSize
        const resolvedGender = preParsedGender || currentGender
        const resolvedBudget = preParsedBudget || currentBudget

        let userWantsRandom = false
        if (/\b(go crazy|crazy|random|totally random|surprise me|anything|surprise|randomly)\b/i.test(lowerPrompt)) {
            userWantsRandom = true
            preParsedItemsWanted = resolvedGender === 'male'
                ? ['vintage leather jacket', 'straight denim jeans', 'minimalist watch']
                : ['corset top', 'cargo denim skirt', 'silver necklace']
        } else {
            const itemsFound: string[] = []
            if (/\b(dress|gown|one-piece)\b/i.test(lowerPrompt)) {
                itemsFound.push('dress')
            } else {
                if (/\b(shirt|t-shirt|tee|top|corset|blazer|jacket|sweater|hoodie)\b/i.test(lowerPrompt)) {
                    let top = 'top'
                    if (lowerPrompt.includes('t-shirt') || lowerPrompt.includes('tee')) top = 't-shirt'
                    else if (lowerPrompt.includes('shirt')) top = 'shirt'
                    else if (lowerPrompt.includes('blazer')) top = 'blazer'
                    else if (lowerPrompt.includes('jacket')) top = 'jacket'
                    else if (lowerPrompt.includes('corset')) top = 'corset top'
                    itemsFound.push(top)
                }
                if (/\b(jeans|pants|trousers|skirt|cargo|shorts)\b/i.test(lowerPrompt)) {
                    let bottom = 'pants'
                    if (lowerPrompt.includes('jeans')) bottom = 'jeans'
                    else if (lowerPrompt.includes('skirt')) bottom = 'skirt'
                    else if (lowerPrompt.includes('trousers')) bottom = 'trousers'
                    itemsFound.push(bottom)
                }
            }
            if (/\b(watch|accessory|jewelry|necklace|bracelet|glasses)\b/i.test(lowerPrompt)) {
                itemsFound.push(lowerPrompt.includes('watch') ? 'watch' : 'accessory')
            }
            if (/\b(shoes|sneakers|boots|heels)\b/i.test(lowerPrompt)) {
                itemsFound.push(lowerPrompt.includes('boots') ? 'boots' : lowerPrompt.includes('heels') ? 'heels' : 'sneakers')
            }
            preParsedItemsWanted = itemsFound
        }

        // ─── 2. Gemini parses the request into structured styling/selling intent ───

        let parsed = {
            intent: 'style' as 'style' | 'sell',
            parsedSize: null as string | null,
            parsedVibe: null as string | null,
            parsedBudget: null as number | null,
            parsedGender: null as string | null,
            itemsWanted: [] as string[],
            requiresFollowUp: false,
            sellItemDetails: {
                title: null as string | null,
                brand: null as string | null,
                size: null as string | null,
                price: null as number | null,
                condition: null as string | null,
                category: null as string | null,
                description: null as string | null
            },
            stylistReply: ''
        }

        try {
            const formattedHistory = (chatHistory || [])
                .map((msg: any) => `${msg.sender === 'user' ? 'User' : 'Stylist'}: ${msg.text}`)
                .join('\n')

            const systemPrompt = `You are the Blumi Personal Fashion Stylist Agent. A warm, fashion-forward vintage stylist who speaks like a stylish friend.
Analyze the user's request and current style profile context.

The user can have two intents:
1. "style" (default): They want to style a look for an occasion, get outfit recommendations, or browse coordinate pieces.
2. "sell": They want to list or sell a garment or accessory they own (e.g. "I want to sell my vintage jacket").

For "style" intent:
- Analyze occasion, gender, size, and styling preferences.
- If size/gender or item specifications are missing, set "requiresFollowUp" to true.
- Return itemsWanted as a list of 3-4 matching coordinate item types (e.g. ["jacket", "jeans", "watch"]).

For "sell" intent:
- Parse the item details from their request. If they say "sell my Levi's jacket in size M for 2000", parse: title="jacket", brand="Levi's", size="M", price=2000, condition="Good", category="jacket", description="Levi's jacket listed via chat."
- If the item's title, size, or price are missing, set "requiresFollowUp" to true and ask for those missing details in "stylistReply".
- If all core details (title, size, price) are present, set "requiresFollowUp" to false and write the parsed values into "sellItemDetails". Acknowledge the listing in "stylistReply" (e.g., "Done! I've put up your Levi's jacket in size M for sale in the closet database. It is now active for swaps!").

Output ONLY a JSON object of this structure:
{
  "intent": "style" | "sell",
  "parsedSize": "S" | "M" | "L" | "XL" | null,
  "parsedVibe": "edgy/romantic" | "bold/grunge" | "soft/editorial" | "y2k/edgy" | "avant-garde" | "casual" | null,
  "parsedBudget": number | null,
  "parsedGender": "male" | "female" | "unisex" | null,
  "itemsWanted": string[],
  "requiresFollowUp": boolean,
  "sellItemDetails": {
    "title": string | null,
    "brand": string | null,
    "size": string | null,
    "price": number | null,
    "condition": string | null,
    "category": string | null,
    "description": string | null
  },
  "stylistReply": "A short, warm reply. Keep it under 2 sentences. Do not use markdown."
}

Recent Conversation Chat History (for context):
${formattedHistory || 'None'}

User's current message: "${prompt}"
Current saved style profile (for context): ${JSON.stringify({ size: resolvedSize, budget: resolvedBudget, vibe: currentVibe, dislikes: currentDislikes, gender: resolvedGender })}`

            const textResponse = await callGeminiText(systemPrompt, 0.3)
            const cleanText = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            parsed = JSON.parse(cleanText)
        } catch (err) {
            console.error('Gemini parsing failed, using fallback parser:', err)
            const isSellIntent = /\b(sell|list|selling|put up for sale)\b/i.test(lowerPrompt)
            if (isSellIntent) {
                const titleMatch = lowerPrompt.match(/(?:sell|list)\s(?:my\s)?([a-zA-Z\s\-]+?)(?:\sin|\sfor|\sbrand|$)/i)
                const priceMatch = lowerPrompt.match(/(?:for|₹|rs\.?)\s?([\d,]+)/i)
                const sizeMatch = lowerPrompt.match(/\b(xs|s|m|l|xl)\b/i)
                
                parsed = {
                    intent: 'sell',
                    parsedSize: sizeMatch ? sizeMatch[1].toUpperCase() : 'M',
                    parsedVibe: null,
                    parsedBudget: null,
                    parsedGender: resolvedGender || 'unisex',
                    itemsWanted: [],
                    requiresFollowUp: false,
                    sellItemDetails: {
                        title: titleMatch ? titleMatch[1].trim() : 'clothing item',
                        brand: 'Blumi Vintage',
                        size: sizeMatch ? sizeMatch[1].toUpperCase() : 'M',
                        price: priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : 1500,
                        condition: 'Good',
                        category: 'clothing',
                        description: 'Listed directly via chat.'
                    },
                    stylistReply: `Awesome! I've put up your clothing item in the closet database. Done.`
                }
            } else {
                parsed = {
                    intent: 'style',
                    parsedSize: resolvedSize || 'M',
                    parsedVibe: currentVibe,
                    parsedBudget: null,
                    parsedGender: resolvedGender || 'female',
                    itemsWanted: preParsedItemsWanted.length > 0 ? preParsedItemsWanted : ['corset top', 'skirt', 'accessory'],
                    requiresFollowUp: (!resolvedSize || !resolvedGender) ? true : false,
                    sellItemDetails: { title: null, brand: null, size: null, price: null, condition: null, category: null, description: null },
                    stylistReply: (!resolvedSize || !resolvedGender)
                        ? "Ooh, I love that occasion! To get started on your curated outfits, could you tell me your size and whether we're styling for a male or female look?"
                        : `Ooh, I love that occasion! Let's get you styled. Here are a few options I curated specifically for your look.`
                }
            }
        }



        // ─── 3. Update the memory layer ───

        const sizeToUse = parsed.parsedSize || resolvedSize || ''
        const vibeToUse = parsed.parsedVibe || currentVibe || ''
        const budgetToUse = parsed.parsedBudget ? `₹${parsed.parsedBudget} max` : resolvedBudget || ''
        const genderToUse = parsed.parsedGender || resolvedGender || ''
        const itemsToUse = parsed.itemsWanted && parsed.itemsWanted.length > 0
            ? parsed.itemsWanted
            : preParsedItemsWanted.length > 0
                ? preParsedItemsWanted
                : ['corset top', 'skirt', 'necklace']

        // If size, gender, and requested items are all known, never ask again
        let requiresFollowUp = parsed.requiresFollowUp
        if (sizeToUse && genderToUse && (itemsToUse.length > 0 || userWantsRandom)) {
            requiresFollowUp = false
            if (parsed.requiresFollowUp) {
                parsed.stylistReply = userWantsRandom
                    ? `Oh, I love going crazy! I've styled a bold, statement coordinate look for you to stand out. Check these out:`
                    : `Ooh, I love that choice! I've curated a complete coordinate look matching your style. Let's look at the pieces:`
            }
        }

        dashboardStore.updateMemory({
            size: sizeToUse,
            vibe: vibeToUse,
            budget: budgetToUse,
            gender: genderToUse,
            history: [...savedMemory.history, `Styled for: "${prompt}"`]
        })

        if (requiresFollowUp) {
            return NextResponse.json({
                stylistReply: parsed.stylistReply,
                matchType: 'local',
                items: [],
                followUpChips: buildFollowUpChips(sizeToUse, genderToUse),
                updatedMemory: dashboardStore.getMemory()
            })
        }

        // ─── 4. Hybrid per-item matching: local 1-of-1 first, external fallback per miss ───
        //
        // This is the trust engine. Each requested piece is resolved independently:
        // an in-stock vintage corset should never be hidden just because we don't
        // also stock a matching necklace. Misses (and only misses) are logged as
        // sourcing demand — that log is the buyers' shopping list.

        const catalog = await loadCatalog()
        const numericBudget = parseBudgetNumeric(budgetToUse)
        const perItemBudget = numericBudget ? Math.floor(numericBudget / itemsToUse.length) : null

        const resolvedItems = await Promise.all(itemsToUse.map(async (itemKeyword: string) => {
            const local = findLocalMatch(catalog, itemKeyword, sizeToUse, perItemBudget, currentDislikes)
            if (local) {
                return { ...local, source: 'local' as const }
            }

            // Miss: log demand for the buyers, then rescue the request externally
            dashboardStore.addDemand(itemKeyword, sizeToUse)

            let searchQuery = itemKeyword
            if (genderToUse.toLowerCase() === 'male') searchQuery = `men ${searchQuery}`
            else if (genderToUse.toLowerCase() === 'female') searchQuery = `women ${searchQuery}`
            if (perItemBudget) searchQuery = `${searchQuery} under ${perItemBudget}`

            const fetched = await searchProducts(searchQuery)
            const withinBudget = perItemBudget ? fetched.filter(f => f.price <= perItemBudget) : fetched
            const pick = withinBudget[0] || fetched[0]
            if (!pick) return null

            return {
                id: `ext-${itemKeyword.replace(/\s+/g, '-')}`,
                title: pick.title,
                description: '',
                brand: pick.platform,
                size: sizeToUse || 'M',
                category: itemKeyword,
                condition: 'New',
                price: pick.price,
                image: pick.image,
                vibe: vibeToUse,
                stylingNotes: '',
                url: pick.url,
                platform: pick.platform,
                source: 'external' as const
            }
        }))

        const items = resolvedItems.filter(Boolean)
        const localCount = items.filter((i: any) => i.source === 'local').length
        const matchType: 'local' | 'external' =
            localCount === items.length && items.length > 0 ? 'local' : 'external'

        // Be honest about mixed results — that honesty is the brand
        if (items.length > 0 && localCount > 0 && localCount < items.length) {
            parsed.stylistReply = `${parsed.stylistReply} I found ${localCount === 1 ? 'a one-of-one piece' : `${localCount} one-of-one pieces`} in our vintage archive, and hand-picked the rest from trusted stores so your look is complete.`
        }

        return NextResponse.json({
            stylistReply: parsed.stylistReply,
            matchType,
            items,
            updatedMemory: dashboardStore.getMemory()
        })

    } catch (err: any) {
        console.error('Stylist API error:', err)
        return NextResponse.json({ error: err.message || 'Internal stylist error' }, { status: 500 })
    }
}

// Quick-reply chips so a follow-up is one tap instead of a typed paragraph
function buildFollowUpChips(size: string, gender: string): string[] {
    const chips: string[] = []
    if (!gender) chips.push('Style me female', 'Style me male')
    if (!size) chips.push("I'm size S", "I'm size M", "I'm size L")
    chips.push('Complete look — go crazy ✨')
    return chips
}
