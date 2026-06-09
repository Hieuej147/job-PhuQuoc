export function getNotiIcon(type: string): string {
  const icons: Record<string, string> = {
    APPLICATION_RECEIVED: "📩",
    APPLICATION_ACCEPTED: "✅",
    APPLICATION_REJECTED: "❌",
    JOB_APPROVED: "🎉",
    COMPANY_APPROVED: "🏢",
    JOB_DEADLINE: "⏰",
    SYSTEM: "🔔",
    NEW_MESSAGE: "💬",
    APPLICATION_STATUS_CHANGED: "📋",
  };
  return icons[type] || "🔔";
}
