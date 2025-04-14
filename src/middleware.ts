import { NextResponse, type NextRequest } from 'next/server';
import { auth0 } from './lib/auth0';

export async function middleware(request: NextRequest) {
  try {
    const authResponse = await auth0.middleware(request);

    // if path starts with /auth, let the auth middleware handle it
    //   if (request.nextUrl.pathname.startsWith("/auth")) {
    //     return authResponse;
    //   }

    // call any other middleware here

    return authResponse;
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Redirect to error page or login on auth failure
    return NextResponse.redirect(new URL('/error', request.url));
  }
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
