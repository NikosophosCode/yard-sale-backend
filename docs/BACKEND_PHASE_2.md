# 🔐 FASE 2: Autenticación y Autorización
## JWT + Bcrypt + Middleware de Seguridad

**Duración Estimada**: 2-3 días  
**Complejidad**: Media-Alta  
**Prerequisitos**: Fase 1 completada

---

## 📋 Objetivos de la Fase

- ✅ Crear modelo de Usuario con Mongoose
- ✅ Implementar hash de contraseñas con bcrypt
- ✅ Crear sistema de autenticación con JWT
- ✅ Endpoints de registro y login
- ✅ Middleware de autenticación (verificar JWT)
- ✅ Middleware de autorización (roles)
- ✅ Recuperación de contraseña
- ✅ Actualización de perfil
- ✅ Cambio de contraseña
- ✅ Rate limiting específico para auth
- ✅ Refresh tokens (opcional pero recomendado)

---

## 📦 Paso 1: Instalar Dependencias

```powershell
# Autenticación y seguridad
npm install bcrypt jsonwebtoken
npm install -D @types/bcrypt @types/jsonwebtoken

# Validación
npm install express-validator

# Generación de tokens aleatorios
npm install crypto
```

---

## 🗃️ Paso 2: Crear Modelo de Usuario

### 2.1 Crear `src/models/User.ts`

```typescript
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// Interfaz para Address
export interface IAddress {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// Interfaz del documento de Usuario
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  avatar: string | null;
  addresses: IAddress[];
  isActive: boolean;
  emailVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interfaz del modelo (métodos estáticos)
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

// Schema de Address
const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'México' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

// Schema de User
const UserSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [50, 'El nombre no puede tener más de 50 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false, // No incluir el password por defecto en las consultas
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: null,
    },
    addresses: {
      type: [AddressSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ===========================
// Middleware: Hash password antes de guardar
// ===========================
UserSchema.pre('save', async function (next) {
  // Solo hash si el password ha sido modificado
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// ===========================
// Métodos de Instancia
// ===========================

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// ===========================
// Métodos Estáticos
// ===========================

// Encontrar usuario por email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Índices
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Crear y exportar modelo
const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;
```

---

## 🔧 Paso 3: Utilidades para JWT

### 3.1 Crear `src/utils/jwt.ts`

```typescript
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
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generar Access Token (JWT)
 */
export const generateAccessToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Generar Refresh Token
 */
export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    userId: user._id.toString(),
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
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
```

### 3.2 Actualizar `.env` con secrets JWT

```env
# JWT Configuration
JWT_SECRET=super-secret-jwt-key-min-32-chars-abcdef123456789
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=super-secret-refresh-key-min-32-chars-xyz987654321
JWT_REFRESH_EXPIRES_IN=30d
```

**⚠️ IMPORTANTE:** Genera secrets seguros en producción:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🛡️ Paso 4: Middleware de Autenticación

### 4.1 Crear tipos extendidos `src/types/express.d.ts`

```typescript
import { JWTPayload } from '@/utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export {};
```

### 4.2 Crear `src/middlewares/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '@/utils/jwt';
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
 * Uso: authorize('admin') o authorize(['admin', 'moderator'])
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
```

---

## ✅ Paso 5: Validadores de Autenticación

### 5.1 Crear `src/validators/auth.validator.ts`

```typescript
import { body, ValidationChain } from 'express-validator';

/**
 * Validaciones para registro de usuario
 */
export const registerValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Debes confirmar tu contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
];

/**
 * Validaciones para login
 */
export const loginValidation: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),

  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

/**
 * Validaciones para recuperación de contraseña
 */
export const forgotPasswordValidation: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
];

/**
 * Validaciones para resetear contraseña
 */
export const resetPasswordValidation: ValidationChain[] = [
  body('token').notEmpty().withMessage('El token es requerido'),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Debes confirmar tu contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
];

/**
 * Validaciones para cambiar contraseña
 */
export const changePasswordValidation: ValidationChain[] = [
  body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),

  body('newPassword')
    .notEmpty()
    .withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Debes confirmar tu nueva contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
];
```

---

## 🎯 Paso 6: Controlador de Autenticación

### 6.1 Crear `src/controllers/auth.controller.ts`

```typescript
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
```

---

*Continúa en la siguiente parte debido a la extensión...*
