import { NextResponse, type NextRequest } from "next/server";
import { Role } from "@/lib/prisma-constants";
import { auth } from "./auth";

type AuthenticatedRequest = NextRequest & {
  auth: {
    user?: {
      role?: Role | null;
    } | null;
  } | null;
};

const memberRoutes = ["/dashboard", "/events/"];
const hostRoutes = ["/host"];
const adminRoutes = ["/admin"];

function absoluteUrl(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return url;
}

const hostRoleSet = new Set<Role>([Role.HOST, Role.ADMIN]);
const memberRoleSet = new Set<Role>([Role.MEMBER, Role.HOST, Role.ADMIN]);
const adminRoleSet = new Set<Role>([Role.ADMIN]);

function logAdminAccessDenied({
  role,
  path,
  requestId,
  reason,
}: {
  role: string;
  path: string;
  requestId: string;
  reason: "UNAUTHENTICATED" | "INSUFFICIENT_ROLE";
}) {
  console.warn(
    JSON.stringify({
      event: "admin_access_denied",
      role,
      path,
      requestId,
      reason,
    }),
  );
}

export function handleProtectedRoutes(req: AuthenticatedRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth;

  const requiresMember = memberRoutes.some((route) => pathname.startsWith(route));
  const requiresHost = hostRoutes.some((route) => pathname.startsWith(route));
  const requiresAdmin = adminRoutes.some((route) => pathname.startsWith(route));

  if (!requiresMember && !requiresHost && !requiresAdmin) {
    return NextResponse.next();
  }

  if (!session?.user) {
    if (requiresAdmin) {
      logAdminAccessDenied({
        role: "ANONYMOUS",
        path: pathname,
        requestId: req.headers.get("x-request-id") ?? "unknown",
        reason: "UNAUTHENTICATED",
      });
    }

    const loginUrl = absoluteUrl(req, "/login");
    const redirectValue = nextUrl.pathname + nextUrl.search;
    loginUrl.searchParams.set("redirectTo", redirectValue);
    loginUrl.searchParams.set("callbackUrl", redirectValue);
    return NextResponse.redirect(loginUrl, 302);
  }

  const role = session.user?.role;

  if (requiresAdmin && (!role || !adminRoleSet.has(role))) {
    logAdminAccessDenied({
      role: role ?? "UNKNOWN",
      path: pathname,
      requestId: req.headers.get("x-request-id") ?? "unknown",
      reason: "INSUFFICIENT_ROLE",
    });
    const forbiddenUrl = absoluteUrl(req, "/forbidden");
    return NextResponse.rewrite(forbiddenUrl, { status: 403 });
  }

  if (requiresHost && (!role || !hostRoleSet.has(role))) {
    return NextResponse.redirect(absoluteUrl(req, "/dashboard"));
  }

  if (requiresMember && (!role || !memberRoleSet.has(role))) {
    return NextResponse.redirect(absoluteUrl(req, "/apply"));
  }

  return NextResponse.next();
}

export default auth(handleProtectedRoutes);

const protectedMatchers = [
  "/dashboard",
  "/dashboard/:path*",
  "/events",
  "/events/:path*",
  "/host",
  "/host/:path*",
  "/admin",
  "/admin/:path*",
];

export const config = {
  matcher: protectedMatchers,
};
