import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import logger from '@/utils/logger';

/**
 * Middleware para verificar JWT en headers
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de autenticación no proporcionado',
      });
    }

    // Extraer token
    const token = authHeader.substring(7); // Quitar "Bearer "

    // Verificar token
    const decoded = verifyAccessToken(token);

    // Agregar datos del usuario a la request
    req.user = decoded;

    next();
  } catch (error: any) {
    logger.warn('Token inválido:', error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido o expirado',
    });
  }
};

/**
 * Middleware para verificar roles
 * Uso: authorize('admin') o authorize('admin', 'moderator')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuario no autenticado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No tienes permisos para acceder a este recurso',
      });
    }

    next();
  };
};

/**
 * Middleware opcional: permite requests sin autenticación
 * pero agrega user si hay token válido
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Ignorar errores y continuar sin autenticación
    next();
  }
};
