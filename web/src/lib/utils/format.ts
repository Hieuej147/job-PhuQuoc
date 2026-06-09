export function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) => `${(n / 1000000).toFixed(0)}tr`;
  if (min && max) return `${fmt(min)}-${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}

export const TYPE_MAP: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  REMOTE: "Remote",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
  FREELANCE: "Freelance",
};

export const EXP_MAP: Record<string, string> = {
  NO_EXPERIENCE: "Không KN",
  UNDER_1_YEAR: "<1 năm",
  ONE_TO_THREE_YEARS: "1-3 năm",
  THREE_TO_FIVE_YEARS: "3-5 năm",
  OVER_FIVE_YEARS: ">5 năm",
};

export function jobTypeLabel(type: string): string {
  return TYPE_MAP[type] || type;
}

export function companyInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
