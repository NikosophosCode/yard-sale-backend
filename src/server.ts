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
