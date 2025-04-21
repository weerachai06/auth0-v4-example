import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { SessionData } from '@auth0/nextjs-auth0/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Now, we need to extend the Auth0Client class to add a custom refreshAccessToken method.
 * This method will force a refresh of the access token by setting the expiresAt property to 0.
 * @see {@link https://github.com/auth0/nextjs-auth0/issues/1884#issuecomment-2641728576}
 */
class MyAuth0Client extends Auth0Client {
  async refreshAccessToken(): Promise<{ token: string; expiresAt: number }> {
    const existingSession = await this.getSession();
    if (!existingSession) {
      throw new Error('The user is not authenticated.');
    }

    const sessionToForceTokenRefresh = {
      ...existingSession,
      tokenSet: {
        ...existingSession.tokenSet,
        expiresAt: 0,
      },
    } satisfies SessionData;
    await this.updateSession(sessionToForceTokenRefresh);
    return this.getAccessToken();
  }
}

export const auth0 = new MyAuth0Client({
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl:
    process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_BASE_URL
      : 'http://localhost:3000',
  secret: process.env.AUTH0_SECRET,
  domain: process.env.AUTH0_DOMAIN,
  routes: {
    login: '/api/auth/login',
    callback: '/api/auth/callback',
    logout: '/api/auth/logout',
    backChannelLogout: '/api/auth/logout/callback',
  },
  authorizationParameters: {
    scope: 'openid profile email offline_access',
    audience: 'https://weerachai.us.auth0.com/api/v2/',
  },
  async onCallback(error, context, session) {
    // redirect the user to a custom error page
    if (error) {
      console.error(`Error during Auth0 callback for [${session?.user.sub ?? 'unknow'}]:`, error);
      return NextResponse.redirect(
        new URL(`/error?error=${error.message}`, process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    // complete the redirect to the provided returnTo URL
    return NextResponse.redirect(
      new URL(context.returnTo || '/', process.env.NEXT_PUBLIC_BASE_URL)
    );
  },
});

async function handleAuth(request: NextRequest) {
  try {
    const authResponse = await auth0.middleware(request);
    return authResponse;
  } catch (error) {
    if (error instanceof Error) {
      const returnTo = request.nextUrl.pathname + request.nextUrl.search;
      const redirectTo = new URL('/api/auth/logout', request.url);
      redirectTo.searchParams.set('returnTo', returnTo);
      return NextResponse.redirect(new URL(redirectTo.toString(), request.url));
    }
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

export async function authMiddleware(request: NextRequest) {
  return handleAuth(request);
}

export const getLogoutPath = () => {
  const url = new URL('/api/auth/clear-session', process.env.NEXT_PUBLIC_BASE_URL);

  return url.toString();
};
