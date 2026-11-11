'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import OnboardingModal from '@/components/revclo/OnboardingModal';

export default function OnboardingPage() {
    const router = useRouter();
    return <OnboardingModal isOpen={true} onClose={() => router.push('/')} />;
}
