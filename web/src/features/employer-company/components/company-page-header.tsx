import Link from "next/link";
import { Building2, ChevronRight, ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Company } from "../types";

interface CompanyPageHeaderProps {
  company: Company | null;
  saving: boolean;
  onSave: () => void;
}

export function CompanyPageHeader({ company, saving, onSave }: CompanyPageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/employer/dashboard" className="transition-colors hover:text-primary">
          Dashboard
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-semibold text-amber-500">Hồ sơ công ty</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="text-amber-500" /> Hồ sơ công ty
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Cập nhật thông tin công ty để thu hút ứng viên tốt hơn
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {company?.slug ? (
            <Link
              href={`/companies/${company.slug}`}
              target="_blank"
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <ExternalLink className="size-4.5" /> Xem trang công ty
            </Link>
          ) : (
            <Button variant="outline" disabled className="rounded-xl">
              <ExternalLink className="mr-2 size-4.5" /> Xem trang công ty
            </Button>
          )}

          <Button
            onClick={onSave}
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-xl border-none bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2 text-sm font-bold text-white shadow-md transition-all hover:opacity-90"
          >
            {saving ? <Spinner size="sm" /> : <Save className="size-4" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}
