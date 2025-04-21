import '@/app/globals.css';
import { Auth0Provider } from '@auth0/nextjs-auth0';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { getSafeSession } from './actions';

// Font setup
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Locale validation
const locales = ['en', 'th', 'ja'];

export const metadata: Metadata = {
  title: 'Internationalized App with Auth0',
  description: 'Next.js app with Auth0 and internationalization',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSafeSession();
  // Validate the locale
  if (!locales.includes(locale)) notFound();

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Auth0Provider user={session?.user}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
