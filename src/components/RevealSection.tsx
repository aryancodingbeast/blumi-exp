'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined' && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger)
}

export default function RevealSection({ children }: { children: React.ReactNode }) {
    const sectionRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const root = sectionRef.current
        if (!root) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        const items = root.querySelectorAll(':scope > *, :scope [data-reveal-item]')
        if (items.length > 0) {
            gsap.fromTo(
                items,
                { y: 40, opacity: 0, scale: 0.985 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.9,
                    ease: 'power3.out',
                    stagger: 0.08,
                    scrollTrigger: {
                        trigger: root,
                        start: 'top 82%',
                        once: true
                    }
                }
            )
            return
        }

        gsap.fromTo(
            root,
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: root,
                    start: 'top 85%',
                    once: true
                }
            }
        )
    }, { scope: sectionRef })

    return <div ref={sectionRef}>{children}</div>
}
