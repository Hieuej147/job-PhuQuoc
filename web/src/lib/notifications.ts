export interface NotificationLinkTarget {
  id: string;
  type: string;
  refId?: string | null;
  refType?: string | null;
}

type UserRole = "CANDIDATE" | "EMPLOYER" | "ADMIN" | string | null | undefined;

export function getNotificationHref(notification: NotificationLinkTarget, role?: UserRole) {
  const normalizedRole = role || "CANDIDATE";
  const refType = notification.refType?.toLowerCase();
  const refId = notification.refId;

  if (refType === "application" && refId) {
    const params = new URLSearchParams({ applicationId: refId });
    return normalizedRole === "EMPLOYER"
      ? `/employer/applications?${params.toString()}`
      : `/candidate/applications?${params.toString()}`;
  }

  if (refType === "job") {
    return normalizedRole === "EMPLOYER" ? "/employer/jobs" : "/jobs";
  }

  switch (notification.type) {
    case "APPLICATION_RECEIVED":
      return normalizedRole === "EMPLOYER" ? "/employer/applications" : "/candidate/applications";
    case "APPLICATION_ACCEPTED":
    case "APPLICATION_REJECTED":
      return "/candidate/applications";
    case "JOB_APPROVED":
    case "JOB_DEADLINE":
      return normalizedRole === "EMPLOYER" ? "/employer/jobs" : "/jobs";
    default:
      return normalizedRole === "EMPLOYER" ? "/employer/notifications" : "/candidate/notifications";
  }
}

export function getNotificationIcon(type: string): string {
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
