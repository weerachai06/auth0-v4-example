import createI18nMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from './lib/auth0';
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
  console.log(request.nextUrl.pathname);
  // try {
  //   const tokenSet = await auth0.getAccessToken();
  //   if (tokenSet.token) {
  //     // If the token is available, continue to the next middleware
  //     return NextResponse.next();
  //   }
  // } catch (error) {
  //   console.error('Error getting access token:', error);
  //   const pathname = request.nextUrl.pathname;
  //   const searchParams = request.nextUrl.searchParams;
  //   const returnTo = `${pathname}${searchParams}`;
  //   // Redirect to the login page if the token is not available
  //   return NextResponse.redirect(
  //     new URL(`/api/auth/login?returnTo=${returnTo}`, process.env.NEXT_PUBLIC_BASE_URL)
  //   );
  // }

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
