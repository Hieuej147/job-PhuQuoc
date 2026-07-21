"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  applyToJob,
  fetchMyResumes,
  uploadCandidateCv,
  type CandidateResumeOption,
} from "./api";

type ApplyTab = "select" | "upload";

interface JobApplyUser {
  role?: string | null;
}

interface UseJobApplyFlowOptions {
  jobId: string;
  jobSlug: string;
  user: JobApplyUser | null | undefined;
  isApplied: boolean;
  onApplied: () => void;
}

export function useJobApplyFlow({ jobId, jobSlug, user, isApplied, onApplied }: UseJobApplyFlowOptions) {
  const router = useRouter();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyTab, setApplyTab] = useState<ApplyTab>("select");
  const [resumes, setResumes] = useState<CandidateResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const closeApplyModal = () => {
    setShowApplyModal(false);
    setApplyError(null);
  };

  const resetForm = () => {
    setCoverLetter("");
    setUploadedFile(null);
    setApplyTab("select");
  };

  const openApplyModal = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/jobs/${jobSlug}`);
      return;
    }

    if (user.role !== "CANDIDATE") {
      toast.error("Chỉ tài khoản ứng viên mới có thể ứng tuyển công việc.");
      return;
    }

    if (isApplied) return;

    setShowApplyModal(true);
    setApplyError(null);

    try {
      const resumeOptions = await fetchMyResumes();
      setResumes(resumeOptions);
      const defaultResume = resumeOptions.find((resume) => resume.isDefault);
      setSelectedResumeId(defaultResume?.id ?? resumeOptions[0]?.id ?? "");
    } catch {
      setResumes([]);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setApplyError(null);

    try {
      const body: Record<string, unknown> = { jobId };
      const normalizedCoverLetter = coverLetter.trim();
      if (normalizedCoverLetter) body.coverLetter = normalizedCoverLetter;

      if (applyTab === "select" && selectedResumeId) {
        body.resumeId = selectedResumeId;
      }

      if (applyTab === "upload") {
        if (!uploadedFile) {
          throw new Error("Vui lòng chọn file CV PDF");
        }
        body.cvUrl = await uploadCandidateCv(uploadedFile);
      }

      await applyToJob(body);
      setApplySuccess(true);
      onApplied();
      closeApplyModal();
      resetForm();
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : "Ứng tuyển thất bại");
    } finally {
      setApplying(false);
    }
  };

  return {
    showApplyModal,
    setShowApplyModal,
    closeApplyModal,
    coverLetter,
    setCoverLetter,
    applying,
    applySuccess,
    setApplySuccess,
    applyError,
    applyTab,
    setApplyTab,
    resumes,
    selectedResumeId,
    setSelectedResumeId,
    uploadedFile,
    setUploadedFile,
    openApplyModal,
    handleApply,
  };
}
