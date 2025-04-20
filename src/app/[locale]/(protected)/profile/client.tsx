'use client';

import { use } from 'react';

interface ClientComponentProps {
  accessTokenPromise: Promise<{
    token: string;
    expiresAt: number;
  }>;
}

export default function ClientComponent({ accessTokenPromise }: ClientComponentProps) {
  const accessToken = use(accessTokenPromise);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Profile Page</h1>
      {accessToken.token}
      {/* <span className="break-all">{token}</span> */}
    </div>
  );
}
