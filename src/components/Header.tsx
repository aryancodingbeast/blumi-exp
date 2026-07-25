'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signIn, signOut } from 'next-auth/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Menu, X } from 'lucide-react'

const MENU_LINKS = [
    { href: '/', label: 'STYLING CHAT', tag: 'AI STYLIST' },
    { href: '/shop', label: 'THE VAULT', tag: 'SHOP 1/1 PIECES' },
    { href: '/swipe', label: 'SWIPE', tag: 'FIND YOUR MATCH' },
    { href: '/closet', label: 'CLOSET', tag: 'YOUR PIECES' },
    { href: '/liked', label: 'LIKED', tag: 'SAVED HEAT' },
    { href: '/matches', label: 'MATCHES', tag: 'MUTUAL FITS' },
    { href: '/cart', label: 'CART', tag: 'CHECKOUT' },
    { href: '/orders', label: 'ORDERS', tag: 'TRACK DROPS' },
    { href: '/seller', label: 'SELLER HUB', tag: 'SOURCE & SELL' },
]

if (typeof window !== 'undefined' && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger)
}

interface HeaderProps {
    session: any
}

export default function Header({ session }: HeaderProps) {
    const pathname = usePathname()
    const headerRef = useRef<HTMLElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const menuTlRef = useRef<gsap.core.Timeline | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)

    /* ------------------------------------------------------------------ */
    /* Full-screen menu overlay: clip-path reveal + staggered link cascade */
    /* ------------------------------------------------------------------ */
    useGSAP(() => {
        const overlay = overlayRef.current
        if (!overlay) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const q = gsap.utils.selector(overlay)

        if (reduceMotion) {
            // Simple fade for reduced motion users
            menuTlRef.current = gsap.timeline({ paused: true })
                .set(overlay, { display: 'flex' })
                .to(overlay, { autoAlpha: 1, duration: 0.15, ease: 'none' })
            return
        }

        const tl = gsap.timeline({ paused: true })
        tl.set(overlay, { display: 'flex' })
            .fromTo(overlay,
                { autoAlpha: 0, clipPath: 'inset(0% 0% 100% 0%)' },
                { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power4.inOut' })
            .from(q('.menu-overlay-link'), {
                y: 46,
                opacity: 0,
                duration: 0.6,
                stagger: 0.05,
                ease: 'power3.out'
            }, '-=0.25')
            .from(q('.menu-overlay-footer'), {
                y: 18,
                opacity: 0,
                duration: 0.45,
                ease: 'power3.out'
            }, '-=0.4')

        menuTlRef.current = tl

        return () => {
            tl.kill()
        }
    }, { scope: overlayRef })

    const closeMenu = useCallback(() => {
        setMenuOpen(false)
        const tl = menuTlRef.current
        if (tl) {
            tl.timeScale(1.6).reverse()
        }
        document.body.style.overflow = ''
    }, [])

    const openMenu = useCallback(() => {
        setMenuOpen(true)
        const tl = menuTlRef.current
        if (tl) {
            tl.timeScale(1).play()
        }
        document.body.style.overflow = 'hidden'
    }, [])

    // Close on route change
    useEffect(() => {
        if (menuOpen) closeMenu()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    // Close on Escape + cleanup scroll lock on unmount
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && menuOpen) closeMenu()
        }
        window.addEventListener('keydown', onKey)
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [menuOpen, closeMenu])

    /* ------------------------------------------------------------------ */
    /* Nav stagger on mount + scroll-direction hide/reveal (fixed header). */
    /* ------------------------------------------------------------------ */
    useGSAP(() => {
        const header = headerRef.current
        if (!header) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        const q = gsap.utils.selector(header)

        // One-time nav reveal — logo then links cascade in
        gsap.from(q('.brutalist-r-logo, .nav-anchor-btn'), {
            y: -14,
            opacity: 0,
            duration: 0.7,
            stagger: 0.06,
            ease: 'power3.out'
        })

        // Magnetic interactive buttons using quickTo
        const magneticElements = q('.brutalist-r-logo, .nav-anchor-btn')
        magneticElements.forEach((el) => {
            const xTo = gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' })
            const yTo = gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' })

            const handleMouseMove = (e: Event) => {
                const mouseEvent = e as MouseEvent
                const rect = el.getBoundingClientRect()
                const relX = mouseEvent.clientX - (rect.left + rect.width / 2)
                const relY = mouseEvent.clientY - (rect.top + rect.height / 2)

                // Pull toward cursor by 20%
                xTo(relX * 0.2)
                yTo(relY * 0.2)
            }

            const handleMouseLeave = () => {
                xTo(0)
                yTo(0)
            }

            el.addEventListener('mousemove', handleMouseMove)
            el.addEventListener('mouseleave', handleMouseLeave)
        })

        // Hide on scroll-down, reveal on scroll-up
        const showAnim = gsap
            .from(header, {
                yPercent: -110,
                paused: true,
                duration: 0.35,
                ease: 'power2.out'
            })
            .progress(1)

        ScrollTrigger.create({
            start: 'top top',
            end: 'max',
            onUpdate: (self) => {
                if (self.direction === -1) {
                    showAnim.play()
                } else {
                    showAnim.reverse()
                }
            }
        })
    }, { scope: headerRef })

    return (
        <>
            <header ref={headerRef} className="streetwear-nav">
                <div className="nav-left">
                    {/* Stylized Brutalist Logo */}
                    <Link href="/" className="brutalist-r-logo" style={{ textDecoration: 'none' }}>
                        BLUMI
                    </Link>
                </div>

                <div className="nav-right">
                    <Link href="/" className={`nav-anchor-btn ${pathname === '/' ? 'active-link' : ''}`}>
                        <span className="desktop-nav-text">STYLING CHAT</span>
                        <span className="mobile-nav-text">CHAT</span>
                    </Link>

                    <Link href="/shop" className={`nav-anchor-btn ${pathname === '/shop' ? 'active-link' : ''}`}>
                        <span className="desktop-nav-text">THE VAULT</span>
                        <span className="mobile-nav-text">VAULT</span>
                    </Link>

                    <button
                        type="button"
                        className="nav-anchor-btn nav-menu-toggle"
                        onClick={menuOpen ? closeMenu : openMenu}
                        aria-expanded={menuOpen}
                        aria-controls="blumi-menu-overlay"
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {menuOpen ? <X size={15} aria-hidden="true" /> : <Menu size={15} aria-hidden="true" />}
                        <span className="desktop-nav-text">MENU</span>
                    </button>
                </div>
            </header>

            {/* Full-screen navigation overlay */}
            <div
                id="blumi-menu-overlay"
                ref={overlayRef}
                className="menu-overlay"
                role="dialog"
                aria-modal="true"
                aria-label="Site navigation"
            >
                <nav className="menu-overlay-nav" aria-label="Primary">
                    {MENU_LINKS.map((item, i) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`menu-overlay-link ${pathname === item.href ? 'active-link' : ''}`}
                            onClick={closeMenu}
                        >
                            <span className="menu-overlay-index">{String(i + 1).padStart(2, '0')}</span>
                            <span className="menu-overlay-label">{item.label}</span>
                            <span className="menu-overlay-tag">{item.tag}</span>
                        </Link>
                    ))}
                </nav>
                <div className="menu-overlay-footer">
                    <span className="menu-overlay-footer-brand">BLUMI — CIRCULAR FASHION, 1/1 PIECES</span>
                    {session ? (
                        <button type="button" className="menu-overlay-auth" onClick={() => signOut()}>
                            SIGN OUT
                        </button>
                    ) : (
                        <button type="button" className="menu-overlay-auth" onClick={() => signIn()}>
                            SIGN IN
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}
