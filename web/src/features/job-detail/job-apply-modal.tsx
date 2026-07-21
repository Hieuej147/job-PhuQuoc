"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";

import type { useJobApplyFlow } from "./use-job-apply-flow";

type JobApplyFlow = ReturnType<typeof useJobApplyFlow>;

interface JobApplyModalProps {
  jobTitle: string;
  companyName: string;
  applyFlow: JobApplyFlow;
}

export function JobApplyModal({ jobTitle, companyName, applyFlow }: JobApplyModalProps) {
  return (
    <>
      {applyFlow.showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0d2d42] rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ứng tuyển: {jobTitle}</h3>
              <button onClick={applyFlow.closeApplyModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Tại {companyName}</p>

            {applyFlow.applyError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {applyFlow.applyError}
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => applyFlow.setApplyTab("select")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${applyFlow.applyTab === "select" ? "bg-[#0E7490] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
              >
                CV đã lưu
              </button>
              <button
                onClick={() => applyFlow.setApplyTab("upload")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${applyFlow.applyTab === "upload" ? "bg-[#0E7490] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
              >
                Upload PDF
              </button>
            </div>

            {applyFlow.applyTab === "select" ? (
              <div className="mb-4">
                <label className="text-sm font-medium mb-1.5 block">Chọn CV</label>
                {applyFlow.resumes.length === 0 ? (
                  <p className="text-sm text-gray-500">Bạn chưa có CV. Hãy tạo CV trước khi ứng tuyển.</p>
                ) : (
                  <select
                    value={applyFlow.selectedResumeId}
                    onChange={(e) => applyFlow.setSelectedResumeId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#071a2b] dark:border-gray-600"
                  >
                    {applyFlow.resumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.title} {resume.isDefault ? "(Mặc định)" : ""} - {resume.template?.name || ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="text-sm font-medium mb-1.5 block">Upload CV (PDF)</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => applyFlow.setUploadedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="text-sm">Kéo thả hoặc click để chọn file PDF</p>
                      <p className="text-xs mt-1">Tối đa 10MB</p>
                    </div>
                  </label>
                  {applyFlow.uploadedFile && (
                    <p className="mt-2 text-sm text-[#0E7490] font-medium">{applyFlow.uploadedFile.name}</p>
                  )}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">Thư giới thiệu (tùy chọn)</label>
              <textarea
                value={applyFlow.coverLetter}
                onChange={(e) => applyFlow.setCoverLetter(e.target.value)}
                rows={3}
                placeholder="Giới thiệu ngắn gọn về bản thân và lý do bạn phù hợp với vị trí này..."
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#071a2b] dark:border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={applyFlow.closeApplyModal} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Hủy
              </button>
              <button
                onClick={applyFlow.handleApply}
                disabled={applyFlow.applying || (applyFlow.applyTab === "select" && applyFlow.resumes.length === 0)}
                className="px-6 py-2 text-sm bg-[#0E7490] hover:bg-[#005a71] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {applyFlow.applying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...
                  </>
                ) : (
                  "Gửi đơn ứng tuyển"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {applyFlow.applySuccess && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Ứng tuyển thành công! Nhà tuyển dụng sẽ phản hồi sớm.</span>
          <button onClick={() => applyFlow.setApplySuccess(false)} className="ml-2 hover:bg-green-700 rounded p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
