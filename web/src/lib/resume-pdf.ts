import { toast } from "sonner";

export async function downloadResumePdf(resumeId: string, title?: string) {
  try {
    const response = await fetch(`/api/v1/resumes/${resumeId}/pdf`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to export PDF");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cv-${title || resumeId}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tải PDF");
  } catch {
    toast.error("Không thể tạo PDF");
  }
}
