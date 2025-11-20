import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to set the document direction (RTL/LTR) based on the current language
 * Also updates the HTML lang attribute
 */
export function useRTLSupport() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';
    
    // Set document direction
    document.documentElement.dir = direction;
    
    // Set document language
    document.documentElement.lang = i18n.language;
    
    console.log(`📖 Direction set to: ${direction} (Language: ${i18n.language})`);
  }, [i18n.language]);
}
