import React from 'react';
import HomeMarketplace from '@/components/revclo/HomeMarketplace';
import {
    getBrands,
    getCollections,
    getConversations,
    getCreators,
    getCurrentUser,
    getMarketplaceProducts,
} from '@/actions/marketplace';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const [products, brands, collections, creators, conversations, currentUser] =
        await Promise.all([
            getMarketplaceProducts({ sortBy: 'trending' }),
            getBrands(),
            getCollections(),
            getCreators(),
            getConversations('all'),
            getCurrentUser(),
        ]);

    const unreadCount = conversations.reduce((sum, c) => sum + c.unread_count, 0);

    return (
        <HomeMarketplace
            initialProducts={products}
            brands={brands}
            collections={collections}
            creators={creators}
            unreadChatsCount={unreadCount}
            currentUser={currentUser}
        />
    );
}
