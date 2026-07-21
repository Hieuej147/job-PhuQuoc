"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
//@ts-ignore
import "@copilotkit/react-core/v2/styles.css";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/auth-provider";
import { RealtimeProvider } from "@/features/realtime/realtime-provider";
import { AiChatShell } from "@/components/ai/global-ai-chat-widget";
import type { AuthUser } from "@/lib/auth";

let lastCopilotErrorToastAt = 0;

function handleCopilotError(event: { error: Error; code?: string; context?: Record<string, unknown> }) {
  console.warn("CopilotKit error", event);

  const now = Date.now();
  if (now - lastCopilotErrorToastAt < 5000) return;
  lastCopilotErrorToastAt = now;

  const code = event.code || "";
  const message =
    code === "agent_connect_failed" || code === "runtime_info_fetch_failed"
      ? "Không kết nối được trợ lý AI. Vui lòng kiểm tra agent/backend rồi thử lại."
      : "Trợ lý AI đang gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại.";

  toast.error(message);
}

export function Providers({
  children,
  initialUser,
  header,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
  header?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <AuthProvider initialUser={initialUser}>
            <RealtimeProvider>
              {isPrintRoute ? (
                <>
                  {header}
                  {content}
                </>
              ) : (
                <CopilotKitProvider
                  runtimeUrl="/api/copilotkit"
                  credentials="include"
                  publicLicenseKey={process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY}
                  showDevConsole={false}
                  onError={handleCopilotError}
                >
                  <AiChatShell header={header}>{content}</AiChatShell>
                </CopilotKitProvider>
              )}
            </RealtimeProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
