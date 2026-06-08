const jwt = require('jsonwebtoken');
const { setAuthCookie } = require('./cookies');

function createSessionToken(user, rememberMe = true) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? '30d' : '8h' }
  );
}

function signInWithCookie(res, user, rememberMe = true) {
  const token = createSessionToken(user, rememberMe);
  setAuthCookie(res, token, rememberMe);
}

module.exports = {
  createSessionToken,
  signInWithCookie,
};