
import { NextResponse } from "next/server";
import { Role } from "@/lib/prisma-constants";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const memberRoutes = ["/dashboard", "/events/"];
const hostRoutes = ["/host"];
const hostRoleSet = new Set<Role>([Role.HOST, Role.ADMIN]);
const memberRoleSet = new Set<Role>([Role.MEMBER, Role.HOST, Role.ADMIN]);

const securedMiddleware = auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth;

  const requiresMember = memberRoutes.some((route) => pathname.startsWith(route));
  const requiresHost = hostRoutes.some((route) => pathname.startsWith(route));
  const requiresAdmin = pathname.startsWith("/admin");

  if (!requiresMember && !requiresHost && !requiresAdmin) {
    return NextResponse.next();
  }

  // Bypass: Allow admin routes to pass through to the Layout (Server Component)
  // This avoids issues where Middleware (Edge) fails to decode the session but the Server successfully does.
  if (requiresAdmin) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", nextUrl.origin);
    const redirectValue = nextUrl.pathname + nextUrl.search;
    loginUrl.searchParams.set("redirectTo", redirectValue);
    loginUrl.searchParams.set("callbackUrl", redirectValue);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  if (requiresHost && !hostRoleSet.has(role)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  if (requiresMember && !memberRoleSet.has(role)) {
    return NextResponse.redirect(new URL("/apply", nextUrl.origin));
  }

  return NextResponse.next();
});

export default securedMiddleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
