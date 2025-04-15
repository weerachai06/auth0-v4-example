import { type NextRequest } from 'next/server';
import { authMiddleware } from './lib/auth0';

export async function middleware(request: NextRequest) {
  const authResponse = authMiddleware(request);
  return authResponse;
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
