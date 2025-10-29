import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
} from '@/controllers/auth.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} from '@/validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', registerValidation, register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refrescar access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Solicitar reset de contraseña
 * @access  Public
 */
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Resetear contraseña con token
 * @access  Public
 */
router.post('/reset-password', resetPasswordValidation, resetPassword);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private
 */
router.post('/change-password', authenticate, changePasswordValidation, changePassword);

export default router;
