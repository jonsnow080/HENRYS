export type CountryIntlConfig = {
  locale: string;
  currency: string;
};

const COUNTRY_CONFIG: Record<string, CountryIntlConfig> = {
  US: { locale: "en-US", currency: "USD" },
  GB: { locale: "en-GB", currency: "GBP" },
  IE: { locale: "en-IE", currency: "EUR" },
  FR: { locale: "fr-FR", currency: "EUR" },
  DE: { locale: "de-DE", currency: "EUR" },
  ES: { locale: "es-ES", currency: "EUR" },
  IT: { locale: "it-IT", currency: "EUR" },
  NL: { locale: "nl-NL", currency: "EUR" },
  BE: { locale: "fr-BE", currency: "EUR" },
  AT: { locale: "de-AT", currency: "EUR" },
  PT: { locale: "pt-PT", currency: "EUR" },
  CH: { locale: "de-CH", currency: "CHF" },
  SE: { locale: "sv-SE", currency: "SEK" },
  NO: { locale: "nb-NO", currency: "NOK" },
  DK: { locale: "da-DK", currency: "DKK" },
  CA: { locale: "en-CA", currency: "CAD" },
  AU: { locale: "en-AU", currency: "AUD" },
  NZ: { locale: "en-NZ", currency: "NZD" },
  JP: { locale: "ja-JP", currency: "JPY" },
  SG: { locale: "en-SG", currency: "SGD" },
  HK: { locale: "zh-HK", currency: "HKD" },
};

const DEFAULT_CONFIG: CountryIntlConfig = { locale: "en-GB", currency: "GBP" };

export function getConfigForCountry(country: string | null | undefined): CountryIntlConfig {
  if (!country) {
    return DEFAULT_CONFIG;
  }

  const normalized = country.trim().toUpperCase();
  if (!normalized) {
    return DEFAULT_CONFIG;
  }

  return COUNTRY_CONFIG[normalized] ?? DEFAULT_CONFIG;
}

export { DEFAULT_CONFIG as DEFAULT_COUNTRY_INTL_CONFIG };
