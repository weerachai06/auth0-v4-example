'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';

    // Navigate to the new locale path
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="locale-select" className="text-sm">
        {t('label')}:
      </label>
      <select
        id="locale-select"
        value={locale}
        onChange={e => handleLocaleChange(e.target.value)}
        className="text-sm border rounded p-1 bg-white dark:bg-gray-800"
      >
        <option value="en">{t('locale', { locale: 'en' })}</option>
        <option value="th">{t('locale', { locale: 'th' })}</option>
        <option value="ja">{t('locale', { locale: 'ja' })}</option>
      </select>
    </div>
  );
}
