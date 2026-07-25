export interface SourcingDemand {
    item: string
    size: string
    requests: number
    lastRequest: string
}

export interface UserMemoryProfile {
    userId: string
    name: string
    size: string
    budget: string
    vibe: string
    dislikes: string
    gender: string
    history: string[]
}

export interface RevenueStats {
    directSales: number
    affiliateRevenue: number
    directOrdersCount: number
    affiliateClicksCount: number
}

const globalStore = global as any

if (!globalStore.sourcingDemands) {
    globalStore.sourcingDemands = []
}

if (!globalStore.userMemory) {
    globalStore.userMemory = {
        userId: 'user-001',
        name: 'Aryan Singh',
        size: '',
        budget: '',
        vibe: '',
        dislikes: '',
        gender: '',
        history: []
    }
}

if (!globalStore.revenueStats) {
    globalStore.revenueStats = {
        directSales: 0,
        affiliateRevenue: 0,
        directOrdersCount: 0,
        affiliateClicksCount: 0
    }
}

export const dashboardStore = {
    getDemands: () => globalStore.sourcingDemands as SourcingDemand[],
    addDemand: (item: string, size: string) => {
        const demands = globalStore.sourcingDemands as SourcingDemand[]
        const existing = demands.find(d => d.item.toLowerCase() === item.toLowerCase() && d.size === size)
        if (existing) {
            existing.requests += 1
            existing.lastRequest = new Date().toISOString().split('T')[0]
        } else {
            demands.push({
                item: item.toLowerCase(),
                size: size || 'S',
                requests: 1,
                lastRequest: new Date().toISOString().split('T')[0]
            })
        }
        globalStore.sourcingDemands = [...demands].sort((a, b) => b.requests - a.requests)
    },
    getMemory: () => globalStore.userMemory as UserMemoryProfile,
    updateMemory: (updates: Partial<UserMemoryProfile>) => {
        globalStore.userMemory = { ...globalStore.userMemory, ...updates }
    },
    getRevenue: () => globalStore.revenueStats as RevenueStats,
    addDirectSale: (amount: number) => {
        const stats = globalStore.revenueStats as RevenueStats
        stats.directSales += amount
        stats.directOrdersCount += 1
    },
    addAffiliateClick: (commission: number) => {
        const stats = globalStore.revenueStats as RevenueStats
        stats.affiliateRevenue += commission
        stats.affiliateClicksCount += 1
    }
}
