"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ApplicationMessage, CvViewerPayload, EmployerApplication } from "../types";
import { apiDelete, apiGet, apiPatch } from "@/lib/api-client";

export function useEmployerApplications(params: {
  focusedApplicationId: string | null;
  initialJobId: string | null;
}) {
  const { focusedApplicationId, initialJobId } = params;
  const [apps, setApps] = useState<EmployerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(initialJobId || "ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [cvPayload, setCvPayload] = useState<CvViewerPayload | null>(null);
  const [cvApplicationId, setCvApplicationId] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [chatApplication, setChatApplication] = useState<EmployerApplication | null>(null);
  const [closeChatDialog, setCloseChatDialog] = useState<EmployerApplication | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<EmployerApplication | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ app: EmployerApplication; status: "ACCEPTED" | "REJECTED" } | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  useEffect(() => {
    apiGet<{ items?: EmployerApplication[] } | EmployerApplication[]>("/api/v1/applications/employer?limit=100")
      .then((payload) => {
        const items = Array.isArray(payload) ? payload : payload.items ?? [];
        setApps(Array.isArray(items) ? items : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!focusedApplicationId || loading) return;
    setSelectedJobId(initialJobId || "ALL");
    setStatusFilter("ALL");
    setSearchQuery("");
    window.requestAnimationFrame(() => {
      document.getElementById(`application-${focusedApplicationId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [focusedApplicationId, initialJobId, loading]);

  const uniqueJobs = useMemo(() => {
    const jobsMap = new Map<string, string>();
    apps.forEach((app) => {
      if (app.job?.id && app.job?.title) jobsMap.set(app.job.id, app.job.title);
    });
    return Array.from(jobsMap.entries()).map(([id, title]) => ({ id, title }));
  }, [apps]);

  const counts = useMemo(() => ({
    total: apps.length,
    pending: apps.filter((app) => app.status === "PENDING").length,
    reviewing: apps.filter((app) => app.status === "REVIEWING").length,
    accepted: apps.filter((app) => app.status === "ACCEPTED").length,
    rejected: apps.filter((app) => app.status === "REJECTED").length,
    bookmarked: apps.filter((app) => app.isBookmarked).length,
  }), [apps]);

  const filteredApps = useMemo(() => {
    let result = [...apps];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((app) => {
        const name = (app.resume?.name || app.user.name || "").toLowerCase();
        const jobTitle = (app.job?.title || "").toLowerCase();
        return name.includes(q) || jobTitle.includes(q);
      });
    }

    if (selectedJobId !== "ALL") {
      result = result.filter((app) => app.job?.id === selectedJobId);
    }

    if (statusFilter !== "ALL") {
      result = statusFilter === "BOOKMARKED"
        ? result.filter((app) => app.isBookmarked)
        : result.filter((app) => app.status === statusFilter);
    }

    if (sortBy === "NEWEST") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "OLDEST") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return result;
  }, [apps, searchQuery, selectedJobId, statusFilter, sortBy]);

  const submitStatus = async (id: string, status: string, employerMessage?: string) => {
    try {
      await apiPatch(`/api/v1/applications/${id}/status`, { status, employerMessage });
      const now = new Date().toISOString();
      setApps((prev) => prev.map((app) => app.id === id ? {
        ...app,
        status,
        employerMessage,
        ...(status === "REJECTED" ? { chatClosedAt: now, chatCloseReason: "REJECTED" } : {}),
      } : app));
      toast.success("Đã cập nhật trạng thái hồ sơ");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái");
      return false;
    }
  };

  const handleStatus = async (app: EmployerApplication, status: string) => {
    if (status === "ACCEPTED" || status === "REJECTED") {
      setStatusDialog({ app, status });
      setStatusMessage("");
      return;
    }
    await submitStatus(app.id, status);
  };

  const handleConfirmStatus = async () => {
    if (!statusDialog) return;
    setStatusSubmitting(true);
    const ok = await submitStatus(statusDialog.app.id, statusDialog.status, statusMessage.trim() || undefined);
    setStatusSubmitting(false);
    if (ok) {
      setStatusDialog(null);
      setStatusMessage("");
    }
  };

  const handleBookmark = async (id: string) => {
    const app = apps.find((item) => item.id === id);
    if (!app) return;
    try {
      await apiPatch(`/api/v1/applications/${id}/bookmark`, { isBookmarked: !app.isBookmarked });
      setApps((prev) => prev.map((item) => item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item));
      toast.success(app.isBookmarked ? "Đã bỏ đánh dấu hồ sơ" : "Đã đánh dấu hồ sơ");
      return;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật đánh dấu");
    }
  };

  const confirmDeleteApplication = async () => {
    if (!deleteDialog) return;
    const app = deleteDialog;
    try {
      await apiDelete(`/api/v1/applications/${app.id}/employer`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xoá hồ sơ khỏi danh sách");
      return;
    }
    setApps((prev) => prev.filter((item) => item.id !== app.id));
    setDeleteDialog(null);
    toast.success("Đã xoá hồ sơ khỏi danh sách nhà tuyển dụng");
  };

  const updateLatestMessage = (applicationId: string, message: ApplicationMessage) => {
    const updateApp = (item: EmployerApplication) =>
      item.id === applicationId
        ? { ...item, messages: [message], employerMessage: item.employerMessage || message.body }
        : item;

    setApps((prev) => prev.map(updateApp));
    setChatApplication((prev) => (prev && prev.id === applicationId ? updateApp(prev) : prev));
  };

  const confirmCloseChat = async () => {
    if (!closeChatDialog) return;
    const app = closeChatDialog;

    let payload: Partial<EmployerApplication>;
    try {
      payload = await apiPatch<Partial<EmployerApplication>>(`/api/v1/applications/${app.id}/chat/close`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đóng cuộc trò chuyện");
      return;
    }

    const closedAt = payload?.chatClosedAt || new Date().toISOString();
    const closedReason = payload?.chatCloseReason || "EMPLOYER_ARCHIVED";
    const updateApp = (item: EmployerApplication) =>
      item.id === app.id ? { ...item, chatClosedAt: closedAt, chatCloseReason: closedReason } : item;

    setApps((prev) => prev.map(updateApp));
    setChatApplication((prev) => (prev && prev.id === app.id ? updateApp(prev) : prev));
    setCloseChatDialog(null);
    toast.success("Đã đóng cuộc trò chuyện");
  };

  const handleViewCV = async (app: EmployerApplication) => {
    setCvModalOpen(true);
    setCvPayload(null);
    setCvApplicationId(app.id);
    setCvError(null);
    setCvLoading(true);

    try {
      setCvPayload(await apiGet<CvViewerPayload>(`/api/v1/applications/${app.id}/resume`));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải CV ứng viên";
      setCvError(message);
      toast.error(message);
    } finally {
      setCvLoading(false);
    }
  };

  return {
    apps,
    loading,
    searchQuery,
    setSearchQuery,
    selectedJobId,
    setSelectedJobId,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    uniqueJobs,
    counts,
    filteredApps,
    cvModalOpen,
    setCvModalOpen,
    cvPayload,
    cvApplicationId,
    cvLoading,
    cvError,
    chatApplication,
    setChatApplication,
    closeChatDialog,
    setCloseChatDialog,
    deleteDialog,
    setDeleteDialog,
    statusDialog,
    setStatusDialog,
    statusMessage,
    setStatusMessage,
    statusSubmitting,
    handleStatus,
    handleConfirmStatus,
    handleBookmark,
    handleViewCV,
    updateLatestMessage,
    confirmCloseChat,
    confirmDeleteApplication,
  };
}
