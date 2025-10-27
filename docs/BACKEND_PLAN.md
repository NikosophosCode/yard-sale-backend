# 🚀 Plan de Implementación: Backend para Yard Sale 2.0
## Node.js + Express + MongoDB

---

## 📋 Índice General

Este documento es el índice principal del plan de migración del backend. El plan está dividido en múltiples documentos para facilitar su lectura y seguimiento.

### Documentos del Plan

1. **[BACKEND_PLAN.md](BACKEND_PLAN.md)** (este documento) - Índice y visión general
2. **[BACKEND_PHASE_1.md](BACKEND_PHASE_1.md)** - Setup Inicial del Backend
3. **[BACKEND_PHASE_2.md](BACKEND_PHASE_2.md)** - Autenticación y Autorización
4. **[BACKEND_PHASE_3.md](BACKEND_PHASE_3.md)** - API de Productos
5. **[BACKEND_PHASE_4.md](BACKEND_PHASE_4.md)** - API de Órdenes y Carrito
6. **[BACKEND_PHASE_5.md](BACKEND_PHASE_5.md)** - Integración Frontend-Backend
7. **[BACKEND_PHASE_6.md](BACKEND_PHASE_6.md)** - Testing y Deployment

---

## 🎯 Objetivos del Proyecto

Transformar **Yard Sale 2.0** de una aplicación con API mock (JSON Server) a una aplicación full-stack con:

### Frontend (Ya Implementado) ✅
- ✅ React 19 + TypeScript + Vite
- ✅ TailwindCSS para estilos
- ✅ Zustand para estado global
- ✅ React Router para navegación
- ✅ Autenticación simulada
- ✅ Carrito de compras funcional
- ✅ Checkout y órdenes

### Backend (A Implementar) 🚧
- 🔨 Node.js + Express
- 🔨 MongoDB + Mongoose
- 🔨 JWT Authentication real
- 🔨 API RESTful completa
- 🔨 Validación de datos
- 🔨 Manejo de errores robusto
- 🔨 Upload de imágenes (Cloudinary)
- 🔨 Email transaccional (opcional)
- 🔨 Tests automatizados
- 🔨 Deployment a producción

---

## 📊 Análisis del Estado Actual

### Funcionalidades Existentes (Frontend)

#### 1. **Autenticación** (`src/api/auth.ts`)
- Login con email/password
- Registro de nuevos usuarios
- Recuperación de contraseña (simulada)
- Actualización de perfil
- Cambio de contraseña
- JWT simulado con localStorage
- Persistencia de sesión (7 días)

**Datos actuales:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string; // ⚠️ Sin hash (texto plano)
  role: 'user' | 'admin';
  avatar: string | null;
  addresses: Address[];
  createdAt: string;
  lastLogin: string;
}
```

#### 2. **Productos** (`src/api/products.ts`)
- Listado de productos con filtros
- Búsqueda por texto
- Filtrado por categoría, precio, condición
- Ordenamiento (precio, fecha, rating)
- Productos destacados
- Productos relacionados
- Detalle de producto

**Datos actuales:**
- 20 productos en `db.json`
- 6 categorías
- Imágenes de Pexels (URLs externas)
- Stock, rating, reviews

#### 3. **Órdenes** (`src/api/orders.ts`)
- Creación de órdenes desde carrito
- Listado de órdenes por usuario
- Detalle de orden
- Estados de orden (pending, processing, shipped, delivered, cancelled)
- Métodos de pago (credit-card, debit-card, paypal, cash-on-delivery)
- Cálculos automáticos (subtotal, tax, shipping, total)

**Datos actuales:**
```typescript
interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
}
```

#### 4. **Carrito** (`src/store/cartStore.ts`)
- Gestión de items con Zustand
- Persistencia en localStorage
- Validación de stock
- Cálculos automáticos
- Sincronización entre pestañas

### API Mock Actual (JSON Server)

**Endpoints disponibles:**
```
GET    /products              - Listar productos
GET    /products/:id          - Detalle de producto
GET    /users                 - Listar usuarios
GET    /users?email=:email    - Buscar por email
POST   /users                 - Crear usuario
PATCH  /users/:id             - Actualizar usuario
GET    /orders                - Listar órdenes
GET    /orders?userId=:id     - Órdenes de usuario
POST   /orders                - Crear orden
GET    /categories            - Listar categorías
```

**Puerto actual:** `3001`  
**Base de datos:** `db.json` (archivo plano)

---

## 🏗️ Arquitectura del Backend

### Stack Tecnológico Propuesto

#### Core
- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Express 4.19+
- **Lenguaje**: TypeScript 5.x
- **Base de datos**: MongoDB 7.x
- **ODM**: Mongoose 8.x

#### Autenticación y Seguridad
- **JWT**: jsonwebtoken 9.x
- **Hashing**: bcrypt 5.x
- **CORS**: cors 2.x
- **Helmet**: helmet 7.x (seguridad HTTP)
- **Express Rate Limit**: express-rate-limit 7.x

#### Validación y Utilidades
- **Validación**: express-validator 7.x
- **Variables de entorno**: dotenv 16.x
- **Logging**: winston 3.x
- **HTTP requests**: axios (opcional para integraciones)

#### Upload y Storage
- **Multer**: multer 1.4+ (upload de archivos)
- **Cloudinary**: cloudinary 2.x (almacenamiento de imágenes)

#### Email (Opcional)
- **Nodemailer**: nodemailer 6.x
- **SendGrid**: @sendgrid/mail 8.x (alternativa)

#### Testing
- **Framework**: Jest 29.x
- **HTTP Testing**: supertest 7.x
- **Mocking**: @faker-js/faker 9.x (datos de prueba)

#### DevOps
- **Process Manager**: PM2 5.x
- **Linting**: ESLint 9.x + Prettier 3.x
- **Git Hooks**: Husky 9.x
- **API Docs**: swagger-ui-express 5.x (opcional)

---

## 📁 Estructura del Proyecto Backend

```
yard-sale-backend/
├── src/
│   ├── config/              # Configuraciones
│   │   ├── database.ts      # Configuración de MongoDB
│   │   ├── cloudinary.ts    # Configuración de Cloudinary
│   │   ├── email.ts         # Configuración de email
│   │   └── constants.ts     # Constantes globales
│   │
│   ├── models/              # Modelos de Mongoose
│   │   ├── User.ts          # Modelo de Usuario
│   │   ├── Product.ts       # Modelo de Producto
│   │   ├── Order.ts         # Modelo de Orden
│   │   └── Category.ts      # Modelo de Categoría
│   │
│   ├── controllers/         # Controladores (lógica de negocio)
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── product.controller.ts
│   │   ├── order.controller.ts
│   │   └── category.controller.ts
│   │
│   ├── routes/              # Definición de rutas
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── product.routes.ts
│   │   ├── order.routes.ts
│   │   └── category.routes.ts
│   │
│   ├── middlewares/         # Middlewares personalizados
│   │   ├── auth.middleware.ts        # Verificación de JWT
│   │   ├── validation.middleware.ts  # Validación de datos
│   │   ├── error.middleware.ts       # Manejo de errores
│   │   ├── upload.middleware.ts      # Upload de archivos
│   │   └── rateLimiter.middleware.ts # Rate limiting
│   │
│   ├── validators/          # Validadores de Express Validator
│   │   ├── auth.validator.ts
│   │   ├── user.validator.ts
│   │   ├── product.validator.ts
│   │   └── order.validator.ts
│   │
│   ├── services/            # Servicios (lógica de negocio reutilizable)
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── upload.service.ts
│   │   └── payment.service.ts
│   │
│   ├── utils/               # Utilidades
│   │   ├── logger.ts        # Winston logger
│   │   ├── jwt.ts           # Helpers de JWT
│   │   ├── errorHandler.ts  # Manejo de errores
│   │   └── seeders.ts       # Seeders de base de datos
│   │
│   ├── types/               # Tipos de TypeScript
│   │   ├── express.d.ts     # Extensiones de Express
│   │   └── index.ts         # Tipos compartidos
│   │
│   ├── tests/               # Tests
│   │   ├── unit/            # Tests unitarios
│   │   ├── integration/     # Tests de integración
│   │   └── setup.ts         # Configuración de tests
│   │
│   ├── app.ts               # Configuración de Express app
│   └── server.ts            # Punto de entrada del servidor
│
├── uploads/                 # Archivos temporales (gitignored)
├── logs/                    # Logs de la aplicación (gitignored)
│
├── .env                     # Variables de entorno (gitignored)
├── .env.example             # Ejemplo de variables de entorno
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── package.json
├── jest.config.js
├── nodemon.json
└── README.md
```

---

## ⏱️ Estimación de Tiempo

| Fase | Descripción | Duración | Complejidad |
|------|-------------|----------|-------------|
| **FASE 1** | Setup Inicial | 1-2 días | Baja |
| **FASE 2** | Autenticación y Autorización | 2-3 días | Media-Alta |
| **FASE 3** | API de Productos | 2-3 días | Media |
| **FASE 4** | API de Órdenes y Carrito | 2-3 días | Media-Alta |
| **FASE 5** | Integración Frontend-Backend | 2-3 días | Media |
| **FASE 6** | Testing y Deployment | 2-3 días | Media |
| **TOTAL** | | **11-17 días** | Variable |

**Nota**: Tiempos estimados para un desarrollador con experiencia media trabajando full-time (6-8 horas/día).

---

## 🎯 Roadmap de Implementación

### ✅ Estado Actual: Frontend Completo (85%)
- ✅ React + TypeScript + Vite configurado
- ✅ Autenticación simulada
- ✅ Catálogo de productos
- ✅ Carrito de compras
- ✅ Checkout y órdenes
- ✅ Cuenta de usuario
- ✅ Testing básico

### 🚧 Próximos Pasos: Backend Implementation

#### **FASE 1: Setup Inicial** (1-2 días)
- [ ] Crear proyecto Node.js con TypeScript
- [ ] Configurar Express y middlewares básicos
- [ ] Conectar MongoDB (local o Atlas)
- [ ] Configurar variables de entorno
- [ ] Setup de logging (Winston)
- [ ] Configurar ESLint + Prettier
- [ ] Crear estructura de carpetas
- [ ] Documentar en README

#### **FASE 2: Autenticación y Autorización** (2-3 días)
- [ ] Modelo de Usuario (Mongoose)
- [ ] Registro con hash de contraseñas (bcrypt)
- [ ] Login con JWT real
- [ ] Middleware de autenticación
- [ ] Middleware de autorización (roles)
- [ ] Recuperación de contraseña
- [ ] Actualización de perfil
- [ ] Rate limiting en endpoints de auth

#### **FASE 3: API de Productos** (2-3 días)
- [ ] Modelo de Producto (Mongoose)
- [ ] Modelo de Categoría
- [ ] CRUD completo de productos
- [ ] Búsqueda y filtrado avanzado
- [ ] Paginación
- [ ] Upload de imágenes (Cloudinary)
- [ ] Validación de datos
- [ ] Seeder de productos

#### **FASE 4: API de Órdenes y Carrito** (2-3 días)
- [ ] Modelo de Orden
- [ ] Crear orden desde carrito
- [ ] Validación de stock
- [ ] Cálculos automáticos
- [ ] Estados de orden
- [ ] Historial de órdenes por usuario
- [ ] Actualización de stock post-orden
- [ ] Webhooks de pago (simulado)

#### **FASE 5: Integración Frontend-Backend** (2-3 días)
- [ ] Actualizar servicios de API del frontend
- [ ] Implementar interceptores de Axios
- [ ] Manejo de tokens JWT
- [ ] Refresh tokens
- [ ] Manejo de errores centralizado
- [ ] Loading states
- [ ] Testing de integración

#### **FASE 6: Testing y Deployment** (2-3 días)
- [ ] Tests unitarios (controllers, services)
- [ ] Tests de integración (endpoints)
- [ ] Tests E2E (opcional)
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Deploy backend (Railway, Render, DigitalOcean)
- [ ] Deploy frontend (Vercel, Netlify)
- [ ] Configurar dominios
- [ ] Monitoring y logging

---

## 🔧 Variables de Entorno Necesarias

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/yardsale
MONGODB_URI_PROD=mongodb+srv://user:pass@cluster.mongodb.net/yardsale

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_PROD=https://yardsale.vercel.app

# Cloudinary (para imágenes)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yardsale.com

# SendGrid (alternativa)
SENDGRID_API_KEY=your-sendgrid-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

---

## 📊 Comparación: JSON Server vs Backend Real

| Característica | JSON Server (Actual) | Backend Real (Nuevo) |
|----------------|----------------------|----------------------|
| **Autenticación** | Simulada (localStorage) | JWT real con bcrypt |
| **Validación** | Solo frontend | Frontend + Backend |
| **Seguridad** | Básica | Completa (helmet, cors, rate limit) |
| **Contraseñas** | Texto plano ⚠️ | Hash con bcrypt ✅ |
| **Imágenes** | URLs externas | Upload real (Cloudinary) |
| **Emails** | Simulados | Reales (Nodemailer/SendGrid) |
| **Paginación** | Limitada | Completa con metadata |
| **Búsqueda** | Simple | Full-text search (MongoDB) |
| **Relaciones** | Manuales | Automáticas (Mongoose populate) |
| **Transacciones** | No soportadas | Soportadas (MongoDB transactions) |
| **Escalabilidad** | Baja | Alta |
| **Performance** | Limitada | Optimizada (índices, caché) |
| **Testing** | No disponible | Tests automatizados |
| **Deployment** | No aplicable | Producción-ready |

---

## ⚠️ Riesgos y Mitigaciones

### Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Incompatibilidad de tipos | Media | Medio | Usar los mismos tipos del frontend, crear DTOs |
| Performance de MongoDB | Baja | Alto | Índices adecuados, paginación, caché |
| Seguridad de JWT | Media | Alto | Secrets fuertes, refresh tokens, expiración corta |
| Upload de imágenes lento | Media | Medio | Cloudinary CDN, optimización de imágenes |
| Costos de servicios cloud | Media | Medio | Free tiers inicialmente (MongoDB Atlas, Cloudinary) |

### Riesgos de Proyecto

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Breaking changes en frontend | Alta | Alto | Versionado de API, backward compatibility |
| Retrasos en desarrollo | Media | Medio | Buffer de 20-30% en estimaciones |
| Curva de aprendizaje MongoDB | Media | Medio | Documentación, ejemplos prácticos |
| Debugging complejo | Media | Medio | Logging robusto, herramientas de debugging |

---

## 🎯 Features Futuras (Post-MVP Backend)

### Corto Plazo (V2.0)
- [ ] Websockets para notificaciones en tiempo real
- [ ] Sistema de chat comprador-vendedor
- [ ] Panel de administración (admin dashboard)
- [ ] Analytics y métricas
- [ ] Sistema de reviews y ratings
- [ ] Wishlist persistente en backend
- [ ] Notificaciones push (OneSignal/Firebase)
- [ ] Descuentos y cupones
- [ ] Multi-idioma en backend

### Largo Plazo (V3.0)
- [ ] Pasarela de pago real (Stripe/PayPal)
- [ ] Sistema de vendedores (multi-vendor)
- [ ] Wallet y balance de usuarios
- [ ] Sistema de comisiones
- [ ] Reportes y disputes
- [ ] Machine Learning para recomendaciones
- [ ] GraphQL API (alternativa a REST)
- [ ] Microservicios architecture

---

## 📚 Recursos y Referencias

### Documentación Oficial
- [Node.js Documentation](https://nodejs.org/docs/latest/api/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Tutoriales y Guías
- [REST API Best Practices](https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [MongoDB Schema Design](https://www.mongodb.com/developer/products/mongodb/schema-design-anti-pattern-summary/)
- [JWT Best Practices](https://supertokens.com/blog/the-best-way-to-securely-manage-user-sessions)

### Herramientas de Desarrollo
- [Postman](https://www.postman.com/) - Testing de APIs
- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI para MongoDB
- [Insomnia](https://insomnia.rest/) - Alternativa a Postman
- [DBeaver](https://dbeaver.io/) - Cliente universal de DB

### Servicios Cloud
- [MongoDB Atlas](https://www.mongodb.com/atlas) - MongoDB en la nube (Free tier)
- [Cloudinary](https://cloudinary.com/) - CDN para imágenes (Free tier)
- [Railway](https://railway.app/) - Deployment de backend (Free tier limitado)
- [Render](https://render.com/) - Alternativa a Railway
- [DigitalOcean](https://www.digitalocean.com/) - VPS tradicional

---

## 🚀 Cómo Usar Este Plan

### 1. **Leer el Plan Completo**
- Lee primero este documento (BACKEND_PLAN.md) para tener una visión general
- Revisa cada fase en su documento específico (BACKEND_PHASE_X.md)
- Identifica las dependencias entre fases

### 2. **Preparar el Entorno**
- Instala Node.js 20+ (LTS)
- Instala MongoDB (local o crea cuenta en Atlas)
- Crea cuenta en Cloudinary (para imágenes)
- Instala MongoDB Compass (opcional pero recomendado)
- Instala Postman o Insomnia

### 3. **Seguir las Fases en Orden**
- **No saltes fases**: cada una depende de la anterior
- **Testea después de cada fase**: asegúrate de que todo funciona
- **Commitea frecuentemente**: al menos después de cada tarea completada
- **Documenta cambios**: actualiza el README según avances

### 4. **Testing Continuo**
- Prueba cada endpoint con Postman después de crearlo
- Escribe tests unitarios mientras desarrollas
- Ejecuta todos los tests antes de pasar a la siguiente fase

### 5. **Documentación**
- Actualiza el README del backend con cada cambio importante
- Documenta las decisiones de diseño
- Mantén un CHANGELOG.md con los cambios

---

## 📞 Soporte y Contribución

### Preguntas Frecuentes
- Ver sección de FAQ en cada documento de fase
- Consultar la documentación oficial de cada tecnología
- Buscar en Stack Overflow con tags específicos

### Cómo Contribuir
1. Fork del repositorio
2. Crear feature branch (`git checkout -b feature/backend-authentication`)
3. Commit cambios (`git commit -m 'feat(auth): add JWT authentication'`)
4. Push a la rama (`git push origin feature/backend-authentication`)
5. Abrir Pull Request

### Convenciones de Commits
```
feat(scope): descripción corta
fix(scope): descripción del bug
docs(scope): actualización de documentación
test(scope): agregar tests
refactor(scope): refactorización sin cambios de funcionalidad
```

---

## 🎉 Próximos Pasos

1. **Lee BACKEND_PHASE_1.md** para comenzar con el setup inicial
2. **Prepara tu entorno de desarrollo** según las instrucciones
3. **Crea el repositorio del backend** (`yard-sale-backend/`)
4. **Sigue las tareas paso a paso** de la Fase 1

---

**Autor**: Nicolas Acuña  
**Proyecto**: Yard Sale 2.0 Backend Implementation  
**Fecha de Creación**: 23 de Octubre 2025  
**Última Actualización**: 23 de Octubre 2025  
**Versión**: 1.0.0

---

*Este es un proyecto educativo/profesional para demostrar habilidades full-stack con tecnologías modernas. No es para uso comercial sin las debidas modificaciones de seguridad y escalabilidad.*
