import { cookies, headers } from "next/headers";
import { DEFAULT_COUNTRY_INTL_CONFIG, getConfigForCountry } from "./geoConfig";

export type IntlConfig = {
  locale: string;
  currency: string;
  tz: string;
};

const GEO_COOKIE_NAME = "henrys.geo";
const OVERRIDE_COOKIE_NAME = "henrys.intlOverride";
const GEO_HEADER_NAME = "x-henrys-geo";
const VERCEL_TZ_HEADER = "x-vercel-ip-timezone";

const LANGUAGE_FALLBACKS: Record<string, { locale: string; currency: string }> = {
  en: DEFAULT_COUNTRY_INTL_CONFIG,
  fr: { locale: "fr-FR", currency: "EUR" },
  de: { locale: "de-DE", currency: "EUR" },
  es: { locale: "es-ES", currency: "EUR" },
  it: { locale: "it-IT", currency: "EUR" },
  nl: { locale: "nl-NL", currency: "EUR" },
  pt: { locale: "pt-PT", currency: "EUR" },
  sv: { locale: "sv-SE", currency: "SEK" },
  da: { locale: "da-DK", currency: "DKK" },
  nb: { locale: "nb-NO", currency: "NOK" },
  ja: { locale: "ja-JP", currency: "JPY" },
  zh: { locale: "zh-HK", currency: "HKD" },
};

export const DEFAULT_INTL_CONFIG: IntlConfig = {
  ...DEFAULT_COUNTRY_INTL_CONFIG,
  tz: "UTC",
};

type GeoPayload = {
  country?: string;
  tz?: string;
  v?: number;
  src?: string;
};

type OverridePayload = {
  locale?: string;
  currency?: string;
  tz?: string;
};

function safeParse<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isValidTimeZone(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function pickTimeZone(candidate?: string | null): string {
  if (isValidTimeZone(candidate)) {
    return candidate;
  }
  const headerTz = headers().get(VERCEL_TZ_HEADER);
  if (isValidTimeZone(headerTz)) {
    return headerTz;
  }
  return DEFAULT_INTL_CONFIG.tz;
}

function inferFromAcceptLanguage(): { locale: string; currency: string } | null {
  const acceptLanguage = headers().get("accept-language");
  if (!acceptLanguage) {
    return null;
  }

  const entries = acceptLanguage.split(",").map((part) => part.trim()).filter(Boolean);
  for (const entry of entries) {
    const [tag] = entry.split(";");
    if (!tag) {
      continue;
    }
    const [language, region] = tag.split("-");
    if (region) {
      const config = getConfigForCountry(region);
      if (config) {
        return config;
      }
    }
    if (language) {
      const normalizedLanguage = language.toLowerCase();
      const config = LANGUAGE_FALLBACKS[normalizedLanguage];
      if (config) {
        return config;
      }
    }
  }
  return null;
}

function parseGeoPayloadFromSources(): GeoPayload | null {
  const store = cookies();
  const cookieValue = store.get(GEO_COOKIE_NAME)?.value ?? null;
  const headerValue = headers().get(GEO_HEADER_NAME);
  return safeParse<GeoPayload>(cookieValue) ?? safeParse<GeoPayload>(headerValue);
}

function parseOverrideConfig(): IntlConfig | null {
  const overrideValue = cookies().get(OVERRIDE_COOKIE_NAME)?.value ?? null;
  const payload = safeParse<OverridePayload>(overrideValue);
  if (!payload) {
    return null;
  }

  const locale = typeof payload.locale === "string" && payload.locale.trim() ? payload.locale : null;
  const currency = typeof payload.currency === "string" && payload.currency.trim() ? payload.currency.toUpperCase() : null;
  const tz = isValidTimeZone(payload.tz) ? payload.tz : null;
  if (!locale || !currency) {
    return null;
  }
  return { locale, currency, tz: tz ?? DEFAULT_INTL_CONFIG.tz };
}

export function resolveIntlConfig(): IntlConfig {
  const override = parseOverrideConfig();
  if (override) {
    return override;
  }

  const geoPayload = parseGeoPayloadFromSources();
  if (geoPayload?.country) {
    const baseConfig = getConfigForCountry(geoPayload.country);
    const tz = pickTimeZone(geoPayload.tz ?? null);
    return { ...baseConfig, tz };
  }

  const acceptLanguageConfig = inferFromAcceptLanguage();
  if (acceptLanguageConfig) {
    return { ...acceptLanguageConfig, tz: pickTimeZone(null) };
  }

  return DEFAULT_INTL_CONFIG;
}

export function getCurrentGeoPayload(): GeoPayload | null {
  return parseGeoPayloadFromSources();
}
