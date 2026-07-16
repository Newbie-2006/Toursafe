"use client";

import { ThemeProvider } from "@/features/theme/theme-provider";
import { ConfigProvider } from "@/features/config/config-provider";
import { I18nProvider } from "@/features/i18n/i18n-provider";
import { DataProvider } from "@/features/data/data-provider";
import { AuthProvider } from "@/features/auth/auth-provider";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <I18nProvider>
          <AuthProvider>
            <DataProvider>
              <ToastProvider>{children}</ToastProvider>
            </DataProvider>
          </AuthProvider>
        </I18nProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}
