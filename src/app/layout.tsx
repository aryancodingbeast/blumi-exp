import type { Metadata } from 'next';
import { Inter, Fraunces, Caveat, Caveat_Brush } from 'next/font/google';
import '@/styles/globals.css';
import { CartProvider } from '@/components/CartContext';
import HeaderWrapper from '@/components/HeaderWrapper';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const fraunces = Fraunces({
    subsets: ['latin'],
    variable: '--font-fraunces',
    display: 'swap',
});

const caveat = Caveat({
    subsets: ['latin'],
    variable: '--font-caveat',
    weight: ['400', '500', '600', '700'],
    display: 'swap',
});

const caveatBrush = Caveat_Brush({
    subsets: ['latin'],
    weight: '400',
    variable: '--font-caveat-brush',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'RevClo — Curated Pre-Loved Fashion Marketplace',
    description:
        'Discover Certified Fits, archive brands, and verified closets on RevClo. Buy and sell pre-loved fashion with AI Trust Scores.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body
                className={`${inter.variable} ${fraunces.variable} ${caveat.variable} ${caveatBrush.variable} revclo-body`}
            >
                <CartProvider>
                    <div className="revclo-app-shell">
                        <main className="revclo-main-canvas">{children}</main>
                        <HeaderWrapper />
                    </div>
                </CartProvider>
            </body>
        </html>
    );
}
