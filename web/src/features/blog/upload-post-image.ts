import { apiUrl, unwrapApiPayload } from "@/lib/api-client";

function getUploadUrl(payload: unknown) {
  const data = unwrapApiPayload<any>(payload);
  return data?.url ?? data?.data?.url ?? data?.secure_url;
}

function getUploadError(payload: any, fallback: string) {
  const message = payload?.message ?? payload?.data?.message ?? payload?.error;
  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" ? message : fallback;
}

export async function uploadPostImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(apiUrl("/api/v1/upload/post-image"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getUploadError(body, `Upload ảnh thất bại (${response.status})`));
  }

  const url = getUploadUrl(body);
  if (!url) throw new Error("Upload ảnh không trả về URL");
  return url as string;
}
