import { describe, expect, it } from "vitest";
import { getConfigForCountry, DEFAULT_COUNTRY_INTL_CONFIG } from "../geoConfig";

const CASES: Array<[string, string, string]> = [
  ["US", "en-US", "USD"],
  ["GB", "en-GB", "GBP"],
  ["FR", "fr-FR", "EUR"],
  ["IE", "en-IE", "EUR"],
  ["DE", "de-DE", "EUR"],
  ["CH", "de-CH", "CHF"],
  ["SE", "sv-SE", "SEK"],
  ["NO", "nb-NO", "NOK"],
  ["DK", "da-DK", "DKK"],
  ["JP", "ja-JP", "JPY"],
  ["SG", "en-SG", "SGD"],
  ["HK", "zh-HK", "HKD"],
  ["AU", "en-AU", "AUD"],
  ["NZ", "en-NZ", "NZD"],
  ["CA", "en-CA", "CAD"],
];

describe("getConfigForCountry", () => {
  it("returns mapped locales and currencies for key markets", () => {
    for (const [country, locale, currency] of CASES) {
      expect(getConfigForCountry(country)).toEqual({ locale, currency });
    }
  });

  it("falls back to the default config when country is unknown", () => {
    expect(getConfigForCountry("XX")).toEqual(DEFAULT_COUNTRY_INTL_CONFIG);
    expect(getConfigForCountry(" ")).toEqual(DEFAULT_COUNTRY_INTL_CONFIG);
    expect(getConfigForCountry(undefined as unknown as string)).toEqual(DEFAULT_COUNTRY_INTL_CONFIG);
  });
});
