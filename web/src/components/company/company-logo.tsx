"use client";

interface CompanyLogoProps {
  name?: string | null;
  logo?: string | null;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
}

function getInitials(name?: string | null) {
  const value = name?.trim();
  if (!value) return "CT";
  return value
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CompanyLogo({
  name,
  logo,
  className = "",
  imageClassName = "",
  textClassName = "",
}: CompanyLogoProps) {
  return (
    <div className={`overflow-hidden flex items-center justify-center bg-white ${className}`}>
      {logo ? (
        <img
          src={logo}
          alt={name || "Logo công ty"}
          className={`w-full h-full object-cover ${imageClassName}`}
        />
      ) : (
        <span className={`font-black text-[#0E7490] ${textClassName}`}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
