import { NextResponse, type NextRequest } from "next/server";
import { Role } from "@/lib/prisma-constants";
import { auth } from "./auth";

const GEO_COOKIE_NAME = "henrys.geo";
const GEO_HEADER_NAME = "x-henrys-geo";
const GEO_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const memberRoutes = ["/dashboard", "/events/"];
const hostRoutes = ["/host"];
const hostRoleSet = new Set<Role>([Role.HOST, Role.ADMIN]);
const memberRoleSet = new Set<Role>([Role.MEMBER, Role.HOST, Role.ADMIN]);

type GeoCookieValue = {
  country: string;
  tz: string;
  v: number;
  src: "edge";
};

export default auth((req) => {
  const requestHeaders = new Headers(req.headers);
  const geoPayload = deriveGeoPayload(req);
  if (geoPayload) {
    requestHeaders.set(GEO_HEADER_NAME, JSON.stringify(geoPayload));
  }

  const response = handleAccessControl(req, requestHeaders);

  if (geoPayload) {
    attachGeoCookie(req, response, geoPayload);
  }

  return response;
});

function handleAccessControl(req: NextRequest, requestHeaders: Headers) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth;

  const requiresMember = memberRoutes.some((route) => pathname.startsWith(route));
  const requiresHost = hostRoutes.some((route) => pathname.startsWith(route));

  if (!requiresMember && !requiresHost) {
    return NextResponse.next({ request: { headers: requestHeaders } });
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

  return NextResponse.next({ request: { headers: requestHeaders } });
}

function deriveGeoPayload(req: NextRequest): GeoCookieValue | null {
  const country = req.geo?.country?.toUpperCase();
  const tz = req.headers.get("x-vercel-ip-timezone");
  if (!country || !tz) {
    return null;
  }
  return { country, tz, v: 1, src: "edge" };
}

function attachGeoCookie(req: NextRequest, response: NextResponse, payload: GeoCookieValue) {
  const existing = req.cookies.get(GEO_COOKIE_NAME)?.value ?? null;
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as GeoCookieValue;
      if (parsed.country === payload.country && parsed.tz === payload.tz && parsed.v === payload.v) {
        return;
      }
    } catch {
      // ignore malformed cookie values
    }
  }
  response.cookies.set(GEO_COOKIE_NAME, JSON.stringify(payload), {
    sameSite: "lax",
    secure: true,
    httpOnly: false,
    path: "/",
    maxAge: GEO_MAX_AGE_SECONDS,
  });
}

export const config = {
  matcher: ["/((?!api/stripe/webhooks|_next/static|_next/image|favicon.ico).*)"],
};
