const personalEmailDomains = new Set([
  "aol.com",
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "mail.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "yahoo.com",
  "yandex.com",
]);

function getEmailDomain(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const atIndex = normalizedEmail.lastIndexOf("@");

  if (atIndex === -1) return "";

  return normalizedEmail.slice(atIndex + 1);
}

export function isCompanyEmail(email: string) {
  const domain = getEmailDomain(email);

  return Boolean(domain) && !personalEmailDomains.has(domain);
}
