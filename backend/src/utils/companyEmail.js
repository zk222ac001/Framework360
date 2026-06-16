const PERSONAL_EMAIL_DOMAINS = new Set([
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

function getEmailDomain(email) {
  if (typeof email !== "string") return "";

  const normalizedEmail = email.trim().toLowerCase();
  const atIndex = normalizedEmail.lastIndexOf("@");

  if (atIndex === -1) return "";

  return normalizedEmail.slice(atIndex + 1);
}

function isCompanyEmail(email) {
  const domain = getEmailDomain(email);

  return Boolean(domain) && !PERSONAL_EMAIL_DOMAINS.has(domain);
}

module.exports = {
  PERSONAL_EMAIL_DOMAINS,
  getEmailDomain,
  isCompanyEmail,
};
