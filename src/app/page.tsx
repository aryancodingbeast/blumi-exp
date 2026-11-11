import React from 'react';
import { getMarketplaceProducts, getConversations } from '@/actions/marketplace';
import { SEED_BRANDS, SEED_COLLECTIONS, SEED_CREATORS } from '@/lib/revcloSeedData';
import HomeMarketplace from '@/components/revclo/HomeMarketplace';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const [products, conversations] = await Promise.all([
        getMarketplaceProducts({ sortBy: 'trending' }),
        getConversations(),
    ]);

    const unreadCount = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

    return (
        <HomeMarketplace
            initialProducts={products}
            brands={SEED_BRANDS}
            collections={SEED_COLLECTIONS}
            creators={SEED_CREATORS}
            unreadChatsCount={unreadCount}
        />
    );
}
