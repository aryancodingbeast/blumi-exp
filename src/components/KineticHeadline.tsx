'use client'

import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface KineticHeadlineProps {
    children: string
    className?: string
    style?: React.CSSProperties
    stagger?: number
    delay?: number
}

export default function KineticHeadline({
    children,
    className,
    style,
    stagger = 0.12,
    delay = 0
}: KineticHeadlineProps) {
    const container = useRef<HTMLHeadingElement>(null)
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
    const [words] = useState(() => children.split(' '))
    const [mounted, setMounted] = useState(false)

    // Ensure we only animate after hydration
    useEffect(() => {
        setMounted(true)
    }, [])

    useGSAP(() => {
        if (!mounted || !container.current) return

        const wordInners = wordRefs.current.filter(Boolean)
        if (wordInners.length === 0) return

        // Set initial state
        gsap.set(wordInners, {
            yPercent: 120,
            skewY: 6,
        })

        // Animate to final state
        gsap.to(wordInners, {
            yPercent: 0,
            skewY: 0,
            duration: 2.2,
            ease: 'power4.out',
            stagger: stagger,
            delay: delay,
        })
    }, { scope: container, dependencies: [mounted, stagger, delay] })

    return (
        <h1 ref={container} className={className} style={{ ...style, position: 'relative' }}>
            {words.map((word, index) => (
                <span
                    key={index}
                    style={{
                        display: 'inline-block',
                        overflow: 'hidden',
                        verticalAlign: 'top',
                    }}
                >
                    <span
                        ref={(el) => { wordRefs.current[index] = el }}
                        style={{
                            display: 'inline-block',
                            transform: mounted ? undefined : 'translateY(120%) skewY(6deg)',
                        }}
                    >
                        {word}{index < words.length - 1 ? '\u00A0' : ''}
                    </span>
                </span>
            ))}
        </h1>
    )
}
