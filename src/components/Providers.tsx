"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { RemindersProvider } from "@/contexts/RemindersContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SettingsPopup } from "@/components/SettingsPopup";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <RemindersProvider>
          <LayoutProvider>
            {children}
            <SettingsPopup />
          </LayoutProvider>
        </RemindersProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
