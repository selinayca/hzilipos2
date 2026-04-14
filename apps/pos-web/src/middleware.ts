/**
 * Next.js middleware — protects POS routes.
 *
 * Strategy:
 *   - Reads `hizlipos-auth` key from localStorage via cookie check.
 *   - If `isAuthenticated` is false/missing → redirect to /login.
 *   - The actual token validity is enforced by the API (401 → refresh → re-login).
 *
 * We keep this lightweight because the real auth guard is the JWT on the backend.
 * The middleware just prevents the UI from loading for clearly unauthenticated users.
 */
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico', '/manifest.json', '/sw.js', '/icons'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check persisted auth state (Zustand persist writes to localStorage,
  // which isn't available in middleware — so we use a lightweight auth cookie
  // that the client sets on login).
  const authCookie = req.cookies.get('pos_authenticated');
  if (!authCookie?.value || authCookie.value !== '1') {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
