import type { Area } from "react-easy-crop";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function createCroppedImageFile(
  imageSrc: string,
  crop: Area,
  fileName: string,
  fileType: string,
  output: { width: number; height: number },
) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Không thể xử lý ảnh trên trình duyệt này");

  canvas.width = output.width;
  canvas.height = output.height;
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, output.width, output.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("Không thể tạo ảnh đã crop"));
        return;
      }
      resolve(result);
    }, fileType);
  });

  return new File([blob], fileName, { type: fileType });
}

export function isSupportedImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}
