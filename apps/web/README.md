# Next.js Auth0 v4 Integration Guide

This guide demonstrates how to integrate Auth0 authentication with Next.js App Router, internationalization, and protected routes.

## Table of Contents
- [Next.js Auth0 v4 Integration Guide](#nextjs-auth0-v4-integration-guide)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Prerequisites](#prerequisites)
  - [Auth0 Setup](#auth0-setup)
    - [1. Create an Auth0 Application](#1-create-an-auth0-application)
    - [2. Configure Auth0 Application Settings](#2-configure-auth0-application-settings)
    - [3. Create an API (Optional, for Access Tokens)](#3-create-an-api-optional-for-access-tokens)
  - [Project Setup](#project-setup)
    - [1. Install Dependencies](#1-install-dependencies)
    - [2. Environment Configuration](#2-environment-configuration)
    - [3. Create Custom Auth0 Client](#3-create-custom-auth0-client)
    - [4. Create Middleware Chain Helper](#4-create-middleware-chain-helper)
    - [5. Configure App Middleware](#5-configure-app-middleware)
  - [Key Features](#key-features)
    - [Protected Routes](#protected-routes)
    - [Token Management](#token-management)
    - [Internationalization](#internationalization)
    - [Error Handling](#error-handling)
  - [Troubleshooting](#troubleshooting)
    - [Session Not Found](#session-not-found)
    - [Middleware Not Running](#middleware-not-running)
    - [Token Refresh Issues](#token-refresh-issues)
  - [Additional Resources](#additional-resources)

## Overview

This project showcases:

- Auth0 v4 SDK integration with Next.js App Router
- Custom Auth0 client with token refresh capabilities
- Multi-language support using next-intl
- Middleware chaining for auth and internationalization
- Protected routes with custom middleware
- TypeScript implementation

## Prerequisites

Before you begin, you'll need:
- Node.js 18.17.0 or higher
- An Auth0 account
- Basic knowledge of Next.js and React

## Auth0 Setup

### 1. Create an Auth0 Application

1. Sign up or log in to [Auth0](https://auth0.com/)
2. Navigate to **Applications** → **Create Application**
3. Select **Regular Web Application**
4. Name your application (e.g., "Next.js App Router")
5. Click **Create**

### 2. Configure Auth0 Application Settings

In the application settings:

- **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
- **Allowed Logout URLs**: `http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:3000`
- **Token Endpoint Authentication Method**: `Post`

### 3. Create an API (Optional, for Access Tokens)

1. Navigate to **APIs** → **Create API**
2. Set **Name** (e.g., "Next.js API")
3. Set **Identifier** (e.g., `https://your-domain.us.auth0.com/api/v2/`)
4. Click **Create**

## Project Setup

### 1. Install Dependencies

```bash
# Install Auth0 SDK and next-intl
npm install @auth0/nextjs-auth0@v4 next-intl
```

### 2. Environment Configuration

Create a .env.local file:

```env
# Auth0 Configuration
AUTH0_SECRET='use_a_long_random_string_here'
AUTH0_DOMAIN='your-auth0-tenant.us.auth0.com'
AUTH0_CLIENT_ID='your_auth0_client_id'
AUTH0_CLIENT_SECRET='your_auth0_client_secret'
NEXT_PUBLIC_BASE_URL='http://localhost:3000'
```

### 3. Create Custom Auth0 Client

Create the Auth0 client with a custom token refresh method:

```typescript
// src/lib/auth0.ts
import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { SessionData } from '@auth0/nextjs-auth0/types';
import { NextRequest, NextResponse } from 'next/server';

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
  appBaseUrl: process.env.NEXT_PUBLIC_BASE_URL,
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
    audience: 'https://your-domain.us.auth0.com/api/v2/', // Optional
  },
  onCallback(error, context, session) {
    if (error) {
      return NextResponse.redirect(
        new URL(`/error?error=${error.message}`, process.env.NEXT_PUBLIC_BASE_URL)
      );
    }
    return NextResponse.redirect(
      new URL(context.returnTo || '/', process.env.NEXT_PUBLIC_BASE_URL)
    );
  },
});

// Error handling middleware wrapper
export async function authMiddleware(request: NextRequest) {
  try {
    return await auth0.middleware(request);
  } catch (error) {
    if (
      error instanceof Error &&
      (error as { code?: string }).code === 'ERR_JWE_DECRYPTION_FAILED'
    ) {
      const returnTo = request.nextUrl.pathname + request.nextUrl.search;
      const redirectTo = new URL('/api/auth/login', request.url);
      redirectTo.searchParams.set('returnTo', returnTo);
      return NextResponse.redirect(redirectTo);
    }
    return NextResponse.redirect(new URL('/error', request.url));
  }
}
```

### 4. Create Middleware Chain Helper

```typescript
// src/middlewares/chain-middleware.ts
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

/**
 * Middleware function type
 */
export type MiddlewareFunction = (
  request: NextRequest,
  event?: NextFetchEvent
) => Promise<NextResponse | undefined> | NextResponse | undefined;

/**
 * Middleware configuration with matcher options
 */
export interface MiddlewareConfig {
  middleware: MiddlewareFunction;
  matcher?: string | string[];
}

const createMatcher = (matchers: string | string[]) => {
  // Convert single matcher to array if needed
  const matcherArray = Array.isArray(matchers) ? matchers : [matchers];

  // Create RegExp objects from matcher strings
  const patterns = matcherArray.map(matcher => new RegExp(`^${matcher}$`));

  // Function that tests a path against all patterns
  return (path: string): boolean => {
    return patterns.every(pattern => pattern.test(path));
  };
};


export function chainMiddleware(configs: MiddlewareConfig[]) {
  return async function handler(
    request: NextRequest,
    event: NextFetchEvent
  ): Promise<NextResponse> {
    let finalResponse: NextResponse | null = null;

    for (const { middleware, matcher } of configs) {
      try {
        // If there's a matcher defined, check if the path matches
        if (matcher) {
          const matchFn = createMatcher(matcher);
          // Skip this middleware if the path doesn't match
          if (!matchFn(request.nextUrl.pathname)) {
            continue;
          }
        }

        // Execute the current middleware
        const response = await middleware(request, event);

        // If middleware didn't return a response, continue to next
        if (!response) {
          continue;
        }

        if (finalResponse) {
          // Merge headers from the current response into the final response (previous headers)
          for (const [key, value] of response.headers) {
            finalResponse.headers.set(key, value);
          }
        }
        // Store the response
        finalResponse = response;
      } catch (error) {
        console.error('Error in middleware:', error);
      }
    }

    // Return the final response or default to NextResponse.next()
    return finalResponse || NextResponse.next();
  };
}
```

### 5. Configure App Middleware

```typescript
// src/middleware.ts
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

// Protected route middleware
const protectedRouteMiddleware = async (request: NextRequest) => {
  try {
    const tokenSet = await auth0.getAccessToken();
    if (tokenSet.token) {
      return NextResponse.next();
    }
  } catch (error) {
    const pathname = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams;
    const returnTo = `${pathname}${searchParams}`;
    return NextResponse.redirect(
      new URL(`/api/auth/login?returnTo=${returnTo}`, process.env.NEXT_PUBLIC_BASE_URL)
    );
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
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
```

## Key Features

### Protected Routes

Routes can be protected either through middleware (for entire directories) or in the page component itself. The middleware approach is great for entire sections of your site, while the in-component approach allows for more granular control.

### Token Management

The custom Auth0 client includes a `refreshAccessToken` method to force token refresh when needed. This is useful when you need a fresh token for API calls.

### Internationalization

The setup supports multiple languages through next-intl, with language selection in the URL path.

### Error Handling

The auth middleware includes robust error handling for common Auth0 issues, such as decryption failures.

## Troubleshooting

### Session Not Found

If you're getting "user not authenticated" errors:
- Check that your Auth0 configuration is correct
- Verify that cookies are being properly set (check browser inspector)
- Ensure the Auth0 secret is consistent

### Middleware Not Running

If your middleware chain isn't working properly:
- Check the matcher patterns to ensure they match your routes
- Look for errors in the server console
- Try simplifying the chain to isolate the issue

### Token Refresh Issues

If you're having problems with access tokens:
- Ensure your Auth0 API is properly configured
- Check that the audience parameter matches your API identifier
- Verify that offline_access is included in your scopes

## Additional Resources

- [Auth0 Next.js SDK Documentation](https://github.com/auth0/nextjs-auth0)
- [Auth0 v4 Migration Guide](https://github.com/auth0/nextjs-auth0/blob/main/V4_MIGRATION_GUIDE.md)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)