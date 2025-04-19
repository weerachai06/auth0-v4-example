import type { NextConfig } from 'next';
import createIntlPlugin from 'next-intl/plugin';

const withIntl = createIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

module.exports = withIntl(nextConfig);
