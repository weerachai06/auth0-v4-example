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
export const createMatcher = (matchers: string | string[]) => {
  // Convert single matcher to array if needed
  const matcherArray = Array.isArray(matchers) ? matchers : [matchers];

  // Create RegExp objects from matcher strings
  const patterns = matcherArray.map(matcher => new RegExp(matcher));

  // Function that tests a path against all patterns
  return (path: string): boolean => {
    return patterns.some(pattern => pattern.test(path));
  };
};

/**
 * Merges headers from two responses
 */
export function mergeHeaders(target: NextResponse, source: NextResponse): NextResponse {
  // Create a new response with the target's properties
  const mergedResponse = NextResponse.next({
    status: target.status,
    statusText: target.statusText,
    headers: new Headers(target.headers),
  });

  // Add headers from source that don't exist in target
  for (const [key, value] of source.headers) {
    if (!mergedResponse.headers.has(key)) {
      mergedResponse.headers.set(key, value);
    }
  }

  return mergedResponse;
}

/**
 * Creates a request from a response to pass to the next middleware
 */
export function createNextRequest(request: NextRequest, response: NextResponse): NextRequest {
  const headers = new Headers(response.headers);

  return new NextRequest(request.url, {
    method: request.method,
    headers: headers,
    body: response.body,
  });
}

/**
 * Chains multiple middleware functions with matcher support
 */
export function chainMiddleware(configs: MiddlewareConfig[]) {
  return async function (request: NextRequest): Promise<NextResponse> {
    let currentRequest: NextRequest = request;
    let lastResponse: NextResponse | undefined;

    for (const { middleware, matcher } of configs) {
      try {
        // Skip middleware if matcher doesn't match
        if (matcher) {
          const matchFn = createMatcher(matcher);
          if (!matchFn(request.nextUrl.pathname)) {
            continue;
          }
        }

        // Execute the middleware with current request
        const response = await middleware(currentRequest);

        // If middleware didn't return a response, continue with unchanged request
        if (!response) {
          continue;
        }

        // Keep track of the last response
        if (!lastResponse) {
          lastResponse = response;
        } else {
          // Merge the current response with the last one
          lastResponse = mergeHeaders(response, lastResponse);
        }

        // Update the request for the next middleware
        currentRequest = createNextRequest(request, response);
      } catch (error) {
        console.error('Middleware error:', error);
      }
    }

    // Return the final merged response or a default next response
    return lastResponse || NextResponse.next();
  };
}
