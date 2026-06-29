'use client'

import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined' && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger)
}

interface ParallaxImageProps {
    src: string
    alt: string
    aspectRatio?: string
    className?: string
    drift?: number
}

export default function ParallaxImage({
    src,
    alt,
    aspectRatio = '3/4',
    className = '',
    drift = -100
}: ParallaxImageProps) {
    const container = useRef<HTMLDivElement>(null)
    const image = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        if (!container.current || !image.current) return

        // Entry animation (Scale down)
        gsap.fromTo(image.current.querySelector('img'),
            { scale: 1.15 },
            { scale: 1, duration: 2.5, ease: 'power2.out' }
        )

        // Scroll parallax
        gsap.to(image.current, {
            y: drift,
            ease: 'none',
            scrollTrigger: {
                trigger: container.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            }
        })
    }, { scope: container })

    return (
        <div
            ref={container}
            className={`luxury-image-container ${className}`}
            style={{ aspectRatio, position: 'relative', overflow: 'hidden' }}
        >
            <div ref={image} style={{ width: '100%', height: '125%', position: 'absolute', top: '0', left: '0' }}>
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="luxury-image"
                    quality={75}
                    style={{ objectFit: 'cover' }}
                />
            </div>
        </div>
    )
}
