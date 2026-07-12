import {
  Briefcase,
  FileText,
  GraduationCap,
  MapPin,
  MessageCircle,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EmployerApplication } from "../types";
import {
  cardGradients,
  formatTimeAgo,
  getApplicationEducation,
  getApplicationExperience,
  getInitials,
  getLatestMessage,
  statusMap,
} from "../utils";

interface ApplicantCardProps {
  app: EmployerApplication;
  index: number;
  focused: boolean;
  onBookmark: (id: string) => void;
  onViewCv: (app: EmployerApplication) => void;
  onChat: (app: EmployerApplication) => void;
  onCloseChat: (app: EmployerApplication) => void;
  onDelete: (app: EmployerApplication) => void;
  onStatus: (app: EmployerApplication, status: string) => void;
}

export function ApplicantCard({
  app,
  index,
  focused,
  onBookmark,
  onViewCv,
  onChat,
  onCloseChat,
  onDelete,
  onStatus,
}: ApplicantCardProps) {
  const cvName = app.resume?.name || app.user.name;
  const statusConfig = statusMap[app.status] || {
    label: app.status,
    class: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  };
  const address = app.resume?.address || "Phú Quốc, Kiên Giang";
  const school = getApplicationEducation(app);
  const exp = getApplicationExperience(app);
  const latestMessage = getLatestMessage(app);
  const hasMessage = Boolean(latestMessage || app.employerMessage);
  const canChat = app.status === "ACCEPTED" && !app.chatClosedAt;
  const canViewReadonlyMessage =
    (app.status === "REJECTED" || Boolean(app.chatClosedAt)) && hasMessage;

  return (
    <Card
      id={`application-${app.id}`}
      className={`overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-sm ${
        app.isBookmarked ? "ring-1 ring-yellow-500/30" : ""
      } ${focused ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
    >
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${cardGradients[index % cardGradients.length]} text-base font-bold text-white shadow-md ring-1 ring-primary/10`}
            >
              {getInitials(cvName)}
            </div>
            <div className="space-y-0.5">
              <h3 className="cursor-pointer text-lg font-bold text-foreground transition-colors hover:text-primary">
                {cvName}
              </h3>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {app.job.title}
                </span>
                <span className="mx-2">•</span>
                <span>{formatTimeAgo(app.createdAt)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${statusConfig.class}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
              />
              {statusConfig.label}
            </span>
            <button
              type="button"
              onClick={() => onBookmark(app.id)}
              className="p-1 text-muted-foreground transition-colors hover:text-yellow-500"
            >
              <Star
                className={`h-4 w-4 ${app.isBookmarked ? "fill-yellow-500 text-yellow-500" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-2 pt-1 text-xs text-muted-foreground md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{exp}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{school}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{address}</span>
          </div>
        </div>

        {latestMessage && (
          <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            {latestMessage}
          </p>
        )}

        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border pt-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {app.cvUrl || app.resumeId ? (
              <Button
                size="sm"
                onClick={() => onViewCv(app)}
                className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold"
              >
                <FileText className="h-4 w-4" />
                <span>Xem CV đầy đủ</span>
              </Button>
            ) : (
              <span className="text-xs italic text-muted-foreground">
                Không đính kèm CV
              </span>
            )}
            {(canChat || canViewReadonlyMessage) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onChat(app)}
                className="border-border bg-background text-xs text-foreground hover:bg-muted"
              >
                <MessageCircle className="h-4 w-4" />
                {canChat ? "Nhắn tin" : "Xem lời nhắn"}
              </Button>
            )}
            {canChat && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCloseChat(app)}
                className="border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
              >
                Đóng trao đổi
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(app)}
              className="border-rose-500/30 bg-rose-500/10 text-xs text-rose-700 hover:bg-rose-500/20 dark:text-rose-300"
            >
              <Trash2 className="h-4 w-4" />
              Xoá
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {app.status === "ACCEPTED" || app.status === "REJECTED" ? (
              <span
                className={`rounded-lg border px-4 py-2 text-xs font-semibold ${statusConfig.class}`}
              >
                Đã kết thúc: {statusConfig.label}
              </span>
            ) : (
              <>
                {app.status === "PENDING" && (
                  <Button
                    size="sm"
                    onClick={() => onStatus(app, "REVIEWING")}
                    className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-500/20 dark:text-blue-300"
                  >
                    Đang xem xét
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => onStatus(app, "ACCEPTED")}
                  className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                >
                  <span>✓ Chấp nhận</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => onStatus(app, "REJECTED")}
                  className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-500/20 dark:text-rose-300"
                >
                  <span>✗ Từ chối</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
