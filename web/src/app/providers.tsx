"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/auth-provider";
import type { AuthUser } from "@/lib/auth";

export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
}) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider initialUser={initialUser}>
          <CopilotKitProvider
            runtimeUrl="/api/copilotkit"
            credentials="include"
            showDevConsole={true}
          >
            {children}
            <Toaster richColors position="top-right" />
          </CopilotKitProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
