'use client'

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { SplitText } from "gsap/dist/SplitText"
import { Draggable } from "gsap/dist/Draggable"
import { InertiaPlugin } from "gsap/dist/InertiaPlugin"
import { Flip } from "gsap/dist/Flip"
import { Physics2DPlugin } from "gsap/dist/Physics2DPlugin"

// Essential: Register globally at the top level
// This ensures plugins are available before any component renders
if (typeof window !== "undefined" && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin, Flip, Physics2DPlugin)
    gsap.ticker.lagSmoothing(1000, 16)

    // Set global defaults for that high-end "Gen Z" feel
    gsap.defaults({
        ease: "expo.out",
        duration: 1.2
    })
}

export default function GSAPProvider({ children }: { children: React.ReactNode }) {
    // useGSAP is the recommended way to handle GSAP in React/Next.js
    useGSAP(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        // Global ScrollTrigger refresh after initial render
        ScrollTrigger.refresh()
    }, [])

    return <>{children}</>
}
