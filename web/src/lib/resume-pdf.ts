import { toast } from "sonner";

export async function downloadResumePdf(resumeId: string, title?: string) {
  window.open(`/resumes/${resumeId}/print?print=1`, "_blank", "noopener,noreferrer");
  toast.info(`Mở bản in PDF${title ? `: ${title}` : ""}`);
}
