/**
 * TÊN TRANG: Hồ sơ ứng viên (Employer Applications)
 * MÔ TẢ: Danh sách hồ sơ ứng viên đã ứng tuyển vào các vị trí tuyển dụng của công ty.
 * TƯƠNG TÁC DỮ LIỆU:
 * - GET `/api/v1/applications/employer`: lấy danh sách hồ sơ ứng tuyển.
 * - PATCH `/api/v1/applications/:id/status`: cập nhật trạng thái hồ sơ.
 * - GET `/api/v1/applications/:id/resume`: xem CV ứng viên theo quyền employer.
 */
"use client";

import { useSearchParams } from "next/navigation";
import { Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useEmployerApplications } from "@/features/employer-applications/hooks/use-employer-applications";
import { ApplicantCard } from "@/features/employer-applications/components/applicant-card";
import { ApplicationCvDialog } from "@/features/employer-applications/components/application-cv-dialog";
import { ApplicationsSummaryCards } from "@/features/employer-applications/components/applications-summary-cards";
import { ApplicationsToolbar } from "@/features/employer-applications/components/applications-toolbar";
import { ApplicationStatusDialog } from "@/features/employer-applications/components/application-status-dialog";

export default function EmployerApplicationsPage() {
  const searchParams = useSearchParams();
  const focusedApplicationId = searchParams.get("applicationId");
  const initialJobId = searchParams.get("jobId");
  const applications = useEmployerApplications({ focusedApplicationId, initialJobId });

  const closeStatusDialog = () => {
    applications.setStatusDialog(null);
    applications.setStatusMessage("");
  };

  if (applications.loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-[#005a71]" />
        <p className="animate-pulse text-sm text-muted-foreground">Đang tải danh sách hồ sơ ứng tuyển...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 text-slate-100">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="cursor-pointer hover:underline">Dashboard</span>
            <span>&gt;</span>
            <span className="text-[#0ea5e9]">Hồ sơ ứng viên</span>
          </div>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Users className="h-5 w-5" />
            </span>
            Hồ sơ ứng viên
          </h1>
          <p className="text-xs text-slate-400">Quản lý và xét duyệt đơn ứng tuyển</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="self-end gap-1.5 border-slate-700 bg-[#0f2d42] text-slate-100 hover:bg-[#153b54]"
        >
          <Download className="h-4 w-4" />
          <span>Xuất Excel</span>
        </Button>
      </div>

      <ApplicationsSummaryCards counts={applications.counts} />

      <ApplicationsToolbar
        searchQuery={applications.searchQuery}
        setSearchQuery={applications.setSearchQuery}
        selectedJobId={applications.selectedJobId}
        setSelectedJobId={applications.setSelectedJobId}
        sortBy={applications.sortBy}
        setSortBy={applications.setSortBy}
        statusFilter={applications.statusFilter}
        setStatusFilter={applications.setStatusFilter}
        counts={applications.counts}
        uniqueJobs={applications.uniqueJobs}
      />

      {applications.filteredApps.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Không tìm thấy ứng viên phù hợp"
          description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để có nhiều kết quả hơn."
        />
      ) : (
        <div className="space-y-4">
          {applications.filteredApps.map((app, index) => (
            <ApplicantCard
              key={app.id}
              app={app}
              index={index}
              focused={focusedApplicationId === app.id}
              onBookmark={applications.handleBookmark}
              onViewCv={applications.handleViewCV}
              onChat={applications.setChatApplication}
              onCloseChat={applications.setCloseChatDialog}
              onDelete={applications.setDeleteDialog}
              onStatus={applications.handleStatus}
            />
          ))}
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .employer-cv-print-area,
          .employer-cv-print-area * {
            visibility: visible !important;
          }
          .employer-cv-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 210mm !important;
            background: #ffffff !important;
          }
          .employer-cv-print-hidden {
            display: none !important;
          }
        }
      `}</style>

      <ApplicationStatusDialog
        dialog={applications.statusDialog}
        message={applications.statusMessage}
        submitting={applications.statusSubmitting}
        setMessage={applications.setStatusMessage}
        onClose={closeStatusDialog}
        onConfirm={applications.handleConfirmStatus}
      />

      <ApplicationChatDialog
        open={Boolean(applications.chatApplication)}
        onOpenChange={(open) => !open && applications.setChatApplication(null)}
        applicationId={applications.chatApplication?.id ?? null}
        currentRole="EMPLOYER"
        applicationStatus={applications.chatApplication?.status ?? null}
        chatClosedAt={applications.chatApplication?.chatClosedAt ?? null}
        readOnly={Boolean(applications.chatApplication && (applications.chatApplication.status !== "ACCEPTED" || applications.chatApplication.chatClosedAt))}
        title="Tin nhắn với ứng viên"
        description={
          applications.chatApplication
            ? `${applications.chatApplication.user.name} - ${applications.chatApplication.job.title}`
            : undefined
        }
        onMessageSent={(message) => {
          if (applications.chatApplication) {
            applications.updateLatestMessage(applications.chatApplication.id, message);
          }
        }}
      />

      <Dialog open={Boolean(applications.closeChatDialog)} onOpenChange={(open) => !open && applications.setCloseChatDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đóng cuộc trò chuyện?</DialogTitle>
            <DialogDescription>
              Hai bên vẫn xem được lịch sử tin nhắn, nhưng không thể gửi tin mới trong application này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => applications.setCloseChatDialog(null)}>
              Hủy
            </Button>
            <Button type="button" onClick={applications.confirmCloseChat}>
              Đóng trao đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(applications.deleteDialog)} onOpenChange={(open) => !open && applications.setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá hồ sơ khỏi danh sách?</DialogTitle>
            <DialogDescription>
              Hồ sơ sẽ biến mất khỏi workspace nhà tuyển dụng. Candidate vẫn thấy đơn của họ nếu chưa tự xoá.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => applications.setDeleteDialog(null)}>
              Hủy
            </Button>
            <Button type="button" variant="destructive" onClick={applications.confirmDeleteApplication}>
              Xoá khỏi danh sách
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApplicationCvDialog
        open={applications.cvModalOpen}
        onOpenChange={applications.setCvModalOpen}
        payload={applications.cvPayload}
        applicationId={applications.cvApplicationId}
        loading={applications.cvLoading}
        error={applications.cvError}
      />
    </div>
  );
}
