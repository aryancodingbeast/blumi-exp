import React from 'react';
import HomeMarketplace from '@/components/revclo/HomeMarketplace';
import { getHomePageBundle } from '@/actions/marketplace';

export const revalidate = 60;

export default async function HomePage() {
    const {
        products,
        brands,
        collections,
        creators,
        unreadChatsCount,
        currentUser,
    } = await getHomePageBundle();

    return (
        <HomeMarketplace
            initialProducts={products}
            brands={brands}
            collections={collections}
            creators={creators}
            unreadChatsCount={unreadChatsCount}
            currentUser={currentUser}
        />
    );
}
