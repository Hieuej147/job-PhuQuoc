import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LogoCropState } from "../types";

interface CompanyLogoCropDialogProps {
  open: boolean;
  cropState: LogoCropState;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CompanyLogoCropDialog({
  open,
  cropState,
  onCancel,
  onConfirm,
}: CompanyLogoCropDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Căn chỉnh logo</DialogTitle>
          <DialogDescription>
            Kéo ảnh để căn logo vào khung vuông, dùng thanh zoom nếu cần.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative h-[360px] overflow-hidden rounded-lg border bg-black">
            {cropState.imageUrl ? (
              <Cropper
                image={cropState.imageUrl}
                crop={cropState.crop}
                zoom={cropState.zoom}
                aspect={1}
                cropShape="rect"
                showGrid={false}
                onCropChange={cropState.onCropChange}
                onZoomChange={cropState.onZoomChange}
                onCropComplete={cropState.onCropComplete}
              />
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={cropState.zoom}
              onChange={(event) => cropState.onZoomChange(Number(event.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button type="button" onClick={onConfirm}>
            Dùng ảnh này
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
