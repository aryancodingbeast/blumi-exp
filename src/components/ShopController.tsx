'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types'
import ShopContent from './ShopContent'
import dynamic from 'next/dynamic'

const ThreeClosetGate = dynamic(
    () => import('./ThreeClosetGate'),
    { ssr: false }
)

interface ShopControllerProps {
    products: Product[]
    initialEmail?: string | null
    initialOnWaitlist?: boolean
    waitlistName?: string
    waitlistNumber?: number
}

// Release target times (set to past to bypass time boundaries entirely)
const RELEASE_DATE_WAITLIST = new Date('2000-01-01T00:00:00+05:30')
const RELEASE_DATE_NORMAL = new Date('2000-01-01T00:00:00+05:30')

export default function ShopController({ 
    products, 
    initialEmail = null, 
    initialOnWaitlist = false,
    waitlistName = '',
    waitlistNumber = 0
}: ShopControllerProps) {
    const [isLive, setIsLive] = useState(false)
    const [hasWaitlistAccess, setHasWaitlistAccess] = useState(initialOnWaitlist)
    const [mounted, setMounted] = useState(false)
    const [closetOpened, setClosetOpened] = useState(false)

    useEffect(() => {
        setMounted(true)
        
        // Check if waitlist verified state was saved in localStorage previously
        const localWaitlistVerified = localStorage.getItem('revclo_waitlist_verified') === 'true'
        if (localWaitlistVerified) {
            setHasWaitlistAccess(true)
        }

        const localClosetOpened = localStorage.getItem('revclo_closet_opened') === 'true'
        if (localClosetOpened) {
            setClosetOpened(true)
        }

        const checkTime = () => {
            const now = new Date()
            const activeTargetDate = (hasWaitlistAccess || localWaitlistVerified) ? RELEASE_DATE_WAITLIST : RELEASE_DATE_NORMAL
            
            if (now.getTime() >= activeTargetDate.getTime()) {
                setIsLive(true)
            } else {
                setIsLive(false)
                // Clear old locker open states if the drop is scheduled in the future
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('revclo_closet_opened')
                }
                setClosetOpened(false)
            }
        }

        checkTime()
        const timer = setInterval(checkTime, 1000)
        return () => clearInterval(timer)
    }, [hasWaitlistAccess])

    const handleReleaseLive = () => {
        setIsLive(true)
    }

    // Hydration guard to avoid server-client rendering mismatches on time
    if (!mounted) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    width: '30px',
                    height: '30px',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderTopColor: '#d11a1a',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        )
    }

    // Drop is finished. We will never render ShopContent or show any clothes, keeping the user outside the vault.
    // The doors will always stay shut and locked.

    const handleVerified = (email: string) => {
        setHasWaitlistAccess(true)
        if (typeof window !== 'undefined') {
            localStorage.setItem('revclo_waitlist_verified', 'true')
        }
    }

    const handleOpenComplete = () => {
        setClosetOpened(true)
        if (typeof window !== 'undefined') {
            localStorage.setItem('revclo_closet_opened', 'true')
        }
    }

    return (
        <ThreeClosetGate 
            initialEmail={initialEmail} 
            initialOnWaitlist={initialOnWaitlist || hasWaitlistAccess} 
            waitlistName={waitlistName}
            waitlistNumber={waitlistNumber}
            onReleaseLive={handleReleaseLive}
            onVerified={handleVerified}
            onOpenComplete={handleOpenComplete}
        />
    )
}
