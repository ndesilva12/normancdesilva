"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { RemindersProvider } from "@/contexts/RemindersContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { NewsSourcesProvider } from "@/contexts/NewsSourcesContext";
import { RecentSearchesProvider } from "@/contexts/RecentSearchesContext";
import { SearchReportsProvider } from "@/contexts/SearchReportsContext";
import { SettingsPopup } from "@/components/SettingsPopup";
import GlobalSearchProvider from "@/components/GlobalSearchProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <RecentSearchesProvider>
          <SearchReportsProvider>
            <RemindersProvider>
              <NewsSourcesProvider>
                <LayoutProvider>
                  <GlobalSearchProvider>
                    {children}
                    <SettingsPopup />
                  </GlobalSearchProvider>
                </LayoutProvider>
              </NewsSourcesProvider>
            </RemindersProvider>
          </SearchReportsProvider>
        </RecentSearchesProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
