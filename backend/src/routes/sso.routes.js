const express = require('express');

const prisma = require('../db');
const { findOrCreateSsoUser } = require('../services/sso.service');
const { signInWithCookie } = require('../utils/authToken');

const router = express.Router();

function buildMicrosoftAuthorizeUrl(state) {
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri:
      process.env.MICROSOFT_REDIRECT_URI ||
      'http://localhost:3000/auth/sso/microsoft/callback',
    response_mode: 'query',
    scope: 'openid profile email User.Read',
    state,
    prompt: 'select_account',
  });

  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

function decodeJwtPayload(token) {
  const payload = token.split('.')[1];

  if (!payload) {
    throw new Error('Invalid ID token');
  }

  const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(normalizedPayload, 'base64').toString('utf8');

  return JSON.parse(json);
}

async function exchangeCodeForToken(code) {
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    code,
    redirect_uri:
      process.env.MICROSOFT_REDIRECT_URI ||
      'http://localhost:3000/auth/sso/microsoft/callback',
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Token exchange failed');
  }

  return data;
}

router.get('/microsoft', async (req, res) => {
  try {
    if (!process.env.MICROSOFT_CLIENT_ID) {
      return res.status(500).json({
        error: 'Microsoft SSO is not configured',
      });
    }

    const state = crypto.randomUUID();

    res.cookie('sso_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 10 * 60 * 1000,
    });

    return res.redirect(buildMicrosoftAuthorizeUrl(state));
  } catch (error) {
    console.error('GET /auth/sso/microsoft error:', error);

    return res.status(500).json({
      error: 'Could not start Microsoft SSO',
      message: error.message,
    });
  }
});

router.get('/microsoft/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    if (!state || state !== req.cookies.sso_state) {
      return res.status(400).json({ error: 'Invalid SSO state' });
    }

    const tokenResponse = await exchangeCodeForToken(code);

    if (!tokenResponse.id_token) {
      return res.status(400).json({ error: 'Missing ID token from Microsoft' });
    }

    const claims = decodeJwtPayload(tokenResponse.id_token);

    const email = claims.email || claims.preferred_username || claims.upn;

    if (!email) {
      return res.status(400).json({
        error: 'Microsoft account did not return an email',
      });
    }

    const user = await findOrCreateSsoUser({
      email,
      firstName: claims.given_name || claims.name?.split(' ')[0] || 'Unknown',
      lastName:
        claims.family_name ||
        claims.name?.split(' ').slice(1).join(' ') ||
        'User',
      provider: 'MICROSOFT',
      providerId: claims.sub,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SSO_LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        metadata: JSON.stringify({
          provider: 'MICROSOFT',
          email: user.email,
        }),
      },
    });

    signInWithCookie(res, user, true);

    res.clearCookie('sso_state', { path: '/' });

    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
    );
  } catch (error) {
    console.error('GET /auth/sso/microsoft/callback error:', error);

    return res.status(500).json({
      error: 'Microsoft SSO failed',
      message: error.message,
    });
  }
});

module.exports = router;