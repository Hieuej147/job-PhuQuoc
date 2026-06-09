"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <CopilotKitProvider
          runtimeUrl="/api/copilotkit"
          credentials="include"
          showDevConsole={true}
        >
          {children}
          <Toaster richColors position="top-right" />
        </CopilotKitProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
