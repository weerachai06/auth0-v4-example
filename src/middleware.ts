import createI18nMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { auth0 } from './lib/auth0';

// Supported languages
const locales = ['en', 'th', 'ja'];
const defaultLocale = 'en';

// Create the next-intl middleware
const intlMiddleware = createI18nMiddleware({
  locales,
  defaultLocale,
});

export async function middleware(request: NextRequest) {
  const authResponse = await auth0.middleware(request);

  // call any other middleware here
  const intlRes = intlMiddleware(request);

  // add any headers from auth to the response
  for (const [key, value] of authResponse.headers) {
    intlRes.headers.set(key, value);
  }

  return intlRes;
}

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
