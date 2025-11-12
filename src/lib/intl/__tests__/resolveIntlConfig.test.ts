import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = new Map<string, string>();
const headerStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value ? { name, value } : undefined;
    },
  }),
  headers: () => ({
    get: (name: string) => headerStore.get(name) ?? null,
  }),
}));

import { DEFAULT_INTL_CONFIG, resolveIntlConfig } from "../resolveIntlConfig";

function setCookie(name: string, value: Record<string, unknown>) {
  cookieStore.set(name, JSON.stringify(value));
}

function setHeader(name: string, value: string | null) {
  if (value === null || value === undefined) {
    headerStore.delete(name);
    return;
  }
  headerStore.set(name, value);
}

beforeEach(() => {
  cookieStore.clear();
  headerStore.clear();
});

describe("resolveIntlConfig", () => {
  it("prefers explicit overrides when present", () => {
    setCookie("henrys.intlOverride", { locale: "en-US", currency: "USD", tz: "America/New_York" });
    const result = resolveIntlConfig();
    expect(result).toEqual({ locale: "en-US", currency: "USD", tz: "America/New_York" });
  });

  it("uses the geo cookie when available", () => {
    setCookie("henrys.geo", { country: "US", tz: "America/Los_Angeles", v: 1, src: "edge" });
    const result = resolveIntlConfig();
    expect(result.locale).toBe("en-US");
    expect(result.currency).toBe("USD");
    expect(result.tz).toBe("America/Los_Angeles");
  });

  it("falls back to geo header data when the cookie is missing", () => {
    setHeader("x-henrys-geo", JSON.stringify({ country: "SG", tz: "Asia/Singapore" }));
    const result = resolveIntlConfig();
    expect(result).toEqual({ locale: "en-SG", currency: "SGD", tz: "Asia/Singapore" });
  });

  it("infers locale from Accept-Language when no geo data exists", () => {
    setHeader("accept-language", "en-CA,en;q=0.9");
    setHeader("x-vercel-ip-timezone", "America/Toronto");
    const result = resolveIntlConfig();
    expect(result).toEqual({ locale: "en-CA", currency: "CAD", tz: "America/Toronto" });
  });

  it("uses language-only hints when region is missing", () => {
    setHeader("accept-language", "fr;q=0.8");
    setHeader("x-vercel-ip-timezone", "Europe/Paris");
    const result = resolveIntlConfig();
    expect(result).toEqual({ locale: "fr-FR", currency: "EUR", tz: "Europe/Paris" });
  });

  it("returns the default config when nothing else is available", () => {
    const result = resolveIntlConfig();
    expect(result).toEqual(DEFAULT_INTL_CONFIG);
  });
});
