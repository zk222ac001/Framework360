function getCookieOptions(rememberMe = false) {
  const isProd = process.env.NODE_ENV === "production";

  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };

  if (rememberMe) {
    options.maxAge = 30 * 24 * 60 * 60 * 1000;
  }

  return options;
}

const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-becompliant_access"
    : "becompliant_access";

function setAuthCookie(res, token, rememberMe = false) {
  res.cookie(COOKIE_NAME, token, getCookieOptions(rememberMe));
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, getCookieOptions(false));
}

module.exports = {
  setAuthCookie,
  clearAuthCookie,
};
