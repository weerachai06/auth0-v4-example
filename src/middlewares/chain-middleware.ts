import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware function type
 */
export type MiddlewareFunction = (
  request: NextRequest
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

export function chainMiddleware(configs: MiddlewareConfig[]) {
  return async function handler(request: NextRequest): Promise<NextResponse> {
    let finalResponse: NextResponse | null = null;

    for (const { middleware, matcher } of configs) {
      try {
        // If there's a matcher defined, check if the path matches
        if (matcher) {
          const matchFn = createMatcher(matcher);
          // Skip this middleware if the path doesn't match
          if (!matchFn(request.nextUrl.pathname)) {
            console.log(request.nextUrl.pathname);
            continue;
          }
        }

        // Execute the current middleware
        const response = await middleware(request);

        // If middleware didn't return a response, continue to next
        if (!response) {
          continue;
        }

        if (finalResponse) {
          // Merge headers from the previous response
          for (const [key, value] of finalResponse.headers) {
            response.headers.set(key, value);
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
