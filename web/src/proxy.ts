import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "better-auth.session_token";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(COOKIE_NAME);
  const isLoggedIn = !!sessionCookie?.value;
  const path = request.nextUrl.pathname;

  const isCandidateRoute = path.startsWith("/candidate");
  const isEmployerRoute = path.startsWith("/employer");
  const isProtectedRoute = isCandidateRoute || isEmployerRoute;

  // Chưa login → redirect login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/candidate/:path*", "/employer/:path*", "/auth/:path*"],
};
