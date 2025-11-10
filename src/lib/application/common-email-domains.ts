export const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "live.com",
  "msn.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "hey.com",
  "fastmail.com",
  "mail.com",
  "aol.com",
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "yandex.com",
  "yandex.ru",
  "inbox.com",
  "mail.ru",
  "qq.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "seznam.cz",
  "wp.pl",
  "o2.pl",
  "interia.pl",
  "onet.pl",
  "free.fr",
  "orange.fr",
  "wanadoo.fr",
  "laposte.net",
  "virgilio.it",
  "libero.it",
  "tin.it",
  "alice.it",
  "tiscali.it",
  "web.de",
  "posteo.de",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
  "sina.com",
  "163.com",
  "126.com",
  "yeah.net",
  "rediffmail.com",
] as const;

const COMMON_EMAIL_DOMAIN_SET = new Set<string>(COMMON_EMAIL_DOMAINS);

export function getEmailDomain(email: string): string | null {
  const [, domain] = email.toLowerCase().split("@");
  return domain ?? null;
}

export function isCommonEmailDomain(emailOrDomain: string): boolean {
  const domain = emailOrDomain.includes("@")
    ? getEmailDomain(emailOrDomain)
    : emailOrDomain.toLowerCase();

  if (!domain) {
    return false;
  }

  return COMMON_EMAIL_DOMAIN_SET.has(domain);
}
