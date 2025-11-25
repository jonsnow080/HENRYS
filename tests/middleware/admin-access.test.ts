import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Role } from "@/lib/prisma-constants";

vi.mock("../../auth", () => ({
  auth: <T>(handler: T) => handler,
}));

import { handleProtectedRoutes } from "../../middleware";

type MutableRequest = NextRequest & {
  auth?: {
    user?: {
      role?: Role | null;
    } | null;
  } | null;
};

describe("admin route RBAC middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects unauthenticated visitors to the login page with redirect parameters", () => {
    const request = new NextRequest(new URL("http://localhost:3000/admin"));
    const logSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = handleProtectedRoutes(request as MutableRequest);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirectTo=%2Fadmin&callbackUrl=%2Fadmin",
    );
    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        event: "admin_access_denied",
        role: "ANONYMOUS",
        path: "/admin",
        requestId: "unknown",
        reason: "UNAUTHENTICATED",
      }),
    );
  });

  it("returns a branded 403 for non-admin members", () => {
    const request = new NextRequest(new URL("http://localhost:3000/admin/events"), {
      headers: { "x-request-id": "test-request" },
    });

    (request as MutableRequest).auth = { user: { role: Role.MEMBER } };

    const logSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = handleProtectedRoutes(request as MutableRequest);

    expect(response.status).toBe(403);
    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/forbidden");
    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        event: "admin_access_denied",
        role: Role.MEMBER,
        path: "/admin/events",
        requestId: "test-request",
        reason: "INSUFFICIENT_ROLE",
      }),
    );
  });

  it("allows admins through without logging", () => {
    const request = new NextRequest(new URL("http://localhost:3000/admin"));
    (request as MutableRequest).auth = { user: { role: Role.ADMIN } };
    const logSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = handleProtectedRoutes(request as MutableRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(logSpy).not.toHaveBeenCalled();
  });
});
