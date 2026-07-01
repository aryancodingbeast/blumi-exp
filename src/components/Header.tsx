'use client'

import Link from 'next/link'
import { signIn, signOut } from 'next-auth/react'
import HeaderCart from './HeaderCart'
import { Repeat2, Heart, Shirt } from 'lucide-react'

interface HeaderProps {
    session: any
}

export default function Header({ session }: HeaderProps) {
    return (
        <header className="streetwear-nav">
            <div className="nav-left">
                {/* Stylized Red Brutalist R Logo */}
                <Link href="/" className="brutalist-r-logo">
                    R
                </Link>
            </div>
            
            <div className="nav-right">
                <Link href="/swipe" className="nav-anchor-btn nav-swipe-btn">
                    <Repeat2 size={14} className="nav-icon" />
                    <span className="desktop-nav-text">SWIPE</span>
                    <span className="mobile-nav-text">SWIPE</span>
                </Link>
                
                {session ? (
                    <>
                        <Link href="/closet" className="nav-anchor-btn">
                            <Shirt size={14} className="nav-icon" />
                            <span className="desktop-nav-text">MY CLOSET</span>
                            <span className="mobile-nav-text">CLOSET</span>
                        </Link>

                        <Link href="/matches" className="nav-anchor-btn">
                            <span className="desktop-nav-text">MATCHES</span>
                            <span className="mobile-nav-text">MATCHES</span>
                        </Link>

                        <Link href="/liked" className="nav-anchor-btn">
                            <Heart size={14} className="nav-icon" />
                            <span className="desktop-nav-text">LIKED</span>
                            <span className="mobile-nav-text">LIKED</span>
                        </Link>
                        
                        <HeaderCart />
                        <button 
                            onClick={() => signOut()}
                            className="nav-anchor-btn"
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: 0, 
                                fontFamily: 'inherit', 
                                fontSize: 'inherit', 
                                color: 'inherit' 
                            }}
                        >
                            LOGOUT
                        </button>
                    </>
                ) : (
                    <>
                        <HeaderCart />
                        <button 
                            onClick={() => signIn('google')}
                            className="nav-anchor-btn"
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: 0, 
                                fontFamily: 'inherit', 
                                fontSize: 'inherit', 
                                color: 'inherit' 
                            }}
                        >
                            <span className="desktop-nav-text">SIGNUP/IN</span>
                            <span className="mobile-nav-text">LOGIN</span>
                        </button>
                    </>
                )}
            </div>
        </header>
    )
}
