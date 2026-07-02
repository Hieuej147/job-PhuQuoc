"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

const PRINT_ROUTE_PATTERNS = [
  /^\/resumes\/[^/]+\/print$/,
  /^\/applications\/[^/]+\/resume\/print$/,
];

export default function HeaderGate() {
  const pathname = usePathname();
  const isPrintRoute = PRINT_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname || ""));

  if (isPrintRoute) return null;

  return <Header />;
}
