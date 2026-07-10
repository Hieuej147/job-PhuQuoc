import type { ApplicationMessageSenderRole, NotificationType } from '@prisma/client';

export interface RealtimeUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
}

export interface RealtimeApplicationMessage {
  id: string;
  applicationId: string;
  senderId: string;
  senderRole: ApplicationMessageSenderRole;
  body: string;
  readAt?: Date | string | null;
  createdAt: Date | string;
  sender?: { id: string; name?: string | null; image?: string | null };
}

export interface RealtimeNotification {
  id: string;
  userId?: string;
  type: NotificationType | string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Date | string;
  readAt?: Date | string | null;
  refId?: string | null;
  refType?: string | null;
}

export type DashboardInvalidateScope = 'candidate' | 'employer';

