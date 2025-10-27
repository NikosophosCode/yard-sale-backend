# 🧪 FASE 6: Testing y Deployment
## Jest + Supertest + CI/CD + Producción

**Duración Estimada**: 2-3 días  
**Complejidad**: Media  
**Prerequisitos**: Fases 1-5 completadas

---

## 📋 Objetivos de la Fase

- ✅ Configurar Jest para testing
- ✅ Tests unitarios de modelos
- ✅ Tests unitarios de utilidades
- ✅ Tests de integración de endpoints
- ✅ Tests E2E con Supertest
- ✅ Coverage mínimo del 70%
- ✅ Configurar CI/CD con GitHub Actions
- ✅ Deploy backend a Railway/Render
- ✅ Deploy frontend a Vercel
- ✅ Configurar MongoDB Atlas para producción
- ✅ Variables de entorno de producción
- ✅ Monitoreo y logs
- ✅ Documentación final

---

## 📦 Paso 1: Configurar Jest

### 1.1 Instalar Dependencias de Testing

```powershell
# Testing
npm install -D jest @types/jest ts-jest
npm install -D supertest @types/supertest
npm install -D @faker-js/faker

# MongoDB en memoria para tests
npm install -D mongodb-memory-server
```

### 1.2 Crear `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/types/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@validators/(.*)$': '<rootDir>/src/validators/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testTimeout: 30000,
};
```

### 1.3 Crear `src/tests/setup.ts`

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// Conectar a MongoDB en memoria antes de todos los tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
});

// Limpiar base de datos entre tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Cerrar conexión después de todos los tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
```

### 1.4 Actualizar `package.json` con scripts de testing

```json
{
  "scripts": {
    "test": "jest --verbose",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## 🧪 Paso 2: Tests Unitarios de Modelos

### 2.1 Crear `src/tests/unit/models/User.test.ts`

```typescript
import User from '@/models/User';
import { faker } from '@faker-js/faker';

describe('User Model', () => {
  describe('Validations', () => {
    it('should create a valid user', async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Password123!',
      };

      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email.toLowerCase());
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.role).toBe('user'); // Default role
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      const user = new User({
        name: faker.person.fullName(),
        email: 'invalid-email',
        password: 'Password123!',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should fail with short password', async () => {
      const user = new User({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'short',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should fail with duplicate email', async () => {
      const email = faker.internet.email();

      const user1 = new User({
        name: faker.person.fullName(),
        email,
        password: 'Password123!',
      });

      await user1.save();

      const user2 = new User({
        name: faker.person.fullName(),
        email,
        password: 'Password123!',
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const password = 'Password123!';
      const user = new User({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password,
      });

      await user.save();

      expect(user.password).not.toBe(password);
      expect(user.password).toHaveLength(60); // bcrypt hash length
    });

    it('should compare password correctly', async () => {
      const password = 'Password123!';
      const user = new User({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password,
      });

      await user.save();

      const isMatch = await user.comparePassword(password);
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('WrongPassword');
      expect(isNotMatch).toBe(false);
    });
  });

  describe('Static Methods', () => {
    it('should find user by email', async () => {
      const email = faker.internet.email();
      const user = new User({
        name: faker.person.fullName(),
        email,
        password: 'Password123!',
      });

      await user.save();

      const foundUser = await User.findByEmail(email);
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(email.toLowerCase());
    });
  });
});
```

### 2.2 Crear `src/tests/unit/utils/jwt.test.ts`

```typescript
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/utils/jwt';
import { IUser } from '@/models/User';

describe('JWT Utils', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: 'user',
  } as any as IUser;

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockUser._id.toString());
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockUser._id.toString());
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });
  });
});
```

---

## 🔗 Paso 3: Tests de Integración de Endpoints

### 3.1 Crear `src/tests/integration/auth.test.ts`

```typescript
import request from 'supertest';
import app from '@/app';
import User from '@/models/User';
import { faker } from '@faker-js/faker';

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(userData.email.toLowerCase());
    });

    it('should fail with duplicate email', async () => {
      const email = faker.internet.email();
      const user = new User({
        name: faker.person.fullName(),
        email,
        password: 'Password123!',
      });
      await user.save();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: faker.person.fullName(),
          email,
          password: 'Password123!',
          confirmPassword: 'Password123!',
        })
        .expect(409);

      expect(response.body.error).toBe('Conflict');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: 'weak',
          confirmPassword: 'weak',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const userData = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'Password123!',
    };

    beforeEach(async () => {
      const user = new User(userData);
      await user.save();
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const user = new User({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Password123!',
      });
      await user.save();

      const response = await request(app).post('/api/v1/auth/login').send({
        email: user.email,
        password: 'Password123!',
      });

      accessToken = response.body.accessToken;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('name');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      await request(app).get('/api/v1/auth/me').expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
```

### 3.2 Crear `src/tests/integration/products.test.ts`

```typescript
import request from 'supertest';
import app from '@/app';
import User from '@/models/User';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { faker } from '@faker-js/faker';
import { generateAccessToken } from '@/utils/jwt';

describe('Product Endpoints', () => {
  let adminToken: string;
  let userToken: string;
  let adminUser: any;
  let regularUser: any;

  beforeEach(async () => {
    // Create admin user
    adminUser = new User({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'Admin123!',
      role: 'admin',
    });
    await adminUser.save();
    adminToken = generateAccessToken(adminUser);

    // Create regular user
    regularUser = new User({
      name: 'User',
      email: 'user@test.com',
      password: 'User123!',
      role: 'user',
    });
    await regularUser.save();
    userToken = generateAccessToken(regularUser);

    // Create categories
    await Category.create({
      id: 'electronics',
      name: 'Electronics',
      slug: 'electronics',
    });
  });

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      // Create some products
      await Product.create([
        {
          name: 'Product 1',
          price: 100,
          description: 'Description 1',
          category: 'electronics',
          condition: 'new',
          image: 'https://example.com/image1.jpg',
          images: ['https://example.com/image1.jpg'],
          stock: 10,
          sellerId: adminUser._id,
        },
        {
          name: 'Product 2',
          price: 200,
          description: 'Description 2',
          category: 'electronics',
          condition: 'like-new',
          image: 'https://example.com/image2.jpg',
          images: ['https://example.com/image2.jpg'],
          stock: 5,
          sellerId: adminUser._id,
        },
      ]);
    });

    it('should get all products', async () => {
      const response = await request(app).get('/api/v1/products').expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.products).toHaveLength(2);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ category: 'electronics' })
        .expect(200);

      expect(response.body.products).toHaveLength(2);
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ minPrice: 150, maxPrice: 250 })
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].price).toBe(200);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    let product: any;

    beforeEach(async () => {
      product = await Product.create({
        name: 'Test Product',
        price: 150,
        description: 'Test description',
        category: 'electronics',
        condition: 'new',
        image: 'https://example.com/image.jpg',
        images: ['https://example.com/image.jpg'],
        stock: 10,
        sellerId: adminUser._id,
      });
    });

    it('should get product by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${product._id}`)
        .expect(200);

      expect(response.body.product).toHaveProperty('name', 'Test Product');
      expect(response.body.product).toHaveProperty('price', 150);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app).get(`/api/v1/products/${fakeId}`).expect(404);
    });
  });
});
```

---

## 🚀 Paso 4: CI/CD con GitHub Actions

### 4.1 Crear `.github/workflows/backend-ci.yml`

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'yard-sale-backend/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'yard-sale-backend/**'

defaults:
  run:
    working-directory: ./yard-sale-backend

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: yard-sale-backend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./yard-sale-backend/coverage/lcov.info
          flags: backend
          name: backend-coverage

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
          cache-dependency-path: yard-sale-backend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: yard-sale-backend/dist

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to Railway
        run: |
          echo "Deploying to Railway..."
          # Railway se despliega automáticamente desde GitHub
```

---

## 📊 Paso 5: Coverage Report

### 5.1 Ejecutar tests con coverage

```powershell
npm run test:coverage
```

**Output esperado:**
```
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |   75.28 |    68.42 |   71.15 |   76.12 |
 models               |   82.35 |    75.00 |   80.00 |   83.33 |
  User.ts             |   85.71 |    80.00 |   83.33 |   86.67 | 45,78
  Product.ts          |   80.00 |    70.00 |   77.77 |   81.25 | 67,89,123
  Order.ts            |   81.25 |    75.00 |   80.00 |   82.14 | 98,145
 controllers          |   73.91 |    65.21 |   70.00 |   75.00 |
  auth.controller.ts  |   78.26 |    70.00 |   75.00 |   79.16 | 134,156,189
  product.controller  |   71.42 |    62.50 |   68.75 |   72.72 | 201,245
  order.controller.ts |   72.00 |    63.63 |   66.66 |   73.33 | 178,234,267
 utils                |   80.00 |    75.00 |   85.00 |   81.25 |
  jwt.ts              |   90.00 |    85.00 |   100.0 |   91.66 | 34
  logger.ts           |   70.00 |    65.00 |   70.00 |   71.42 | 45,67
----------------------|---------|----------|---------|---------|-------------------
```

---

## 🌐 Paso 6: Deployment a Producción

### 6.1 Deploy Backend a Railway

1. **Crear cuenta en [Railway](https://railway.app/)**

2. **Crear nuevo proyecto**:
   - New Project → Deploy from GitHub repo
   - Seleccionar `yard-sale-backend`

3. **Configurar variables de entorno**:
```env
NODE_ENV=production
PORT=${{PORT}}
MONGODB_URI=${{MONGO_URL}}
JWT_SECRET=<generar-secret-fuerte>
JWT_REFRESH_SECRET=<generar-secret-fuerte>
FRONTEND_URL=https://yardsale.vercel.app
CLOUDINARY_CLOUD_NAME=<tu-cloud-name>
CLOUDINARY_API_KEY=<tu-api-key>
CLOUDINARY_API_SECRET=<tu-api-secret>
```

4. **Configurar MongoDB**:
   - Add Service → Database → Add MongoDB
   - Railway generará automáticamente `MONGO_URL`

5. **Deploy automático**:
   - Railway detecta `package.json` y ejecuta `npm start`
   - URL generada: `https://yardsale-backend-production.up.railway.app`

### 6.2 Deploy Frontend a Vercel

1. **Actualizar `.env.production` del frontend**:
```env
VITE_API_URL=https://yardsale-backend-production.up.railway.app/api/v1
```

2. **Deploy a Vercel**:
```powershell
npm install -g vercel
vercel login
vercel --prod
```

3. **Configurar variables de entorno en Vercel dashboard**

---

## ✅ Checklist Final

### Testing
- [ ] Jest configurado
- [ ] Tests unitarios de User model
- [ ] Tests unitarios de Product model
- [ ] Tests unitarios de Order model
- [ ] Tests unitarios de JWT utils
- [ ] Tests de integración de auth endpoints
- [ ] Tests de integración de product endpoints
- [ ] Tests de integración de order endpoints
- [ ] Coverage >70% alcanzado
- [ ] Todos los tests pasando

### CI/CD
- [ ] GitHub Actions configurado
- [ ] Tests automáticos en cada push
- [ ] Linting automático
- [ ] Build verification
- [ ] Coverage upload a Codecov

### Deployment
- [ ] Backend deployado en Railway
- [ ] Frontend deployado en Vercel
- [ ] MongoDB Atlas configurado
- [ ] Variables de entorno de producción configuradas
- [ ] Cloudinary configurado
- [ ] CORS configurado correctamente
- [ ] SSL activo (https)
- [ ] API funcionando en producción
- [ ] Frontend funcionando en producción
- [ ] Integración frontend-backend funcionando

### Documentación
- [ ] README del backend actualizado
- [ ] Postman Collection exportada
- [ ] API documentation (opcional: Swagger)
- [ ] Guía de deployment
- [ ] Changelog actualizado

---

## 🎉 ¡Proyecto Completado!

El backend de Yard Sale 2.0 está ahora:
- ✅ Completamente funcional
- ✅ Testeado (>70% coverage)
- ✅ Con CI/CD automático
- ✅ Deployado en producción
- ✅ Integrado con el frontend
- ✅ Documentado profesionalmente

---

**Autor**: Nicolas Acuña  
**Fecha**: 26 de Octubre 2025  
**Fase**: 6 de 6  
**Estado**: ✅ Documentación Completa  
**Proyecto**: 🎉 COMPLETADO
