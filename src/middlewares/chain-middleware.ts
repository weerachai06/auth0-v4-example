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

const createNextRequest = (request: NextRequest, response: NextResponse) => {
  for (const [key, value] of response.headers) {
    request.headers.set(key, value);
  }

  const newRequest = new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  return newRequest;
};

export function chainMiddleware(configs: MiddlewareConfig[]) {
  return async function handler(request: NextRequest): Promise<NextResponse> {
    let currentRequest = request;
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
        const response = await middleware(currentRequest);

        // If middleware didn't return a response, continue to next
        if (!response) {
          continue;
        }

        // Store the response
        finalResponse = response;

        // Create a new request with merged headers for next middleware
        currentRequest = createNextRequest(request, response);
      } catch (error) {
        console.error('Error in middleware:', error);
      }
    }

    // Return the final response or default to NextResponse.next()
    return finalResponse || NextResponse.next();
  };
}
