import { DEFAULT_INTL_CONFIG, IntlConfig, resolveIntlConfig } from "./resolveIntlConfig";

export type FormatPriceOptions = {
  amountMinor: number;
  currencyOverride?: string | null;
  intlConfig?: IntlConfig;
};

export function formatPrice({ amountMinor, currencyOverride, intlConfig }: FormatPriceOptions): string {
  const config = intlConfig ?? resolveIntlConfig();
  const locale = config.locale || DEFAULT_INTL_CONFIG.locale;
  const currency = (currencyOverride ?? config.currency ?? DEFAULT_INTL_CONFIG.currency).toUpperCase();
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  });
  return formatter.format(amountMinor / 100);
}

type EventDateTimeFormatStyle = "short" | "long";

export type FormatEventDateTimeOptions = {
  start: Date | string;
  end?: Date | string | null;
  tzOverride?: string | null;
  intlConfig?: IntlConfig;
  style?: EventDateTimeFormatStyle;
};

export type EventDateTimeLabels = {
  list: string;
  detail: string;
};

export function formatEventDateTime({
  start,
  end,
  tzOverride,
  intlConfig,
  style = "short",
}: FormatEventDateTimeOptions): EventDateTimeLabels {
  const config = intlConfig ?? resolveIntlConfig();
  const locale = config.locale || DEFAULT_INTL_CONFIG.locale;
  const tz = normalizeTimeZone(tzOverride ?? config.tz ?? DEFAULT_INTL_CONFIG.tz);
  const startDate = toDate(start);
  const endDate = end ? toDate(end) : null;

  const listDateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  });
  const listTimeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });
  const list = `${listDateFormatter.format(startDate)} · ${listTimeFormatter.format(startDate)}`;

  const detailedDateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: tz,
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });
  const timeFormatterWithZone = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
    timeZoneName: style === "long" ? "long" : "short",
  });
  const dateOnlyFormatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  });

  const startDateLabel = detailedDateFormatter.format(startDate);
  const startTime = timeFormatter.format(startDate);
  const endTime = endDate ? timeFormatter.format(endDate) : null;
  const tzName = extractTimeZoneName(timeFormatterWithZone, endDate ?? startDate);
  const sameDay = endDate ? dateOnlyFormatter.format(startDate) === dateOnlyFormatter.format(endDate) : true;

  let detail: string;
  if (!endDate) {
    detail = `${startDateLabel} · ${timeFormatterWithZone.format(startDate)}`;
  } else if (sameDay) {
    const endTimeWithFallback = endTime ?? timeFormatter.format(endDate);
    detail = `${startDateLabel} · ${startTime} – ${endTimeWithFallback}${tzName ? ` ${tzName}` : ""}`;
  } else {
    const endDateLabel = detailedDateFormatter.format(endDate);
    const endTimeLabel = endTime ?? timeFormatter.format(endDate);
    detail = `${startDateLabel} · ${startTime} → ${endDateLabel} · ${endTimeLabel}${tzName ? ` ${tzName}` : ""}`;
  }

  return { list, detail };
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function normalizeTimeZone(candidate: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate });
    return candidate;
  } catch {
    return DEFAULT_INTL_CONFIG.tz;
  }
}

function extractTimeZoneName(formatter: Intl.DateTimeFormat, date: Date): string {
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find((part) => part.type === "timeZoneName");
  return tzPart?.value ?? "";
}
