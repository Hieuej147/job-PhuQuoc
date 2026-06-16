"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
//@ts-ignore
import "@copilotkit/react-core/v2/styles.css";
import { ThemeProvider } from "@/components/theme-provider";
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <AuthProvider initialUser={initialUser}>
          <CopilotKitProvider
            runtimeUrl="/api/copilotkit"
            credentials="include"
            publicLicenseKey={process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY}
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
