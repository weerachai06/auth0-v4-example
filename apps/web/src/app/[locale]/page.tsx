import { useTranslations } from 'next-intl';

import { SessionData } from '@auth0/nextjs-auth0/types';
import Link from 'next/link';
import LanguageSwitcher from '../_components/LanguageSwitcher';
import { getSafeSession } from './actions';

const getLoginUrl = (returnTo: string = '/') => {
  const url = new URL('/api/auth/login', process.env.NEXT_PUBLIC_BASE_URL);
  url.searchParams.set('returnTo', returnTo);
  return url.toString();
};

const getLogoutUrl = () => {
  const url = new URL('/api/auth/logout', process.env.NEXT_PUBLIC_BASE_URL);
  url.searchParams.set('returnTo', `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/clear-session`);
  return url.toString();
};

export default async function Home() {
  // Get user session
  const session = await getSafeSession();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Next.js + Auth0 + next-intl</h1>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {session?.user ? (
              <a
                href={getLogoutUrl()}
                className="text-sm px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </a>
            ) : (
              <a
                href={getLoginUrl()}
                className="text-sm px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Login
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <IntlHome user={session?.user} />
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Next.js + Auth0 + next-intl Example
        </div>
      </footer>
    </div>
  );
}

// Separate client component for translations
function IntlHome({ user }: { user?: SessionData['user'] }) {
  const t = useTranslations('Index');
  const nav = useTranslations('Navigation');

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">{t('title')}</h2>
      <p>{t('description')}</p>

      {user ? (
        <div className="bg-white dark:bg-gray-800 p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Welcome, {user.name || user.email}</h3>
          <p>You are logged in!</p>

          <div className="mt-4">
            <Link
              href="/profile"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {nav('profile')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Welcome, Guest</h3>
          <p>Please log in to access your profile.</p>
        </div>
      )}
    </div>
  );
}
