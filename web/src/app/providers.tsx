"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
//@ts-ignore
import "@copilotkit/react-core/v2/styles.css";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isPrintRoute =
    /^\/resumes\/[^/]+\/print$/.test(pathname || "") ||
    /^\/applications\/[^/]+\/resume\/print$/.test(pathname || "");

  const content = (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <AuthProvider initialUser={initialUser}>
          {isPrintRoute ? content : (
            <CopilotKitProvider
              runtimeUrl="/api/copilotkit"
              credentials="include"
              publicLicenseKey={process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY}
              showDevConsole={true}
            >
              {content}
            </CopilotKitProvider>
          )}
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
