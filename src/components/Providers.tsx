"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { RemindersProvider } from "@/contexts/RemindersContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <RemindersProvider>
        <LayoutProvider>{children}</LayoutProvider>
      </RemindersProvider>
    </AuthProvider>
  );
}
