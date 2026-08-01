import { SignJWT, jwtVerify } from 'jose';
import { parse, serialize } from 'cookie';
import bcrypt from 'bcryptjs';

function getSessionSecret() {
  let secret = process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    secret = 'vanguard_society_session_secret_32_characters_minimum_default_fallback';
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSessionSecret());
  return token;
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res, token) {
  const cookie = serialize('vanguard_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60
  });
  
  const existing = res.getHeader('Set-Cookie');
  if (existing) {
    res.setHeader('Set-Cookie', [].concat(existing, cookie));
  } else {
    res.setHeader('Set-Cookie', cookie);
  }
}

export function clearSessionCookie(res) {
  const cookie = serialize('vanguard_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0)
  });
  res.setHeader('Set-Cookie', cookie);
}

export function getSessionToken(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies.vanguard_session || cookies.member_session || cookies.admin_session || null;
}

export async function requireAuth(req, res, allowedRoles = []) {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  const payload = await verifySession(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    return null;
  }
  return payload;
}

// Backwards compatibility wrappers
export async function requireAdmin(req, res) {
  return requireAuth(req, res, ['admin']);
}

export async function requireMember(req, res) {
  // Both members and admins can do member things
  return requireAuth(req, res, ['member', 'admin']);
}

export const createMemberSession = createSession;
export const setMemberCookie = setSessionCookie;
export const clearMemberCookie = clearSessionCookie;
export const createAdminSession = createSession;
export const setAdminCookie = setSessionCookie;
export const clearAdminCookie = clearSessionCookie;
