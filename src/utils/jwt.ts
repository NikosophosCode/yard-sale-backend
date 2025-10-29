import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';

// Payload del JWT
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Opciones por defecto
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

/**
 * Generar Access Token (JWT)
 */
export const generateAccessToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET);
};

/**
 * Generar Refresh Token
 */
export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    userId: user._id.toString(),
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET);
};

/**
 * Verificar Access Token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

/**
 * Verificar Refresh Token
 */
export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Refresh token inválido o expirado');
  }
};

/**
 * Decodificar token sin verificar (útil para debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
