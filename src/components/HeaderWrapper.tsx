'use client';

import { usePathname } from 'next/navigation';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function HeaderWrapper() {
    const pathname = usePathname();
    // Hide the global bottom navbar on full-screen modal flows that have their own sticky bottom CTA bar
    const hideNavbarRoutes = ['/sell', '/closet/add', '/onboarding', '/login'];
    const isChatThread = pathname.startsWith('/chat/') && pathname !== '/chat';

    if (hideNavbarRoutes.includes(pathname) || isChatThread) {
        return null;
    }

    return <BottomNavbar />;
}
