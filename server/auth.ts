import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'pardis_taxi_secure_jwt_secret_2026';

export interface AuthUser {
  id: number;
  mobile: string;
  full_name: string;
  role: 'ADMIN' | 'OPERATOR' | 'DRIVER';
  driver_id?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    mobile: user.mobile,
    full_name: user.full_name,
    role: user.role,
    driver_id: user.driver_id,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(str).digest('base64url');
  return `${str}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [str, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(str).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload as AuthUser;
  } catch {
    return null;
  }
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'لطفاً وارد حساب کاربری خود شوید.' });
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'نشست کاربری شما منقضی شده است. لطفاً دوباره وارد شوید.' });
  }

  // Check if user still exists and is active
  const dbUser = db.prepare('SELECT id, is_active FROM users WHERE id = ?').get(user.id) as { id: number; is_active: number } | undefined;
  if (!dbUser || dbUser.is_active !== 1) {
    return res.status(403).json({ error: 'حساب کاربری شما غیرفعال یا مسدود است.' });
  }

  // If driver, verify driver id
  if (user.role === 'DRIVER' && !user.driver_id) {
    const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (driver) {
      user.driver_id = driver.id;
    }
  }

  req.user = user;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'عدم احراز هویت.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'شما دسترسی لازم برای این عملیات را ندارید.' });
    }
    next();
  };
}
