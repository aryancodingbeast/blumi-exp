'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { REVCLO_ASSETS } from '@/lib/revcloSeedData';

function LoginContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/closet';

    return (
        <div className="min-h-[calc(100vh-80px)] py-10 px-5 flex flex-col items-center justify-center">
            <div className="w-full max-w-[440px] bg-white rounded-[24px] border border-[#DCD6CD] p-6 md:p-8 text-center shadow-sm">
                <div className="inline-flex items-center gap-2 mb-1">
                    <img
                        src={REVCLO_ASSETS.onboardingLogoSvg}
                        alt="RevClo"
                        className="w-7 h-7"
                    />
                    <span
                        className="text-[24px] font-bold text-[#693629]"
                        style={{ fontFamily: 'var(--font-serif)' }}
                    >
                        RevClo
                    </span>
                </div>

                <div
                    className="text-[38px] text-[#8B4736] leading-none mb-5"
                    style={{ fontFamily: 'var(--font-brush)' }}
                >
                    The Finds
                </div>

                {/* 3-Card Fan Showcase (Figma 71:900) */}
                <div className="relative h-[170px] flex items-center justify-center mb-5">
                    <img
                        src={REVCLO_ASSETS.onboardingCard2}
                        alt=""
                        className="w-[110px] h-[138px] object-cover rounded-xl border border-[#DCD6CD] shadow-md -rotate-12 -mr-6 z-0"
                    />
                    <img
                        src={REVCLO_ASSETS.quiltedBagMain}
                        alt="RevClo Archive"
                        className="w-[128px] h-[156px] object-cover rounded-xl border-2 border-white shadow-lg z-10"
                    />
                    <img
                        src={REVCLO_ASSETS.onboardingCard3}
                        alt=""
                        className="w-[110px] h-[138px] object-cover rounded-xl border border-[#DCD6CD] shadow-md rotate-12 -ml-6 z-0"
                    />
                </div>

                <h1 className="text-[20px] font-bold text-[#161616] mb-1.5">
                    Welcome to RevClo
                </h1>
                <p className="text-[13px] text-[#5E5E5E] mb-6 leading-relaxed">
                    Sign in to sync your closet, chat with verified sellers, and shop AI-graded pre-loved fashion.
                </p>

                <button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl })}
                    className="w-full h-12 rounded-xl bg-white hover:bg-[#F7F6F3] border border-[#DCD6CD] flex items-center justify-center gap-2.5 text-[14px] font-semibold text-[#161616] mb-3 transition-colors"
                >
                    <img
                        src={REVCLO_ASSETS.googleIcon}
                        alt="Google"
                        className="w-4 h-4"
                    />
                    <span>Continue with Google</span>
                </button>

                <Link
                    href="/"
                    className="revclo-primary-btn w-full"
                    style={{
                        fontFamily: 'var(--font-brush)',
                        fontSize: '19px',
                    }}
                >
                    Take me to the sauce
                </Link>

                <p className="text-[11px] text-[#7C7C7C] mt-5">
                    By continuing, you agree to RevClo&apos;s Terms of Use & Privacy Policy.
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="py-24 text-center text-[13px] text-[#5E5E5E]">
                    Loading sign in...
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    );
}
