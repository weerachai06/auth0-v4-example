import { auth0, getLogoutPath } from '@/lib/auth0';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if user is authenticated
  let session;
  try {
    session = await auth0.getSession();

    // If no session, redirect to login
    if (!session) {
      redirect('/api/auth/login?returnTo=/profile');
    }
  } catch (error) {
    console.error('Failed to get session:', error);
    // Redirect to login on error
    redirect('/api/auth/login?returnTo=/profile');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation header for protected pages */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Protected Area</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:inline">
              Welcome, {session.user.name || session.user.email}
            </span>
            <a
              href={getLogoutPath()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
            >
              Logout
            </a>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
