'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined' && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger)
}

export default function SmoothScrollManager({ children }: { children: React.ReactNode }) {
    const container = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const horizontalContainer = document.querySelector('.horizontal-scroll-container')
        if (horizontalContainer) {
            gsap.to(horizontalContainer, {
                x: () => -(horizontalContainer.scrollWidth - window.innerWidth),
                ease: 'none',
                scrollTrigger: {
                    trigger: horizontalContainer.parentElement,
                    start: 'top center',
                    end: 'bottom top',
                    scrub: 2.5, // Increased from 1 for much smoother, heavier tracking
                }
            })
        }

        gsap.utils.toArray('[data-parallax]').forEach((el: any) => {
            const depth = el.dataset.parallax || -150
            gsap.to(el, {
                y: depth,
                ease: 'none',
                scrollTrigger: {
                    trigger: el,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 2 // Increased scrub for weight
                }
            })
        })

        setTimeout(() => ScrollTrigger.refresh(), 200)
    }, { scope: container })

    return <div ref={container}>{children}</div>
}
