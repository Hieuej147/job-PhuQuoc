import { Briefcase, FileText, GraduationCap, MapPin, MessageCircle, Star, Trash2 } from "lucide-react";
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
  getMatchRate,
  getSkillsList,
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

export function ApplicantCard({ app, index, focused, onBookmark, onViewCv, onChat, onCloseChat, onDelete, onStatus }: ApplicantCardProps) {
  const cvName = app.resume?.name || app.user.name;
  const matchRate = getMatchRate(app.id);
  const statusConfig = statusMap[app.status] || { label: app.status, class: "bg-slate-800 text-slate-300", dot: "bg-slate-400" };
  const skills = getSkillsList(app.resume?.skills);
  const address = app.resume?.address || "Phú Quốc, Kiên Giang";
  const school = getApplicationEducation(app);
  const exp = getApplicationExperience(app);
  const latestMessage = getLatestMessage(app);
  const hasMessage = Boolean(latestMessage || app.employerMessage);
  const canChat = app.status === "ACCEPTED" && !app.chatClosedAt;
  const canViewReadonlyMessage = (app.status === "REJECTED" || Boolean(app.chatClosedAt)) && hasMessage;

  return (
    <Card
      id={`application-${app.id}`}
      className={`overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d2334]/80 transition-all duration-200 hover:border-blue-500/30 ${
        app.isBookmarked ? "ring-1 ring-yellow-500/20" : ""
      } ${focused ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-[#071927]" : ""}`}
    >
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${cardGradients[index % cardGradients.length]} text-base font-bold text-white shadow-md ring-1 ring-white/10`}>
              {getInitials(cvName)}
            </div>
            <div className="space-y-0.5">
              <h3 className="cursor-pointer text-lg font-bold text-slate-100 transition-colors hover:text-blue-400">
                {cvName}
              </h3>
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">{app.job.title}</span>
                <span className="mx-2">•</span>
                <span>{formatTimeAgo(app.createdAt)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${statusConfig.class}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
            <button
              type="button"
              onClick={() => onBookmark(app.id)}
              className="p-1 text-slate-400 transition-colors hover:text-yellow-500"
            >
              <Star className={`h-4 w-4 ${app.isBookmarked ? "fill-yellow-500 text-yellow-500" : ""}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-2 pt-1 text-xs text-slate-300 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{exp}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{school}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{address}</span>
          </div>
        </div>

        <div className="max-w-md space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Độ phù hợp:</span>
            <span className="text-amber-500">{matchRate}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-slate-800/80 bg-[#071622]">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style={{ width: `${matchRate}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {skills.map((skill) => (
            <span key={skill} className="rounded-md border border-slate-800 bg-[#071622] px-2.5 py-1 text-[10px] font-medium text-slate-300">
              {skill}
            </span>
          ))}
        </div>

        {latestMessage && (
          <p className="rounded-lg border border-slate-800 bg-[#071622] px-3 py-2 text-xs text-slate-300">
            {latestMessage}
          </p>
        )}

        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-slate-800/60 pt-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {app.cvUrl || app.resumeId ? (
              <Button size="sm" onClick={() => onViewCv(app)} className="flex items-center justify-center gap-1.5 rounded-lg border-0 bg-[#106b82] px-4 py-2 text-xs font-semibold text-white hover:bg-[#147e9a]">
                <FileText className="h-4 w-4" />
                <span>Xem CV đầy đủ</span>
              </Button>
            ) : (
              <span className="text-xs italic text-slate-500">Không đính kèm CV</span>
            )}
            {(canChat || canViewReadonlyMessage) && (
              <Button size="sm" variant="outline" onClick={() => onChat(app)} className="border-slate-700 bg-[#0e2738] text-xs text-slate-100 hover:bg-[#153b54]">
                <MessageCircle className="h-4 w-4" />
                {canChat ? "Nhắn tin" : "Xem lời nhắn"}
              </Button>
            )}
            {canChat && (
              <Button size="sm" variant="outline" onClick={() => onCloseChat(app)} className="border-amber-700/50 bg-[#2a2111] text-xs text-amber-200 hover:bg-[#3a2b14]">
                Đóng trao đổi
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onDelete(app)} className="border-rose-700/50 bg-[#2a1117] text-xs text-rose-200 hover:bg-[#3a141d]">
              <Trash2 className="h-4 w-4" />
              Xoá
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {app.status === "ACCEPTED" || app.status === "REJECTED" ? (
              <span className={`rounded-lg border px-4 py-2 text-xs font-semibold ${statusConfig.class}`}>
                Đã kết thúc: {statusConfig.label}
              </span>
            ) : (
              <>
                {app.status === "PENDING" && (
                  <Button size="sm" onClick={() => onStatus(app, "REVIEWING")} className="rounded-lg border border-blue-500/20 bg-[#0e2738] px-4 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                    Đang xem xét
                  </Button>
                )}
                <Button size="sm" onClick={() => onStatus(app, "ACCEPTED")} className="flex items-center gap-1 rounded-lg border border-[#22c55e]/20 bg-[#0a3625] px-4 py-2 text-xs font-semibold text-[#22c55e] hover:bg-[#0e4b34]">
                  <span>✓ Chấp nhận</span>
                </Button>
                <Button size="sm" onClick={() => onStatus(app, "REJECTED")} className="flex items-center gap-1 rounded-lg border border-[#ef4444]/20 bg-[#3b1219] px-4 py-2 text-xs font-semibold text-[#ef4444] hover:bg-[#521922]">
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
