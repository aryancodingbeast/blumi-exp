import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    // Check for NextAuth session cookies (handles both dev http and prod secure https tokens)
    const sessionToken = request.cookies.get('authjs.session-token')?.value || 
                         request.cookies.get('__Secure-authjs.session-token')?.value ||
                         request.cookies.get('next-auth.session-token')?.value ||
                         request.cookies.get('__Secure-next-auth.session-token')?.value

    const isProtectedPage = pathname.startsWith('/checkout') || pathname.startsWith('/orders')

    if (isProtectedPage && !sessionToken) {
        const callbackUrl = encodeURIComponent(pathname)
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/checkout/:path*', '/orders/:path*']
}
