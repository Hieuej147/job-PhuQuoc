"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplicationChatDialog } from "@/components/applications/application-chat-dialog";
import { 
  FileText, 
  Briefcase, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Search,
  ArrowRight,
  MessageCircle,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { apiDelete, unwrapApiPayload } from "@/lib/api-client";

interface ApplicationMessage {
  id: string;
  body: string;
  senderId: string;
  senderRole: "CANDIDATE" | "EMPLOYER";
  createdAt: string;
  readAt?: string | null;
}

interface Application {
  id: string;
  status: string;
  createdAt: string;
  employerMessage?: string | null;
  chatClosedAt?: string | null;
  chatClosedBy?: string | null;
  chatCloseReason?: string | null;
  messages?: ApplicationMessage[];
  job: { 
    id: string; 
    title: string; 
    slug: string; 
    company: { name: string; logo?: string | null } 
  };
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; colorClass: string }> = {
  PENDING: { 
    label: "Đã nộp", 
    variant: "secondary", 
    icon: Clock,
    colorClass: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900" 
  },
  REVIEWING: { 
    label: "Đang xem xét", 
    variant: "outline", 
    icon: AlertCircle,
    colorClass: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900" 
  },
  ACCEPTED: { 
    label: "Đã duyệt", 
    variant: "default", 
    icon: CheckCircle2,
    colorClass: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" 
  },
  REJECTED: { 
    label: "Từ chối", 
    variant: "destructive", 
    icon: XCircle,
    colorClass: "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900" 
  },
};

export default function ApplicationsPage() {
  const searchParams = useSearchParams();
  const focusedApplicationId = searchParams.get("applicationId");
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chatApplication, setChatApplication] = useState<Application | null>(null);
  const [deleteApplication, setDeleteApplication] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/v1/applications/my?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const payload = unwrapApiPayload<any>(d);
        const list = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
        setItems(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!focusedApplicationId || loading) return;
    setStatusFilter("ALL");
    window.requestAnimationFrame(() => {
      document.getElementById(`application-${focusedApplicationId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [focusedApplicationId, loading]);

  const counts = useMemo(() => {
    return {
      ALL: items.length,
      PENDING: items.filter(a => a.status === "PENDING").length,
      REVIEWING: items.filter(a => a.status === "REVIEWING").length,
      ACCEPTED: items.filter(a => a.status === "ACCEPTED").length,
      REJECTED: items.filter(a => a.status === "REJECTED").length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((a) => {
      const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
      const matchesSearch = 
        a.job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.job.company.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [items, statusFilter, searchQuery]);

  const updateLatestMessage = (applicationId: string, message: ApplicationMessage) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === applicationId
          ? { ...item, messages: [message], employerMessage: item.employerMessage || message.body }
          : item,
      ),
    );
    setChatApplication((prev) =>
      prev && prev.id === applicationId
        ? { ...prev, messages: [message], employerMessage: prev.employerMessage || message.body }
        : prev,
    );
  };

  const confirmDeleteApplication = async () => {
    if (!deleteApplication) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/v1/applications/${deleteApplication.id}`);
      setItems((prev) => prev.filter((item) => item.id !== deleteApplication.id));
      toast.success("Đã xoá đơn khỏi danh sách của bạn.");
      setDeleteApplication(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xoá đơn ứng tuyển");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spinner size="lg" className="text-[#005a71]" />
        <p className="text-sm text-muted-foreground animate-pulse">Đang tải danh sách đơn ứng tuyển...</p>
      </div>
    );
  }

  const filterTabs = [
    { key: "ALL", label: "Tất cả", count: counts.ALL, color: "border-slate-200 dark:border-slate-700" },
    { key: "PENDING", label: "Đã nộp", count: counts.PENDING, color: "border-amber-200 dark:border-amber-900/60" },
    { key: "REVIEWING", label: "Đang xem xét", count: counts.REVIEWING, color: "border-blue-200 dark:border-blue-900/60" },
    { key: "ACCEPTED", label: "Đã duyệt", count: counts.ACCEPTED, color: "border-emerald-200 dark:border-emerald-900/60" },
    { key: "REJECTED", label: "Từ chối", count: counts.REJECTED, color: "border-rose-200 dark:border-rose-900/60" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#005a71]" />
            Đơn ứng tuyển của bạn
          </h1>
          <p className="text-sm text-muted-foreground">Theo dõi trạng thái các công việc bạn đã nộp hồ sơ.</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề công việc hoặc tên công ty..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#005a71]/50 border-input transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs/Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-[#005a71] text-white border-transparent shadow-md scale-105"
                    : `bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 ${tab.color}`
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive 
                      ? "bg-white/20 text-white" 
                      : "bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications List */}
      {filteredItems.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title="Không tìm thấy đơn ứng tuyển nào" 
          description={
            searchQuery || statusFilter !== "ALL"
              ? "Hãy thử thay đổi điều kiện tìm kiếm hoặc bộ lọc trạng thái."
              : "Bạn chưa nộp đơn ứng tuyển nào. Hãy tìm kiếm công việc phù hợp và nộp đơn ngay!"
          } 
        />
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((a) => {
            const StatusIcon = statusMap[a.status]?.icon || AlertCircle;
            const statusConfig = statusMap[a.status];
            const hasMessage = Boolean(a.messages?.[0]?.body || a.employerMessage);
            const canOpenChat = a.status === "ACCEPTED" || (a.status === "REJECTED" && hasMessage) || Boolean(a.chatClosedAt && hasMessage);
            const chatReadOnly = a.status !== "ACCEPTED" || Boolean(a.chatClosedAt);
            const chatButtonLabel = a.status === "REJECTED" || chatReadOnly ? "Xem lời nhắn" : "Tin nhắn";

            return (
              <Card 
                key={a.id} 
                id={`application-${a.id}`}
                className={`overflow-hidden hover:shadow-md transition-all duration-200 border border-slate-100 dark:border-slate-800/80 hover:border-[#005a71]/30 group ${
                  focusedApplicationId === a.id ? "ring-2 ring-[#005a71] ring-offset-2 dark:ring-offset-slate-950" : ""
                }`}
              >
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#005a71]/5 dark:bg-[#005a71]/10 flex items-center justify-center text-[#005a71] font-bold text-lg shrink-0 border border-[#005a71]/10">
                      {a.job.company.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <Link 
                        href={`/jobs/${a.job.slug}`}
                        className="font-semibold text-gray-900 dark:text-gray-100 hover:text-[#005a71] transition-colors flex items-center gap-1"
                      >
                        {a.job.title}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#005a71]" />
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {a.job.company.name}
                        </span>
                        <span className="text-slate-350 dark:text-slate-700">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Nộp ngày {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      {(a.messages?.[0]?.body || a.employerMessage) && (
                        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                          {a.messages?.[0]?.body || a.employerMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="sm:hidden text-xs text-muted-foreground">Trạng thái</div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig?.colorClass || "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig?.label || a.status}
                      </div>
                    </div>
                    {canOpenChat && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setChatApplication(a)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {chatButtonLabel}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-rose-600 hover:text-rose-700"
                      onClick={() => setDeleteApplication(a)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Xoá
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <ApplicationChatDialog
        open={Boolean(chatApplication)}
        onOpenChange={(open) => !open && setChatApplication(null)}
        applicationId={chatApplication?.id ?? null}
        currentRole="CANDIDATE"
        applicationStatus={chatApplication?.status ?? null}
        chatClosedAt={chatApplication?.chatClosedAt ?? null}
        readOnly={Boolean(chatApplication && (chatApplication.status !== "ACCEPTED" || chatApplication.chatClosedAt))}
        title="Tin nhắn tuyển dụng"
        description={chatApplication ? `${chatApplication.job.title} - ${chatApplication.job.company.name}` : undefined}
        onMessageSent={(message) => chatApplication && updateLatestMessage(chatApplication.id, message)}
      />
      <Dialog open={Boolean(deleteApplication)} onOpenChange={(open) => !open && setDeleteApplication(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá đơn ứng tuyển?</DialogTitle>
            <DialogDescription>
              Đơn sẽ biến mất khỏi danh sách của bạn và giải phóng quota. Nếu nhà tuyển dụng chưa xoá, bạn vẫn không thể nộp lại job này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteApplication(null)} disabled={deleting}>
              Hủy
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteApplication} disabled={deleting}>
              {deleting ? "Đang xoá..." : "Xoá đơn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
