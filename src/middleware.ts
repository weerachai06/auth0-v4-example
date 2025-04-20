import createI18nMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { auth0, authMiddleware } from './lib/auth0';
import { chainMiddleware } from './middlewares/chain-middleware';

// Supported languages
const locales = ['en', 'th', 'ja'];
const defaultLocale = 'en';

// Create the next-intl middleware
const intlMiddleware = createI18nMiddleware({
  locales,
  defaultLocale,
});

const protectedRouteMiddleware = async (request: NextRequest) => {
  const sessionData = await auth0.getSession();
  const currentUnixTime = Date.now() / 1000;

  const expiresAt = sessionData?.tokenSet.expiresAt ?? 0;
  if (!sessionData?.tokenSet.expiresAt || expiresAt < currentUnixTime) {
    return NextResponse.redirect(new URL('/api/auth/login', request.url));
  }

  return NextResponse.next();
};

export default chainMiddleware([
  { middleware: authMiddleware },
  { middleware: intlMiddleware, matcher: ['/((?!auth|api).*)'] },
  { middleware: protectedRouteMiddleware, matcher: ['/(en|th)/dashboard'] },
]);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
