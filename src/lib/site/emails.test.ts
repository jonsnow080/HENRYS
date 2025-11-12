import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  CANONICAL_FROM_EMAIL,
  EMAIL_DOMAIN,
  assertCanonicalEmailEnv,
} from "./emails";

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.restoreAllMocks();
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key as keyof NodeJS.ProcessEnv];
    }
  }
  Object.assign(process.env, originalEnv);
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key as keyof NodeJS.ProcessEnv];
    }
  }
  Object.assign(process.env, originalEnv);
});

describe("assertCanonicalEmailEnv", () => {
  it("does not warn when all configured emails use the canonical domain", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_EMAIL_FROM = CANONICAL_FROM_EMAIL;
    process.env.RESEND_FROM_EMAIL = `Notifications <updates@${EMAIL_DOMAIN}>`;
    const warn = vi.fn();

    assertCanonicalEmailEnv({ warn });

    expect(warn).not.toHaveBeenCalled();
  });

  it("warns when any configured email uses a non-canonical domain", () => {
    process.env.NODE_ENV = "production";
    const legacyDomain = ["henrys", "house"].join(".");
    process.env.AUTH_EMAIL_FROM = `HENRY’S <support@${legacyDomain}>`;
    const warn = vi.fn();

    assertCanonicalEmailEnv({ warn });

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain(
      `AUTH_EMAIL_FROM uses non-canonical domain "${legacyDomain}"`,
    );
  });
});
