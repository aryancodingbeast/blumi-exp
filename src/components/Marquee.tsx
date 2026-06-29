'use client'

import React, { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export default function Marquee({ text = "LIMITED DROPS /// NEW ARRIVALS /// GEN Z CURATION /// " }) {
    const container = useRef<HTMLDivElement>(null)
    const inner = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        if (!container.current || !inner.current) return

        const width = inner.current.offsetWidth

        // Clone for seamless loop
        const clone = inner.current.cloneNode(true)
        container.current.appendChild(clone)

        gsap.to(container.current.children, {
            x: -width,
            ease: "none",
            duration: 10, // Fast ticker
            repeat: -1
        })
    }, { scope: container })

    return (
        <div style={{
            width: '100%',
            overflow: 'hidden',
            background: '#FFFF00', // Acid Yellow
            color: 'black',
            borderBottom: '2px solid black',
            padding: '0.8rem 0',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            fontSize: '1rem',
            textTransform: 'uppercase'
        }}>
            <div ref={container} style={{ display: 'inline-flex' }}>
                <div ref={inner} style={{ display: 'inline-block', paddingRight: '2rem' }}>
                    {text.repeat(4)}
                </div>
            </div>
        </div>
    )
}
