import createI18nMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
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

// const createNextRequest = (request: NextRequest, response: NextResponse) => {
//   for (const [key, value] of response.headers) {
//     request.headers.set(key, value);
//   }

//   const newRequest = new NextRequest(request.url, {
//     method: request.method,
//     headers: request.headers,
//     body: request.body,
//   });

//   return newRequest;
// };

// export async function middleware(request: NextRequest) {
//   const authResponse = await auth0.middleware(request);

//   const newRequest = createNextRequest(request, authResponse);

//   if (request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.startsWith('/auth')) {
//     return authResponse;
//   }

//   const res = intlMiddleware(newRequest);

//   return res;
// }

const customMiddleware = (request: NextRequest) => {
  // Handle the request and response here
  // For example, you can log the request or modify headers
  // const response = await authMiddleware(request);
  // return response;

  const response = intlMiddleware(request);
  return response;
};

// const middleware = chainMiddleware([
//   {
//     // Auth middleware - apply to all except API routes
//     middleware: authMiddleware,
//   },
//   {
//     // i18n middleware - apply to all except API routes and startWith '/auth'
//     middleware: customMiddleware,
//     matcher: ['/((?!auth|api).*)'],
//   },
// ]);

export default chainMiddleware([
  { middleware: authMiddleware },
  { middleware: customMiddleware, matcher: ['/((?!auth|api).*)'] },
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
