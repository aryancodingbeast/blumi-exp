import { describe, expect, it } from 'vitest'
import { getConversationStarterReply, isStylingRequest } from './stylistConversation'

describe('getConversationStarterReply', () => {
    it.each(['hey', 'Hey!', 'hello there', 'hii', 'good afternoon'])(
        'asks for context when the user only says %s',
        (prompt) => {
            expect(getConversationStarterReply(prompt)).toContain('What are we dressing for today?')
        }
    )

    it.each(['hey, I need a dress', 'style me for a date', 'find a blazer'])(
        'does not intercept a real styling request: %s',
        (prompt) => {
            expect(getConversationStarterReply(prompt)).toBeNull()
        }
    )
})

describe('isStylingRequest', () => {
    it.each(['style me for a date', 'something casual for college', 'I have a party'])(
        'recognizes a direct styling request: %s',
        (prompt) => {
            expect(isStylingRequest(prompt)).toBe(true)
        }
    )

    it('recognizes a contextual answer to the stylist opening question', () => {
        expect(isStylingRequest(
            'something relaxed',
            'Hey! What are we dressing for today? Tell me the occasion, a piece you want to style, or the mood you’re going for.'
        )).toBe(true)
    })

    it.each(['how are you?', 'thanks!', 'cool'])(
        'does not turn small talk into a budget question: %s',
        (prompt) => {
            expect(isStylingRequest(prompt, 'What are we dressing for today?')).toBe(false)
        }
    )
})
