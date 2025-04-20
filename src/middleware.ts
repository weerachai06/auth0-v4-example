import createI18nMiddleware from 'next-intl/middleware';
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

const middleware = chainMiddleware([
  {
    // Auth middleware - apply to all except API routes
    middleware: authMiddleware,
  },
  {
    // i18n middleware - apply to all except API routes
    middleware: intlMiddleware,
    matcher: ['^(?!.*/api/).*$'],
  },
]);

export default middleware;

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
