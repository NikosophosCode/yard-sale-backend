import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import logger from '@/utils/logger';

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    // Verificar si el email ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'El email ya está registrado',
      });
    }

    // Crear usuario
    const user = new User({
      name,
      email,
      password, // El middleware de Mongoose lo hasheará automáticamente
    });

    await user.save();

    // Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`Nuevo usuario registrado: ${email}`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error('Error en registro:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al registrar usuario',
    });
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Buscar usuario (incluir password)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email o contraseña incorrectos',
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Tu cuenta ha sido desactivada',
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email o contraseña incorrectos',
      });
    }

    // Actualizar lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`Usuario autenticado: ${email}`);

    res.status(200).json({
      message: 'Login exitoso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error('Error en login:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al iniciar sesión',
    });
  }
};

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refrescar access token usando refresh token
 * @access  Public
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token no proporcionado',
      });
    }

    // Verificar refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Buscar usuario
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuario no válido',
      });
    }

    // Generar nuevo access token
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    logger.error('Error al refrescar token:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Refresh token inválido o expirado',
    });
  }
};

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Solicitar reset de contraseña
 * @access  Public
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const { email } = req.body;

    const user = await User.findByEmail(email);

    if (!user) {
      // No revelar si el email existe o no (seguridad)
      return res.status(200).json({
        message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña',
      });
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora

    await user.save();

    // TODO: Enviar email con el token (implementar en Fase 5)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    logger.info(`Reset password solicitado para: ${email}`);
    logger.info(`Reset URL (DEV): ${resetUrl}`);

    res.status(200).json({
      message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña',
      // Solo en desarrollo
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl }),
    });
  } catch (error: any) {
    logger.error('Error en forgot password:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al procesar solicitud',
    });
  }
};

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Resetear contraseña usando token
 * @access  Public
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const { token, password } = req.body;

    // Hashear token para buscar en DB
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con token válido y no expirado
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Token inválido o expirado',
      });
    }

    // Actualizar contraseña
    user.password = password; // El middleware lo hasheará
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    logger.info(`Contraseña reseteada para: ${user.email}`);

    res.status(200).json({
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error: any) {
    logger.error('Error en reset password:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al resetear contraseña',
    });
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener datos del usuario autenticado
 * @access  Private
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuario no autenticado',
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Usuario no encontrado',
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error: any) {
    logger.error('Error al obtener perfil:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al obtener datos del usuario',
    });
  }
};

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Cambiar contraseña (usuario autenticado)
 * @access  Private
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuario no autenticado',
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Buscar usuario con password
    const user = await User.findById(req.user.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Usuario no encontrado',
      });
    }

    // Verificar contraseña actual
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Contraseña actual incorrecta',
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    logger.info(`Contraseña cambiada para: ${user.email}`);

    res.status(200).json({
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error: any) {
    logger.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al cambiar contraseña',
    });
  }
};
