'use server';

import { auth0 } from '@/lib/auth0';

export const getSafeSession = async () => {
  try {
    return await auth0.getSession();
  } catch {
    return null;
  }
};
