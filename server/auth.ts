import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

const sessionCookieName = 'academic_nexus_demo_session';
const sessionLifetimeSeconds = 12 * 60 * 60;
const failedLoginLimit = 10;
const failedLoginWindowMs = 15 * 60 * 1000;
const failedLoginAttempts = new Map<string, number[]>();
const workspaceIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const demoPassword = process.env.DEMO_PASSWORD;
const sessionSecret = process.env.SESSION_SECRET;

if (!demoPassword || demoPassword.length < 16) {
  throw new Error('DEMO_PASSWORD is required and must be at least 16 characters.');
}
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET is required and must be at least 32 characters.');
}

export function login(req: Request, res: Response) {
  const address = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();
  const recentAttempts = (failedLoginAttempts.get(address) ?? []).filter(
    (timestamp) => now - timestamp < failedLoginWindowMs
  );
  if (recentAttempts.length >= failedLoginLimit) {
    failedLoginAttempts.set(address, recentAttempts);
    res.status(429).json({ error: 'Too many sign-in attempts. Try again later.' });
    return;
  }

  const submittedPassword =
    req.body && typeof req.body === 'object' && typeof req.body.password === 'string'
      ? req.body.password
      : '';
  const workspaceId =
    req.body && typeof req.body === 'object' && typeof req.body.workspaceId === 'string'
      ? req.body.workspaceId
      : '';
  if (
    submittedPassword.length > 256 ||
    !workspaceIdPattern.test(workspaceId) ||
    !passwordMatches(submittedPassword)
  ) {
    recentAttempts.push(now);
    failedLoginAttempts.set(address, recentAttempts);
    res.status(401).json({ error: 'The demo password is incorrect.' });
    return;
  }

  failedLoginAttempts.delete(address);
  const expiresAt = Math.floor(now / 1000) + sessionLifetimeSeconds;
  const nonce = randomBytes(32).toString('hex');
  const payload = `${expiresAt}.${nonce}.${workspaceId}`;
  const signature = sign(payload);
  res.setHeader('Set-Cookie', serializeCookie(`${payload}.${signature}`, sessionLifetimeSeconds));
  res.setHeader('Cache-Control', 'no-store');
  res.json({ authenticated: true, workspaceId });
}

export function sessionStatus(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ authenticated: isAuthenticated(req) });
}

export function logout(_req: Request, res: Response) {
  res.setHeader('Set-Cookie', serializeCookie('', 0));
  res.setHeader('Cache-Control', 'no-store');
  res.json({ authenticated: false });
}

export function requireDemoSession(req: Request, res: Response, next: NextFunction) {
  const sessionWorkspaceId = getSessionWorkspaceId(req);
  if (!sessionWorkspaceId) {
    res.status(401).json({ error: 'Sign in to access the Academic Nexus demo.' });
    return;
  }
  if (sessionWorkspaceId !== req.params.workspaceId) {
    res.status(403).json({ error: 'You do not have access to this demo workspace.' });
    return;
  }
  next();
}

function passwordMatches(submittedPassword: string) {
  const submittedDigest = createHash('sha256').update(submittedPassword).digest();
  const expectedDigest = createHash('sha256').update(demoPassword!).digest();
  return timingSafeEqual(submittedDigest, expectedDigest);
}

function isAuthenticated(req: Request) {
  return getSessionWorkspaceId(req) !== null;
}

function getSessionWorkspaceId(req: Request): string | null {
  const cookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`));
  if (!cookie) return null;

  const value = cookie.slice(sessionCookieName.length + 1);
  const parts = value.split('.');
  if (parts.length !== 4) return null;
  const [expiresAt, nonce, workspaceId, providedSignature] = parts;
  if (
    !/^\d+$/.test(expiresAt) ||
    !/^[a-f0-9]{64}$/.test(nonce) ||
    !workspaceIdPattern.test(workspaceId) ||
    !/^[a-f0-9]{64}$/.test(providedSignature)
  ) return null;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return null;

  const payload = `${expiresAt}.${nonce}.${workspaceId}`;
  const expectedSignature = Buffer.from(sign(payload), 'hex');
  const actualSignature = Buffer.from(providedSignature, 'hex');
  if (actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)) return null;
  return workspaceId;
}

function sign(payload: string) {
  return createHmac('sha256', sessionSecret!).update(payload).digest('hex');
}

function serializeCookie(value: string, maxAge: number) {
  const parts = [
    `${sessionCookieName}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}
