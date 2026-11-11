import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Allow seamless access to all RevClo marketplace routes (both authenticated via NextAuth and instant demo profile)
    const sessionToken =
        request.cookies.get('next-auth.session-token')?.value ||
        request.cookies.get('__Secure-next-auth.session-token')?.value;

    const isLoginPage = request.nextUrl.pathname === '/login';

    if (isLoginPage && sessionToken) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/login'],
};
