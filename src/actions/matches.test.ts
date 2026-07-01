import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMatches, confirmExchange, declineExchange } from './matches'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { auth } from '@/lib/auth'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
    auth: vi.fn()
}))

// Define type for our mock chain
interface MockChain {
    select: any;
    update: any;
    or: any;
    order: any;
    eq: any;
    single: any;
    then: any;
}

// We will return a fresh mock chain for each call to supabaseAdmin.from
let currentMockChain: MockChain

vi.mock('@/lib/supabaseAdmin', () => {
    return {
        supabaseAdmin: {
            from: vi.fn(() => {
                return currentMockChain
            })
        }
    }
})

describe('Matches Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Create a clean, chainable mock builder
        const chain: any = {}
        chain.select = vi.fn().mockReturnValue(chain)
        chain.update = vi.fn().mockReturnValue(chain)
        chain.or = vi.fn().mockReturnValue(chain)
        chain.order = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
        // Allow the chain to be awaited directly (like a Promise)
        chain.then = (onfulfilled: any) => {
            return Promise.resolve({ data: [], error: null }).then(onfulfilled)
        }

        currentMockChain = chain
    })

    describe('getMatches', () => {
        it('should return empty array if user is not authenticated', async () => {
            vi.mocked(auth).mockResolvedValueOnce(null)
            const result = await getMatches()
            expect(result).toEqual([])
        })

        it('should fetch matches for authenticated user', async () => {
            vi.mocked(auth).mockResolvedValueOnce({
                user: { id: 'user_123', name: 'Test User', email: 'test@example.com' },
                expires: ''
            })

            const mockMatches = [
                { id: 'match_1', user_a_id: 'user_123', user_b_id: 'user_456' }
            ]

            // Customize the resolve value for this specific call
            currentMockChain.then = (onfulfilled: any) => {
                return Promise.resolve({ data: mockMatches, error: null }).then(onfulfilled)
            }

            const result = await getMatches()
            expect(result).toEqual(mockMatches)
            expect(currentMockChain.select).toHaveBeenCalled()
        })
    })

    describe('confirmExchange', () => {
        it('should return auth error if not logged in', async () => {
            vi.mocked(auth).mockResolvedValueOnce(null)
            const result = await confirmExchange('match_1')
            expect(result.success).toBe(false)
            expect(result.error).toBe('Not authenticated')
        })

        it('should return error if match not found', async () => {
            vi.mocked(auth).mockResolvedValueOnce({
                user: { id: 'user_123' },
                expires: ''
            })
            currentMockChain.single = vi.fn().mockResolvedValueOnce({ data: null, error: new Error('Not found') })

            const result = await confirmExchange('match_1')
            expect(result.success).toBe(false)
            expect(result.error).toBe('Match not found')
        })

        it('should return error if user is not part of the match', async () => {
            vi.mocked(auth).mockResolvedValueOnce({
                user: { id: 'user_999' },
                expires: ''
            })
            const mockMatch = {
                id: 'match_1',
                user_a_id: 'user_123',
                user_b_id: 'user_456'
            }
            currentMockChain.single = vi.fn().mockResolvedValueOnce({ data: mockMatch, error: null })

            const result = await confirmExchange('match_1')
            expect(result.success).toBe(false)
            expect(result.error).toBe('Not part of this match')
        })

        it('should update user_a_confirmed if user is user_a', async () => {
            vi.mocked(auth).mockResolvedValueOnce({
                user: { id: 'user_123' },
                expires: ''
            })
            const mockMatch = {
                id: 'match_1',
                user_a_id: 'user_123',
                user_b_id: 'user_456',
                user_a_confirmed: false,
                user_b_confirmed: false
            }
            currentMockChain.single = vi.fn().mockResolvedValueOnce({ data: mockMatch, error: null })

            // The update call resolves with an error-free object
            currentMockChain.then = (onfulfilled: any) => {
                return Promise.resolve({ error: null }).then(onfulfilled)
            }

            const result = await confirmExchange('match_1')
            expect(result.success).toBe(true)
            expect(result.completed).toBe(false)
            expect(currentMockChain.update).toHaveBeenCalledWith({ user_a_confirmed: true })
        })

        it('should complete exchange and lock products if both sides confirm', async () => {
            vi.mocked(auth).mockResolvedValueOnce({
                user: { id: 'user_123' },
                expires: ''
            })
            const mockMatch = {
                id: 'match_1',
                user_a_id: 'user_123',
                user_b_id: 'user_456',
                user_a_confirmed: false,
                user_b_confirmed: true, // User B has already confirmed
                product_a_id: 'prod_a',
                product_b_id: 'prod_b'
            }
            currentMockChain.single = vi.fn().mockResolvedValueOnce({ data: mockMatch, error: null })

            // The update calls resolve with error-free objects
            currentMockChain.then = (onfulfilled: any) => {
                return Promise.resolve({ error: null }).then(onfulfilled)
            }

            const result = await confirmExchange('match_1')
            expect(result.success).toBe(true)
            expect(result.completed).toBe(true)
            
            // Should update matches status to COMPLETED
            expect(currentMockChain.update).toHaveBeenCalledWith({ status: 'COMPLETED' })
        })
    })

    describe('declineExchange', () => {
        it('should reject decline if user is not part of match', async () => {
            vi.mocked(auth).mockResolvedValueOnce({
                user: { id: 'user_999' },
                expires: ''
            })
            currentMockChain.single = vi.fn().mockResolvedValueOnce({
                data: { user_a_id: 'user_123', user_b_id: 'user_456' },
                error: null
            })

            const result = await declineExchange('match_1')
            expect(result.success).toBe(false)
            expect(result.error).toBe('Not part of this match')
        })

        it('should decline match successfully if user is part of match', async () => {
            vi.mocked(auth).mockResolvedValueOnce({
                user: { id: 'user_123' },
                expires: ''
            })
            currentMockChain.single = vi.fn().mockResolvedValueOnce({
                data: { user_a_id: 'user_123', user_b_id: 'user_456' },
                error: null
            })

            // The update call resolves with an error-free object
            currentMockChain.then = (onfulfilled: any) => {
                return Promise.resolve({ error: null }).then(onfulfilled)
            }

            const result = await declineExchange('match_1')
            expect(result.success).toBe(true)
            expect(currentMockChain.update).toHaveBeenCalledWith({ status: 'DECLINED' })
        })
    })
})
