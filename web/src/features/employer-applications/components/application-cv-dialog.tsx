import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ResumePrintDocument } from "@/components/resume/resume-print-document";
import type { CvViewerPayload } from "../types";
import { buildResumeDocumentData } from "../utils";

interface ApplicationCvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: CvViewerPayload | null;
  applicationId: string | null;
  loading: boolean;
  error: string | null;
}

export function ApplicationCvDialog({
  open,
  onOpenChange,
  payload,
  applicationId,
  loading,
  error,
}: ApplicationCvDialogProps) {
  const selectedResume = payload?.type === "resume" ? payload.resume : null;
  const { selectedResumeUser, selectedResumeData } = buildResumeDocumentData(selectedResume);

  const handlePrintCv = () => {
    window.print();
  };

  const handleOpenCvNewTab = () => {
    if (payload?.type === "uploaded" && applicationId) {
      window.open(`/api/v1/applications/${applicationId}/resume-file`, "_blank", "noopener,noreferrer");
      return;
    }
    if (payload?.type === "resume" && applicationId) {
      window.open(`/applications/${applicationId}/resume/print`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="employer-cv-print-hidden border-b border-border px-6 py-4">
          <div className="flex flex-col gap-3 pr-10 md:flex-row md:items-center md:justify-between">
            <div>
              <DialogTitle>CV ứng viên</DialogTitle>
              <DialogDescription>
                Xem CV ngay trong dashboard. CV tạo online sẽ được render dạng giấy A4.
              </DialogDescription>
            </div>
            {payload && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenCvNewTab}
                >
                  Mở tab mới
                </Button>
                {payload.type === "resume" && (
                  <Button
                    size="sm"
                    onClick={handlePrintCv}
                  >
                    In / Lưu PDF
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[calc(92vh-88px)] overflow-auto bg-slate-200 p-6">
          {loading ? (
            <div className="flex h-[60vh] items-center justify-center">
              <Spinner size="lg" className="text-primary" />
            </div>
          ) : error ? (
            <div className="flex h-[60vh] items-center justify-center">
              <p className="rounded-lg bg-white px-4 py-3 text-sm text-red-600 shadow">{error}</p>
            </div>
          ) : payload?.type === "uploaded" ? (
            applicationId ? (
              <iframe
                src={`/api/v1/applications/${applicationId}/resume-file`}
                title="CV PDF ứng viên"
                className="mx-auto h-[75vh] w-full max-w-5xl rounded-lg border border-slate-300 bg-white"
              />
            ) : (
              <div className="flex h-[60vh] items-center justify-center">
                <p className="rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow">
                  Không xác định được hồ sơ ứng tuyển.
                </p>
              </div>
            )
          ) : selectedResume && selectedResumeUser && selectedResumeData ? (
            <div className="employer-cv-print-area">
              <ResumePrintDocument
                user={selectedResumeUser}
                resume={selectedResumeData}
                templateId={selectedResume.template?.id}
              />
            </div>
          ) : (
            <div className="flex h-[60vh] items-center justify-center">
              <p className="rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow">
                Không có CV để hiển thị.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
