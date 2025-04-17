'use client';

import { getAccessToken } from '@auth0/nextjs-auth0';
import React, { useState } from 'react';

export default function ClientComponent() {
  const [token, setToken] = useState('');

  React.useEffect(() => {
    const fetchAccessToken = async () => {
      const data = await getAccessToken();
      setToken(data);
    };
    fetchAccessToken();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Profile Page</h1>
      <span className="break-all">{token}</span>
    </div>
  );
}
