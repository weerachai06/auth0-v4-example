import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || 'en';
  return {
    locale: locale || 'en',
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
