import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextResponse } from 'next/server';

export const auth0 = new Auth0Client({
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
