"use client";

import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

const strengthColors = ["bg-red-500", "bg-yellow-500", "bg-teal-500", "bg-[#0E7490]"];
const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh"];

function getStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = getStrength(password);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-border overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", i < strength ? strengthColors[Math.min(strength - 1, 3)] : "w-0")}
              style={{ width: i < strength ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Độ bảo mật: {strengthLabels[Math.min(strength, 3)] || "Rất mạnh"}
      </p>
    </div>
  );
}
