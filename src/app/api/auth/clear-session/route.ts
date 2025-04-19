import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Server action to clear auth cookies
async function clearAuthCookies() {
  // Get the cookie store
  const cookieStore = await cookies();

  // List of auth cookies to clear
  const authCookies = ['kpc_jwt'];

  // Delete each cookie
  for (const cookieName of authCookies) {
    if (cookieStore.has(cookieName)) {
      cookieStore.delete(cookieName);
    }
  }

  return true;
}

export const GET = async (req: NextRequest) => {
  await clearAuthCookies();

  const returnTo = req.nextUrl.searchParams.get('redirectTo') || '/';
  console.log(returnTo);

  const redirectUrl = new URL(returnTo, process.env.NEXT_PUBLIC_BASE_URL);

  // Add a small delay to ensure cookies are cleared before redirect
  await new Promise(resolve => setTimeout(resolve, 100));

  //  Redirect to the specified URL, or the home page if not specified
  return Response.redirect(redirectUrl.toString(), 302);
};
