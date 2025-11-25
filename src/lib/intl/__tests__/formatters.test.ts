import { describe, expect, it } from "vitest";
import { formatEventDateTime, formatPrice } from "../formatters";
import type { IntlConfig } from "../resolveIntlConfig";

const LONDON_INTL: IntlConfig = {
  locale: "en-GB",
  currency: "GBP",
  tz: "Europe/London",
};

function normalize(value: string) {
  return value.replace(/[\u00a0\u202f]/g, " ");
}

describe("formatPrice", () => {
  it("formats minor units into the configured currency", () => {
    expect(formatPrice({ amountMinor: 4500, intlConfig: LONDON_INTL })).toBe("£45.00");
  });

  it("respects currency overrides and localised spacing", () => {
    const euroConfig: IntlConfig = { locale: "fr-FR", currency: "EUR", tz: "Europe/Paris" };
    const label = formatPrice({ amountMinor: 4500, intlConfig: euroConfig });
    expect(normalize(label)).toBe("45,00 €");

    const yen = formatPrice({ amountMinor: 500000, intlConfig: LONDON_INTL, currencyOverride: "JPY" });
    expect(yen).toBe("JP¥5,000");
  });
});

describe("formatEventDateTime", () => {
  it("formats ranges across DST boundaries without gaps", () => {
    const result = formatEventDateTime({
      start: "2024-03-30T20:00:00Z",
      end: "2024-03-31T01:00:00Z",
      intlConfig: LONDON_INTL,
    });
    const detail = normalize(result.detail);
    expect(detail).toContain("20:00");
    expect(detail).toContain("2:00");
    expect(detail).toMatch(/BST|GMT/);
  });

  it("supports explicit timezone overrides", () => {
    const result = formatEventDateTime({
      start: "2024-05-01T18:00:00Z",
      end: "2024-05-01T20:00:00Z",
      intlConfig: LONDON_INTL,
      tzOverride: "America/New_York",
    });
    const detail = normalize(result.detail);
    expect(detail).toContain("14:00");
    expect(detail).toContain("16:00");
    expect(detail).toMatch(/GMT-4|EDT/);
  });
});
