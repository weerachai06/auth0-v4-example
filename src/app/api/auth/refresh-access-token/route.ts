import { auth0 } from '@/lib/auth0';

export const GET = async () => {
  try {
    // Refresh the access token
    const session = await auth0.getAccessToken();
    return Response.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    return new Response('Error getting session', { status: 500 });
  }
};
