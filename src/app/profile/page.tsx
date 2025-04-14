'use client';

import { useUser } from '@auth0/nextjs-auth0';

export default function ProfilePage() {
  const user = useUser();
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Profile Page</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  );
}
