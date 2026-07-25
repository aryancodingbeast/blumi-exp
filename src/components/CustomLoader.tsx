'use client'

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function CustomLoader() {
    const [loading, setLoading] = useState(true)
    const [textIndex, setTextIndex] = useState(0)
    const loaderRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)

    const loadingTexts = [
        "BLUMI.SYSTEMS_",
        "ESTABLISHING_VAULT_CONNECTION...",
        "AUTHENTICATING_USER_SESSION...",
        "SECURING_DROP_001_ARTIFACTS_",
        "CURATED.",
        "LIMITED.",
        "TIMELESS.",
        "STANDING_ON_BUSINESS_",
        "CONNECTION_ESTABLISHED_!"
    ]

    useEffect(() => {
        let pageLoaded = false
        let globeReady = false
        let exitTriggered = false

        // Prevent scroll while loading
        document.body.style.overflow = 'hidden'

        // Text cycling interval (runs crazy transitions every 280ms)
        const textInterval = setInterval(() => {
            setTextIndex((prev) => {
                if (prev < loadingTexts.length - 1) {
                    return prev + 1
                }
                return prev
            })
        }, 280)

        const startExitSequence = () => {
            if (exitTriggered) return
            exitTriggered = true

            if (loaderRef.current) {
                const tl = gsap.timeline({
                    onComplete: () => {
                        setLoading(false)
                        document.body.style.overflow = ''
                    }
                })

                // Text zoom out and rotate exit
                tl.to(textRef.current, {
                    scale: 0.88,
                    opacity: 0,
                    rotate: -2.5,
                    duration: 0.5,
                    ease: 'power3.in'
                })
                // White screen slides up with premium custom bezier curve
                .to(loaderRef.current, {
                    yPercent: -100,
                    duration: 1.05,
                    ease: 'power4.inOut'
                }, '-=0.3')
            }
        }

        const checkReady = () => {
            if (pageLoaded && globeReady) {
                // Wait briefly for the text to settle, then start exit slide
                setTimeout(startExitSequence, 1200)
            }
        }

        const handleLoad = () => {
            pageLoaded = true
            checkReady()
        }

        const handleGlobeReady = () => {
            globeReady = true
            checkReady()
        }

        window.addEventListener('globe-ready', handleGlobeReady)

        // React client-side mount is complete, DOM is fully interactive. Trigger handleLoad immediately.
        handleLoad()

        // Safety fallback: if globe-ready doesn't fire, trigger exit after 2.5s anyway
        const safetyTimeout = setTimeout(() => {
            pageLoaded = true
            globeReady = true
            checkReady()
        }, 2500)

        return () => {
            clearInterval(textInterval)
            clearTimeout(safetyTimeout)
            window.removeEventListener('globe-ready', handleGlobeReady)
            document.body.style.overflow = ''
        }
    }, [])

    if (!loading) return null

    return (
        <div ref={loaderRef} className="streetwear-custom-loader">
            <div ref={textRef} className="loader-text-container">
                <div className="loader-progress-tracker">
                    {String(Math.round(((textIndex + 1) / loadingTexts.length) * 100)).padStart(3, '0')}%
                </div>
                <h1 className="loader-crazy-text">
                    {loadingTexts[textIndex]}
                </h1>
                <div className="loader-glitch-bar" />
            </div>
        </div>
    )
}
