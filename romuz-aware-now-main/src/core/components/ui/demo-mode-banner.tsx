import { TestTube2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import { Button } from "@/core/components/ui/button";
import { useState } from "react";

/**
 * Demo Mode Banner - شريط تنبيه يظهر عند استخدام Demo Mode
 * 
 * يعرض الدور النشط الحالي ويمكن إغلاقه مؤقتاً
 */
export function DemoModeBanner() {
  const { t } = useTranslation();
  const { activeRole } = useAppContext();
  const [isVisible, setIsVisible] = useState(true);

  // التحقق من البيئة - عرض البانر فقط في Development
  const isDevelopment = import.meta.env.DEV;

  if (!isDevelopment || !isVisible || !activeRole) {
    return null;
  }

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TestTube2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
              🧪 Demo Mode
            </span>
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              {t('demoMode.viewingAs')}: <strong>{t(`roles.${activeRole}`)}</strong>
            </span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0 hover:bg-yellow-500/20"
        >
          <X className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
        </Button>
      </div>
    </div>
  );
}
