import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/core/components/ui/button";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import { updateThemePreference } from "@/core/tenancy/integration";
import { useEffect } from "react";
import { toast } from "sonner";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { user } = useAppContext();

  const handleThemeChange = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);

    // Save to database if user is logged in
    if (user?.id) {
      const success = await updateThemePreference(user.id, newTheme as 'light' | 'dark');
      if (!success) {
        toast.error("Failed to save theme preference");
      }
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleThemeChange}
      className="gap-2"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="text-sm">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </Button>
  );
}
