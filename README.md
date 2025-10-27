# Yard Sale Backend API

Backend RESTful API para el proyecto Yard Sale e-commerce.

## 🚀 Stack Tecnológico

- Node.js 20+
- Express 4.19+
- TypeScript 5.x
- MongoDB 7.x (Atlas)
- Mongoose 8.x

## 📦 Instalación

### Prerequisitos

- Node.js 20+ (descargar desde [nodejs.org](https://nodejs.org/))
- npm o yarn
- Cuenta en MongoDB Atlas (crear en [mongodb.com/atlas](https://www.mongodb.com/atlas))

### Pasos

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd yard-sale-backend
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/yardsale?retryWrites=true&w=majority
```

## ⚙️ Configuración de MongoDB Atlas

1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Crear un cluster gratuito (M0)
3. Crear usuario de base de datos:
   - Username: `yardsale_user`
   - Password: (generar contraseña segura)
4. Whitelist IP: Agregar `0.0.0.0/0` (para desarrollo) o tu IP específica (para producción)
5. Conectar: Copiar connection string y pegar en `.env`

### Connection String Ejemplo

```
mongodb+srv://yardsale_user:your-password@cluster0.xxxxx.mongodb.net/yardsale?retryWrites=true&w=majority
```

## 🏃 Ejecución

### Desarrollo

```bash
npm run dev
```

El servidor inicia en `http://localhost:5000`

**Output esperado:**
```
🚀 ====================================
🚀 Server running on port 5000
🚀 Environment: development
🚀 API Version: v1
🚀 Health check: http://localhost:5000/health
🚀 API Root: http://localhost:5000/api/v1
🚀 ====================================
```

### Producción

```bash
npm run build
npm start
```

## 📡 Endpoints Iniciales

### Health Check

```bash
GET /health
```

**Respuesta:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2025-10-26T10:30:00.000Z",
  "environment": "development",
  "version": "v1"
}
```

### API Info

```bash
GET /api/v1
```

**Respuesta:**
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

## 🧪 Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Iniciar servidor en modo desarrollo |
| `npm run build` | Compilar TypeScript a JavaScript |
| `npm start` | Iniciar servidor de producción |
| `npm run lint` | Verificar linting |
| `npm run lint:fix` | Corregir linting automáticamente |
| `npm run format` | Formatear código con Prettier |
| `npm run format:check` | Verificar formato de código |
| `npm run clean` | Limpiar carpeta dist |
| `npm test` | Ejecutar tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con coverage report |

## 📁 Estructura del Proyecto

```
yard-sale-backend/
├── src/
│   ├── config/              # Configuraciones (DB, servicios, etc)
│   ├── models/              # Modelos de Mongoose
│   ├── controllers/         # Controladores (lógica de negocio)
│   ├── routes/              # Definición de rutas
│   ├── middlewares/         # Middlewares personalizados
│   ├── validators/          # Validadores de datos
│   ├── services/            # Servicios reutilizables
│   ├── utils/               # Funciones utilidad (logger, jwt, etc)
│   ├── types/               # Tipos de TypeScript
│   ├── tests/               # Tests (unitarios e integración)
│   ├── app.ts               # Configuración de Express
│   └── server.ts            # Punto de entrada
├── uploads/                 # Archivos subidos (gitignored)
├── logs/                    # Archivos de logs (gitignored)
├── dist/                    # Código compilado (gitignored)
├── .env                     # Variables de entorno (gitignored)
├── .env.example             # Ejemplo de variables de entorno
├── package.json             # Dependencias y scripts
├── tsconfig.json            # Configuración de TypeScript
├── .eslintrc.js             # Configuración de ESLint
├── .prettierrc               # Configuración de Prettier
└── README.md                # Este archivo
```

## 🔐 Variables de Entorno

```env
# Server
NODE_ENV=development              # Entorno (development/production)
PORT=5000                         # Puerto del servidor
API_VERSION=v1                    # Versión de API

# Database
MONGODB_URI=...                   # Connection string de MongoDB Atlas

# JWT (Fase 2)
JWT_SECRET=...                    # Secret para firmar tokens
JWT_EXPIRES_IN=7d                 # Expiración de tokens

# CORS
FRONTEND_URL=http://localhost:5173  # URL del frontend

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000       # Ventana en milisegundos
RATE_LIMIT_MAX_REQUESTS=100       # Máximo de requests por ventana

# Pagination
DEFAULT_PAGE_SIZE=20              # Tamaño de página por defecto
MAX_PAGE_SIZE=100                 # Máximo tamaño de página

# Logging
LOG_LEVEL=debug                   # Nivel de logs (debug/info/warn/error)
```

## 🐛 Troubleshooting

### MongoDB no se conecta

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Soluciones:**
- Verificar que la URI en `.env` es correcta
- Si usas Atlas, verificar que tu IP está en el whitelist
- Verificar credenciales de usuario
- Revisar que la red tiene acceso a internet

### Errores de TypeScript

**Error:** `Cannot find module '@/config/database'`

**Soluciones:**
- Ejecutar `npm run build` primero
- Verificar que los paths en `tsconfig.json` están correctos
- Limpiar y reinstalar dependencias: `npm run clean && npm install`

### Puerto 5000 ocupado

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Soluciones:**
- Cambiar puerto en `.env`: `PORT=5001`
- O matar el proceso usando el puerto:

```powershell
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# WSL/Linux
lsof -ti :5000 | xargs kill -9
```

## 📚 Documentación de Fases

- [BACKEND_PLAN.md](docs/BACKEND_PLAN.md) - Plan completo del proyecto
- [BACKEND_PHASE_1.md](docs/BACKEND_PHASE_1.md) - Setup inicial (actual)
- [BACKEND_PHASE_2.md](docs/BACKEND_PHASE_2.md) - Autenticación (próximo)
- [BACKEND_PHASE_3.md](docs/BACKEND_PHASE_3.md) - API de Productos
- [BACKEND_PHASE_4.md](docs/BACKEND_PHASE_4.md) - API de Órdenes
- [BACKEND_PHASE_5.md](docs/BACKEND_PHASE_5.md) - Integración Frontend
- [BACKEND_PHASE_6.md](docs/BACKEND_PHASE_6.md) - Testing y Deployment

## 🤝 Contribuir

1. Crear feature branch: `git checkout -b feature/backend-new-feature`
2. Commit cambios: `git commit -m 'feat(scope): descripción'`
3. Push a rama: `git push origin feature/backend-new-feature`
4. Abrir Pull Request

### Convención de Commits

```
feat(scope): descripción corta
fix(scope): descripción del bug
docs(scope): actualización de documentación
test(scope): agregar tests
refactor(scope): refactorización
```

## 📝 Licencia

MIT

## 📞 Contacto

**Autor:** Nicolas Acuña  
**Proyecto:** Yard Sale 2.0 Backend

---

**Última actualización:** 26 de Octubre 2025  
**Versión:** 1.0.0
