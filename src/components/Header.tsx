'use client'

import Link from 'next/link'
import { signIn, signOut } from 'next-auth/react'
import HeaderCart from './HeaderCart'

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
                <Link href="/shop" className="nav-anchor-btn">
                    SHOP
                </Link>
                
                {session ? (
                    <>
                        <Link href="/orders" className="nav-anchor-btn">
                            <span className="desktop-nav-text">MY CLOSET</span>
                            <span className="mobile-nav-text">CLOSET</span>
                        </Link>
                        
                        <Link href="/seller" className="nav-anchor-btn">
                            {session.user?.role === 'SELLER' ? (
                                <>
                                    <span className="desktop-nav-text">SELLER HUB</span>
                                    <span className="mobile-nav-text">SELLER</span>
                                </>
                            ) : (
                                <>
                                    <span className="desktop-nav-text">BECOME A SELLER</span>
                                    <span className="mobile-nav-text">SELLER</span>
                                </>
                            )}
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
