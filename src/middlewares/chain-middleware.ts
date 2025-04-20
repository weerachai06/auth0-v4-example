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
export type MiddlewareConfig = {
  middleware: MiddlewareFunction;
  matcher?: string | string[];
};

/**
 *
 * @param matchers - A string or an array of strings representing the patterns to match against.
 * @returns A function that takes a path and returns true if it matches any of the patterns.
 */
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

/**
 *
 * @description This function chains multiple middleware functions together, allowing you to apply them in sequence.
 * @param configs - An array of middleware configurations, each containing a middleware function and an optional matcher.
 * @param configs.middleware - The middleware function to execute
 * @param configs.matcher - An optional string or array of strings representing the patterns to match against.
 * @returns A function that takes a NextRequest and returns a NextResponse.
 * @example
 * ```ts
 * export default chainMiddleware([
 *  { middleware: authMiddleware },
 *  { middleware: intlMiddleware, matcher: ['/((?!auth|api).*)'] },
 *  { middleware: protectedRouteMiddleware, matcher: ['/(en|th)/dashboard'] },
 * ]);
 * ```
 * @remark
 * - If a middleware returns a response, it will be used as the final response.
 * - If a middleware doesn't return a response, the next middleware in the chain will be
 */
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
