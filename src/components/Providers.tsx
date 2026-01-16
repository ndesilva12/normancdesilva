"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <LayoutProvider>{children}</LayoutProvider>
    </AuthProvider>
  );
}
