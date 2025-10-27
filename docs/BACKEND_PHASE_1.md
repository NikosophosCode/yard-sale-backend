# 🚀 FASE 1: Setup Inicial del Backend
## Node.js + Express + MongoDB + TypeScript

**Duración Estimada**: 1-2 días  
**Complejidad**: Baja  
**Prerequisitos**: Node.js 20+, MongoDB instalado o cuenta en Atlas

---

## 📋 Objetivos de la Fase

- ✅ Crear proyecto Node.js con TypeScript
- ✅ Configurar Express y middlewares esenciales
- ✅ Conectar a MongoDB (local o Atlas)
- ✅ Establecer estructura de carpetas
- ✅ Configurar variables de entorno
- ✅ Setup de logging con Winston
- ✅ Configurar ESLint + Prettier
- ✅ Crear scripts npm útiles
- ✅ Probar conexión con endpoint de health check

---

## 🛠️ Paso 1: Crear el Proyecto

### 1.1 Crear Carpeta y Inicializar npm

```powershell
# Navegar a la carpeta del proyecto principal
cd C:\Users\nicon\OneDrive\Documents\Proyectos\yard-sale-v2

# Crear carpeta del backend (al mismo nivel que el frontend)
mkdir yard-sale-backend
cd yard-sale-backend

# Inicializar npm
npm init -y
```

### 1.2 Instalar Dependencias Core

```powershell
# Dependencias de producción
npm install express mongoose dotenv cors helmet express-rate-limit

# TypeScript y tipos
npm install -D typescript @types/node @types/express @types/cors

# Herramientas de desarrollo
npm install -D nodemon ts-node @types/morgan morgan

# ESLint y Prettier
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier

# Logging
npm install winston winston-daily-rotate-file
```

**Resumen de paquetes:**
```json
{
  "dependencies": {
    "express": "^4.19.2",
    "mongoose": "^8.3.0",
    "dotenv": "^16.4.5",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.2.0",
    "winston": "^3.13.0",
    "winston-daily-rotate-file": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.12.7",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "nodemon": "^3.1.0",
    "ts-node": "^10.9.2",
    "eslint": "^8.57.0",
    "@typescript-eslint/parser": "^7.7.0",
    "@typescript-eslint/eslint-plugin": "^7.7.0",
    "prettier": "^3.2.5",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "morgan": "^1.10.0"
  }
}
```

---

## 📁 Paso 2: Crear Estructura de Carpetas

```powershell
# Crear todas las carpetas necesarias
mkdir src
mkdir src\config
mkdir src\models
mkdir src\controllers
mkdir src\routes
mkdir src\middlewares
mkdir src\validators
mkdir src\services
mkdir src\utils
mkdir src\types
mkdir src\tests
mkdir src\tests\unit
mkdir src\tests\integration
mkdir uploads
mkdir logs

# Crear archivos principales
New-Item src\app.ts
New-Item src\server.ts
New-Item .env
New-Item .env.example
New-Item .gitignore
```

**Estructura resultante:**
```
yard-sale-backend/
├── src/
│   ├── config/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── validators/
│   ├── services/
│   ├── utils/
│   ├── types/
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── app.ts
│   └── server.ts
├── uploads/
├── logs/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Paso 3: Configurar TypeScript

### 3.1 Crear `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@config/*": ["src/config/*"],
      "@models/*": ["src/models/*"],
      "@controllers/*": ["src/controllers/*"],
      "@routes/*": ["src/routes/*"],
      "@middlewares/*": ["src/middlewares/*"],
      "@validators/*": ["src/validators/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 3.2 Configurar Path Aliases en `package.json`

Agregar al `package.json`:

```json
{
  "_moduleAliases": {
    "@": "dist",
    "@config": "dist/config",
    "@models": "dist/models",
    "@controllers": "dist/controllers",
    "@routes": "dist/routes",
    "@middlewares": "dist/middlewares",
    "@validators": "dist/validators",
    "@services": "dist/services",
    "@utils": "dist/utils",
    "@types": "dist/types"
  }
}
```

**Instalar module-alias:**
```powershell
npm install module-alias
npm install -D @types/module-alias
```

---

## 🔧 Paso 4: Configurar Variables de Entorno

### 4.1 Crear `.env`

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/yardsale

# JWT Configuration (lo usaremos en Fase 2)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# Logging
LOG_LEVEL=debug
```

### 4.2 Crear `.env.example`

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/yardsale

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# Logging
LOG_LEVEL=info
```

---

## 📝 Paso 5: Configurar ESLint y Prettier

### 5.1 Crear `.eslintrc.js`

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prettier/prettier': 'error',
  },
};
```

### 5.2 Crear `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 5.3 Crear `.prettierignore`

```
node_modules
dist
build
coverage
logs
uploads
*.log
.env
.env.*
```

---

## 🗃️ Paso 6: Configurar MongoDB

### 6.1 Opción A: MongoDB Local

**Instalar MongoDB en Windows:**
1. Descargar desde [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Instalar con configuración por defecto
3. Verificar que el servicio esté corriendo:

```powershell
# Verificar si MongoDB está corriendo
Get-Service MongoDB

# Iniciar MongoDB si está detenido
Start-Service MongoDB

# Conectar con MongoDB Shell (opcional)
mongosh
```

### 6.2 Opción B: MongoDB Atlas (Cloud - Recomendado)

1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Crear un cluster gratuito (M0)
3. Configurar usuario y contraseña
4. Whitelist IP address (0.0.0.0/0 para desarrollo)
5. Obtener connection string:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/yardsale?retryWrites=true&w=majority
```

6. Actualizar `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/yardsale?retryWrites=true&w=majority
```

### 6.3 Crear archivo de configuración `src/config/database.ts`

```typescript
import mongoose from 'mongoose';
import logger from '@/utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definido en las variables de entorno');
    }

    const options = {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, options);

    logger.info('✅ MongoDB conectado exitosamente');
    logger.info(`📊 Base de datos: ${mongoose.connection.name}`);

    // Event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('❌ Error de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB desconectado');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('🔌 MongoDB desconectado debido a la terminación de la aplicación');
      process.exit(0);
    });
  } catch (error) {
    logger.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
```

---

## 📊 Paso 7: Configurar Logger (Winston)

### 7.1 Crear `src/utils/logger.ts`

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logDir = 'logs';

// Define el formato de los logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Transport para errores
const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d',
  maxSize: '20m',
  format: logFormat,
});

// Transport para logs combinados
const combinedFileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  maxSize: '20m',
  format: logFormat,
});

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    errorFileRotateTransport,
    combinedFileRotateTransport,
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
  ],
});

export default logger;
```

---

## 🚀 Paso 8: Crear la Aplicación Express

### 8.1 Crear `src/app.ts`

```typescript
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import logger from '@/utils/logger';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app: Application = express();

// ===========================
// Middlewares de Seguridad
// ===========================

// Helmet: protección de headers HTTP
app.use(helmet());

// CORS: permitir requests desde el frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate Limiting: prevenir ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ===========================
// Middlewares de Parseo
// ===========================

// Body parser para JSON
app.use(express.json({ limit: '10mb' }));

// Body parser para URL-encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================
// Logging de Requests
// ===========================

// Morgan: logging de HTTP requests
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // En producción, loguear a archivo
  const morganFormat = ':method :url :status :response-time ms - :res[content-length]';
  app.use(
    morgan(morganFormat, {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
}

// ===========================
// Health Check Endpoint
// ===========================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION || 'v1',
  });
});

// ===========================
// API Routes
// ===========================

// Aquí irán las rutas (las agregaremos en las siguientes fases)
app.get('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Yard Sale API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      products: '/api/v1/products',
      orders: '/api/v1/orders',
      categories: '/api/v1/categories',
    },
  });
});

// ===========================
// 404 Handler
// ===========================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    path: req.originalUrl,
  });
});

// ===========================
// Error Handler Global
// ===========================

app.use((err: Error, req: Request, res: Response, next: Function) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Algo salió mal' : err.message,
  });
});

export default app;
```

### 8.2 Crear `src/server.ts`

```typescript
import 'module-alias/register';
import app from './app';
import connectDB from '@/config/database';
import logger from '@/utils/logger';

const PORT = process.env.PORT || 5000;

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();

    // Iniciar servidor Express
    app.listen(PORT, () => {
      logger.info('🚀 ====================================');
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🚀 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🚀 API Version: ${process.env.API_VERSION}`);
      logger.info(`🚀 Health check: http://localhost:${PORT}/health`);
      logger.info(`🚀 API Root: http://localhost:${PORT}/api/v1`);
      logger.info('🚀 ====================================');
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Manejar errores no capturados
process.on('uncaughtException', (error: Error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();
```

---

## 📜 Paso 9: Configurar Scripts de npm

Actualizar `package.json`:

```json
{
  "name": "yard-sale-backend",
  "version": "1.0.0",
  "description": "Backend API para Yard Sale e-commerce",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon --exec ts-node -r tsconfig-paths/register src/server.ts",
    "build": "tsc",
    "start": "node -r module-alias/register dist/server.js",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "clean": "rimraf dist",
    "prebuild": "npm run clean"
  },
  "keywords": ["ecommerce", "api", "rest", "nodejs", "express", "mongodb"],
  "author": "Nicolas Acuña",
  "license": "MIT"
}
```

**Instalar dependencias adicionales:**
```powershell
npm install -D tsconfig-paths rimraf
```

---

## 🔥 Paso 10: Configurar .gitignore

Crear `.gitignore`:

```gitignore
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build
dist/
build/

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Uploads
uploads/
*.jpg
*.jpeg
*.png
*.gif

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
coverage/
.nyc_output/

# Temp files
*.tmp
*.temp
.cache/
```

---

## ✅ Paso 11: Probar el Setup

### 11.1 Compilar TypeScript

```powershell
npm run build
```

**Resultado esperado:**
- Carpeta `dist/` creada con archivos JavaScript
- Sin errores de compilación

### 11.2 Iniciar el Servidor en Desarrollo

```powershell
npm run dev
```

**Resultado esperado:**
```
2025-10-23 10:30:00 [info]: ✅ MongoDB conectado exitosamente
2025-10-23 10:30:00 [info]: 📊 Base de datos: yardsale
2025-10-23 10:30:00 [info]: 🚀 ====================================
2025-10-23 10:30:00 [info]: 🚀 Server running on port 5000
2025-10-23 10:30:00 [info]: 🚀 Environment: development
2025-10-23 10:30:00 [info]: 🚀 API Version: v1
2025-10-23 10:30:00 [info]: 🚀 Health check: http://localhost:5000/health
2025-10-23 10:30:00 [info]: 🚀 API Root: http://localhost:5000/api/v1
2025-10-23 10:30:00 [info]: 🚀 ====================================
```

### 11.3 Probar Health Check

**Opción A: Browser**
- Abrir http://localhost:5000/health

**Opción B: PowerShell**
```powershell
curl http://localhost:5000/health
```

**Opción C: Postman**
- GET http://localhost:5000/health

**Respuesta esperada:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "environment": "development",
  "version": "v1"
}
```

### 11.4 Probar API Root

GET http://localhost:5000/api/v1

**Respuesta esperada:**
```json
{
  "message": "Yard Sale API v1",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "auth": "/api/v1/auth",
    "users": "/api/v1/users",
    "products": "/api/v1/products",
    "orders": "/api/v1/orders",
    "categories": "/api/v1/categories"
  }
}
```

---

## 📚 Paso 12: Crear README.md del Backend

```markdown
# Yard Sale Backend API

Backend RESTful API para el proyecto Yard Sale e-commerce.

## 🚀 Stack Tecnológico

- Node.js 20+
- Express 4.19+
- TypeScript 5.x
- MongoDB 7.x
- Mongoose 8.x

## 📦 Instalación

\`\`\`bash
npm install
\`\`\`

## ⚙️ Configuración

1. Copiar \`.env.example\` a \`.env\`
2. Configurar variables de entorno
3. Asegurarse de que MongoDB esté corriendo

## 🏃 Ejecución

### Desarrollo
\`\`\`bash
npm run dev
\`\`\`

### Producción
\`\`\`bash
npm run build
npm start
\`\`\`

## 🧪 Testing

\`\`\`bash
npm test
\`\`\`

## 📡 Endpoints

- \`GET /health\` - Health check
- \`GET /api/v1\` - API info

Más endpoints serán agregados en las siguientes fases.

## 📝 Licencia

MIT
```

---

## ✅ Checklist de Verificación

Antes de pasar a la Fase 2, asegúrate de que:

- [ ] Proyecto npm inicializado
- [ ] Todas las dependencias instaladas sin errores
- [ ] TypeScript configurado correctamente
- [ ] Estructura de carpetas creada
- [ ] Variables de entorno configuradas (.env)
- [ ] MongoDB conectado (local o Atlas)
- [ ] ESLint y Prettier configurados
- [ ] Logger (Winston) funcionando
- [ ] Servidor Express corriendo en puerto 5000
- [ ] Health check endpoint respondiendo correctamente
- [ ] API root endpoint respondiendo correctamente
- [ ] Logs generándose en carpeta /logs
- [ ] .gitignore configurado
- [ ] README.md del backend creado
- [ ] Sin errores de compilación de TypeScript
- [ ] Sin warnings de ESLint

---

## 🎯 Próximos Pasos

Una vez completada la Fase 1, continúa con **BACKEND_PHASE_2.md** para implementar:
- Autenticación con JWT
- Modelo de Usuario
- Registro y Login
- Middleware de autenticación
- Hash de contraseñas con bcrypt

---

## 🐛 Troubleshooting

### MongoDB no se conecta

**Problema:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solución:**
- Verificar que MongoDB esté corriendo: `Get-Service MongoDB`
- Verificar la URI en `.env`
- Si usas Atlas, verificar credenciales y whitelist de IPs

### Errores de TypeScript

**Problema:** `Cannot find module '@/config/database'`

**Solución:**
- Verificar que `tsconfig-paths` esté instalado
- Verificar que los paths en `tsconfig.json` estén correctos
- Reiniciar el servidor

### Puerto 5000 ocupado

**Problema:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solución:**
```powershell
# Encontrar proceso usando el puerto 5000
netstat -ano | findstr :5000

# Matar el proceso (reemplazar PID)
taskkill /PID <PID> /F

# O cambiar el puerto en .env
PORT=5001
```

---

**Autor**: Nicolas Acuña  
**Fecha**: 23 de Octubre 2025  
**Fase**: 1 de 6  
**Estado**: ✅ Documentación Completa
