import express, { Application, Request, Response, NextFunction } from 'express';
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

// Importar rutas
import authRoutes from '@/routes/auth.routes';

// Montar rutas
app.use('/api/v1/auth', authRoutes);

// Endpoint de información de la API
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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: _req.originalUrl,
    method: _req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Algo salió mal' : err.message,
  });
});

export default app;
