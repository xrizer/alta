import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to login only once
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // All other routes pass through — auth is handled client-side by AuthContext
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
