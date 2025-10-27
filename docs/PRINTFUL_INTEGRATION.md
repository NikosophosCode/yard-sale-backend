# 🎨 Integración con Printful - Yard Sale 2.0

## 📋 Índice
1. [¿Qué es Printful?](#qué-es-printful)
2. [¿Por qué integrar Printful?](#por-qué-integrar-printful)
3. [Requisitos Previos](#requisitos-previos)
4. [Arquitectura de la Integración](#arquitectura-de-la-integración)
5. [Plan de Implementación](#plan-de-implementación)
6. [Herramientas Necesarias](#herramientas-necesarias)
7. [Pasos Detallados](#pasos-detallados)
8. [Cambios en el Proyecto](#cambios-en-el-proyecto)
9. [Costos y Consideraciones](#costos-y-consideraciones)
10. [Testing](#testing)
11. [Roadmap](#roadmap)

---

## 🎯 ¿Qué es Printful?

**Printful** es un servicio de **Print-on-Demand (POD)** y **dropshipping** que permite:
- Crear productos personalizados (camisetas, hoodies, tazas, posters, etc.)
- Sincronizar tu catálogo de productos
- Automatizar la fabricación y envío
- NO mantener inventario físico
- Cobrar solo cuando vendes

**Beneficios principales:**
- ✅ Sin inversión inicial en stock
- ✅ 300+ productos personalizables
- ✅ Fulfillment automático (ellos empaquetan y envían)
- ✅ Mockups profesionales generados automáticamente
- ✅ Integración vía API REST
- ✅ Calculadora de envío en tiempo real
- ✅ Seguimiento de órdenes

---

## 💡 ¿Por qué integrar Printful?

### Ventajas para Yard Sale 2.0:
1. **Transformar tu marketplace**: De productos de segunda mano a una tienda híbrida
2. **Nuevas categorías**: Agregar productos personalizados sin riesgo
3. **Escalabilidad**: Vender productos sin límite de stock
4. **Profesionalismo**: Calidad garantizada y envíos rápidos
5. **Sin logística**: Printful se encarga de todo

### Casos de uso:
- Vender camisetas con diseños exclusivos
- Crear merchandising de tu marca
- Ofrecer productos personalizables a clientes
- Combinar productos de segunda mano con productos nuevos POD

---

## ✅ Requisitos Previos

### 1. Cuenta en Printful
- [ ] Crear cuenta en https://www.printful.com/
- [ ] Verificar email
- [ ] Configurar métodos de pago (para cuando se generen órdenes)

### 2. Backend Real (CRÍTICO)
**⚠️ IMPORTANTE**: Printful requiere un backend real. JSON Server NO es suficiente.

**Razones:**
- Necesitas mantener secretas las API keys de Printful
- Debes validar webhooks de Printful
- Requieres lógica de negocio compleja (sincronización, pricing, etc.)
- Necesitas almacenamiento persistente real (PostgreSQL/MongoDB)

### 3. Infraestructura
- [ ] Servidor con Node.js
- [ ] Base de datos (PostgreSQL recomendado)
- [ ] Dominio con HTTPS (para webhooks)
- [ ] Variables de entorno seguras

---

## 🏗️ Arquitectura de la Integración

```
┌─────────────────┐
│  Frontend       │
│  (React + TS)   │
│                 │
│  - Catálogo     │
│  - Carrito      │
│  - Checkout     │
└────────┬────────┘
         │
         │ API REST
         │
┌────────▼────────┐
│  Backend        │
│  (Node.js)      │
│                 │
│  - Auth         │
│  - Products API │
│  - Orders API   │
│  - Printful SDK │
└────────┬────────┘
         │
         │ Printful API
         │
┌────────▼────────┐
│  Printful       │
│                 │
│  - Productos    │
│  - Mockups      │
│  - Fulfillment  │
│  - Shipping     │
└─────────────────┘
```

---

## 📝 Plan de Implementación

### FASE 1: Setup Backend (1-2 semanas)
**Migrar de JSON Server a backend real**

#### 1.1 Decisión de Stack Backend
Opciones recomendadas:

**Opción A: Node.js + Express + TypeScript** ⭐ RECOMENDADO
```
Pros:
- Mismo lenguaje que frontend (TypeScript)
- Ecosistema rico de librerías
- SDK oficial de Printful
- Fácil integración con React

Contras:
- Requiere setup inicial
```

**Opción B: Node.js + NestJS + TypeScript**
```
Pros:
- Framework empresarial robusto
- Arquitectura escalable
- TypeScript nativo
- Módulos bien organizados

Contras:
- Curva de aprendizaje más alta
- Más complejo para proyectos pequeños
```

**Opción C: Supabase + Edge Functions**
```
Pros:
- Backend as a Service
- PostgreSQL incluido
- Auth incluido
- Deploy rápido

Contras:
- Vendor lock-in
- Limitaciones en plan gratuito
```

#### 1.2 Base de Datos
**PostgreSQL** (recomendado)
```sql
-- Tablas necesarias
- users (migrar de db.json)
- products (combinar locales + Printful)
- orders (mejorar estructura actual)
- printful_products (catálogo sincronizado)
- printful_sync_items (productos personalizados)
- printful_webhooks (log de eventos)
```

#### 1.3 Endpoints Necesarios
```
AUTH:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

PRODUCTS:
GET    /api/products
GET    /api/products/:id
GET    /api/products/printful (productos POD)
POST   /api/products/sync (sincronizar con Printful)

ORDERS:
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
POST   /api/orders/:id/fulfill (enviar a Printful)

PRINTFUL:
GET    /api/printful/catalog
GET    /api/printful/products/:id/mockups
POST   /api/printful/orders (crear orden en Printful)
POST   /api/webhooks/printful (recibir actualizaciones)
```

---

### FASE 2: Integración Printful API (1 semana)

#### 2.1 Configuración Inicial
```bash
# En tu backend
npm install @printful/printful-sdk
npm install dotenv
```

```typescript
// backend/src/config/printful.ts
import { PrintfulClient } from '@printful/printful-sdk';

export const printfulClient = new PrintfulClient({
  apiKey: process.env.PRINTFUL_API_KEY!,
});
```

#### 2.2 Variables de Entorno
```env
# .env (backend)
PRINTFUL_API_KEY=tu_api_key_de_printful
PRINTFUL_WEBHOOK_SECRET=tu_webhook_secret
PRINTFUL_STORE_ID=tu_store_id
```

#### 2.3 Obtener API Key
1. Login en Printful
2. Ir a **Settings** > **Stores**
3. Seleccionar tu tienda
4. **API** > **Generate API Key**
5. Copiar y guardar en `.env`

#### 2.4 Servicios Backend Necesarios

**PrintfulService.ts**
```typescript
import { PrintfulClient } from '@printful/printful-sdk';

export class PrintfulService {
  private client: PrintfulClient;

  constructor() {
    this.client = new PrintfulClient({
      apiKey: process.env.PRINTFUL_API_KEY!,
    });
  }

  // Obtener catálogo de productos
  async getCatalog() {
    const { result } = await this.client.get('products');
    return result;
  }

  // Obtener variantes de un producto
  async getProductVariants(productId: number) {
    const { result } = await this.client.get(`products/${productId}`);
    return result;
  }

  // Generar mockup
  async generateMockup(productId: number, files: any[]) {
    const { result } = await this.client.post('mockup-generator/create-task/{id}', {
      variant_ids: [productId],
      files: files,
    });
    return result;
  }

  // Calcular costos de envío
  async calculateShipping(recipient: any, items: any[]) {
    const { result } = await this.client.post('shipping/rates', {
      recipient,
      items,
    });
    return result;
  }

  // Crear orden en Printful
  async createOrder(orderData: any) {
    const { result } = await this.client.post('orders', orderData);
    return result;
  }

  // Confirmar orden (para que se produzca)
  async confirmOrder(orderId: string) {
    const { result } = await this.client.post(`orders/${orderId}/confirm`);
    return result;
  }

  // Obtener estado de orden
  async getOrder(orderId: string) {
    const { result } = await this.client.get(`orders/${orderId}`);
    return result;
  }
}
```

---

### FASE 3: Sincronización de Productos (1 semana)

#### 3.1 Estrategia Híbrida
Tu tienda tendrá DOS tipos de productos:

**Tipo 1: Productos Locales (actuales)**
- Productos de segunda mano
- Gestionados manualmente
- Stock limitado
- Vendidos por usuarios

**Tipo 2: Productos Printful (nuevos)**
- Print-on-demand
- Generados desde Printful
- Stock ilimitado
- Vendidos por la tienda

#### 3.2 Actualizar Modelo de Datos

**Nuevo tipo de producto:**
```typescript
// src/types/index.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: Category;
  condition: ProductCondition;
  image: string;
  images: string[];
  stock: number;
  rating: number;
  reviews: number;
  featured: boolean;
  
  // NUEVOS CAMPOS para Printful
  type: 'local' | 'printful'; // Identificar tipo de producto
  printfulId?: number; // ID del producto en Printful
  printfulVariantId?: number; // ID de la variante específica
  printfulSyncId?: number; // ID del sync product
  isPrintOnDemand?: boolean; // Flag para productos POD
  customizable?: boolean; // Si permite personalización
  mockups?: string[]; // URLs de mockups generados
  
  sellerId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 3.3 Script de Sincronización
```typescript
// backend/src/scripts/syncPrintful.ts
async function syncPrintfulProducts() {
  const printful = new PrintfulService();
  
  // 1. Obtener catálogo de Printful
  const catalog = await printful.getCatalog();
  
  // 2. Filtrar productos que quieres (ej: solo camisetas)
  const products = catalog.filter(p => 
    p.type === 'T-SHIRT' || p.type === 'HOODIE'
  );
  
  // 3. Para cada producto, obtener variantes
  for (const product of products) {
    const variants = await printful.getProductVariants(product.id);
    
    // 4. Guardar en tu base de datos
    await db.products.createMany({
      data: variants.map(variant => ({
        name: `${product.name} - ${variant.name}`,
        price: calculatePrice(variant.retail_price), // + tu margen
        type: 'printful',
        printfulId: product.id,
        printfulVariantId: variant.id,
        // ... más campos
      }))
    });
  }
}
```

---

### FASE 4: Actualizar Frontend (1 semana)

#### 4.1 Actualizar Componentes

**ProductCard.tsx** - Mostrar badge de POD
```typescript
<div className="relative">
  {product.type === 'printful' && (
    <span className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
      Print on Demand
    </span>
  )}
  <img src={product.image} alt={product.name} />
</div>
```

**ProductDetail.tsx** - Mostrar opciones de personalización
```typescript
{product.customizable && (
  <div className="mt-4">
    <h3>Personaliza tu producto</h3>
    <ColorPicker onChange={handleColorChange} />
    <SizeSelector onChange={handleSizeChange} />
    <FileUpload onChange={handleDesignUpload} />
  </div>
)}
```

#### 4.2 Nuevo Servicio API (Frontend)
```typescript
// src/api/printful.ts
const API_URL = import.meta.env.VITE_API_URL;

export const printfulAPI = {
  // Obtener productos Printful
  async getPrintfulProducts() {
    const response = await fetch(`${API_URL}/api/products/printful`);
    return response.json();
  },

  // Generar preview de producto personalizado
  async generatePreview(productId: string, design: File) {
    const formData = new FormData();
    formData.append('design', design);
    
    const response = await fetch(
      `${API_URL}/api/printful/products/${productId}/preview`,
      {
        method: 'POST',
        body: formData,
      }
    );
    return response.json();
  },

  // Calcular costos de envío
  async calculateShipping(address: Address, items: CartItem[]) {
    const response = await fetch(`${API_URL}/api/printful/shipping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, items }),
    });
    return response.json();
  },
};
```

---

### FASE 5: Checkout y Órdenes (1 semana)

#### 5.1 Actualizar Flujo de Checkout

**Separar items del carrito:**
```typescript
// src/store/cartStore.ts
export const useCartStore = create<CartStore>((set, get) => ({
  // ... código existente
  
  // Nuevo selector
  getItemsByType: () => {
    const items = get().items;
    return {
      local: items.filter(item => item.product.type === 'local'),
      printful: items.filter(item => item.product.type === 'printful'),
    };
  },
  
  // Calcular totales separados
  getTotalsByType: () => {
    const { local, printful } = get().getItemsByType();
    return {
      localTotal: local.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      printfulTotal: printful.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    };
  },
}));
```

**Actualizar Checkout.tsx:**
```typescript
const handleCheckout = async () => {
  const { local, printful } = cartStore.getItemsByType();
  
  // 1. Crear orden local (productos de segunda mano)
  if (local.length > 0) {
    await ordersAPI.createOrder({
      items: local,
      type: 'local',
      // ... datos de envío
    });
  }
  
  // 2. Crear orden en Printful (productos POD)
  if (printful.length > 0) {
    await ordersAPI.createPrintfulOrder({
      items: printful,
      shippingAddress: address,
      // Printful se encarga del fulfillment
    });
  }
};
```

#### 5.2 Backend - Crear Orden en Printful
```typescript
// backend/src/controllers/orders.controller.ts
async function createPrintfulOrder(req, res) {
  const { items, shippingAddress } = req.body;
  
  // 1. Formatear orden para Printful
  const printfulOrder = {
    recipient: {
      name: shippingAddress.name,
      address1: shippingAddress.street,
      city: shippingAddress.city,
      state_code: shippingAddress.state,
      country_code: shippingAddress.country,
      zip: shippingAddress.zipCode,
    },
    items: items.map(item => ({
      sync_variant_id: item.product.printfulVariantId,
      quantity: item.quantity,
      // Si hay personalización:
      files: item.customDesign ? [
        {
          url: item.customDesign.url,
        }
      ] : [],
    })),
  };
  
  // 2. Crear orden en Printful (draft)
  const printfulResponse = await printfulService.createOrder(printfulOrder);
  
  // 3. Guardar en tu BD
  const order = await db.orders.create({
    userId: req.user.id,
    type: 'printful',
    printfulOrderId: printfulResponse.id,
    status: 'draft',
    items: items,
    total: printfulResponse.costs.total,
  });
  
  // 4. Confirmar orden (para que se produzca)
  // SOLO cuando se confirme el pago
  // await printfulService.confirmOrder(printfulResponse.id);
  
  return res.json({ order });
}
```

---

### FASE 6: Webhooks (3-4 días)

#### 6.1 Configurar Webhooks en Printful
1. Ir a **Settings** > **Webhooks**
2. Agregar URL: `https://tudominio.com/api/webhooks/printful`
3. Seleccionar eventos:
   - `package_shipped`
   - `package_returned`
   - `order_failed`
   - `order_canceled`

#### 6.2 Endpoint de Webhooks
```typescript
// backend/src/controllers/webhooks.controller.ts
import crypto from 'crypto';

function verifyPrintfulWebhook(req) {
  const signature = req.headers['x-printful-signature'];
  const body = JSON.stringify(req.body);
  
  const hash = crypto
    .createHmac('sha256', process.env.PRINTFUL_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  
  return signature === hash;
}

export async function handlePrintfulWebhook(req, res) {
  // 1. Verificar firma
  if (!verifyPrintfulWebhook(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { type, data } = req.body;
  
  // 2. Procesar según tipo de evento
  switch (type) {
    case 'package_shipped':
      // Actualizar orden con tracking
      await db.orders.update({
        where: { printfulOrderId: data.order.id },
        data: {
          status: 'shipped',
          trackingNumber: data.shipment.tracking_number,
          trackingUrl: data.shipment.tracking_url,
        },
      });
      
      // Enviar email al cliente
      await sendShippingEmail(data.order.recipient.email, {
        trackingNumber: data.shipment.tracking_number,
        trackingUrl: data.shipment.tracking_url,
      });
      break;
      
    case 'order_failed':
      // Notificar al admin
      await notifyAdmin(`Orden ${data.order.id} falló: ${data.reason}`);
      break;
  }
  
  return res.json({ received: true });
}
```

---

## 🛠️ Herramientas Necesarias

### 1. Backend
- **Node.js** 18+ (runtime)
- **Express** o **NestJS** (framework)
- **TypeScript** (lenguaje)
- **Prisma** o **TypeORM** (ORM)
- **@printful/printful-sdk** (SDK oficial)

### 2. Base de Datos
- **PostgreSQL** 14+ (recomendado)
- **Alternativas**: MongoDB, MySQL

### 3. Hosting
- **Backend**: Railway, Render, Fly.io, DigitalOcean
- **Frontend**: Vercel, Netlify
- **Base de datos**: Supabase, PlanetScale, Railway

### 4. Servicios Adicionales
- **Cloudinary** o **AWS S3** (para subir diseños personalizados)
- **SendGrid** o **Mailgun** (emails transaccionales)
- **Stripe** o **PayPal** (pagos reales)

### 5. Desarrollo
- **Postman** o **Insomnia** (testing de API)
- **ngrok** (testing de webhooks en local)
- **Docker** (opcional, para desarrollo)

---

## 📚 Pasos Detallados - Checklist Completo

### Setup Backend (Semana 1-2)

#### [ ] Paso 1: Crear estructura del backend
```bash
mkdir backend
cd backend
npm init -y
npm install express typescript ts-node @types/node @types/express
npm install dotenv cors helmet
npm install @printful/printful-sdk
npm install prisma @prisma/client
npx tsc --init
```

#### [ ] Paso 2: Configurar TypeScript
```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

#### [ ] Paso 3: Inicializar Prisma
```bash
npx prisma init
```

#### [ ] Paso 4: Definir Schema de Base de Datos
```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  role      String   @default("user")
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Product {
  id                String   @id @default(uuid())
  name              String
  price             Float
  description       String
  category          String
  type              String   // 'local' | 'printful'
  printfulId        Int?
  printfulVariantId Int?
  printfulSyncId    Int?
  image             String
  images            String[]
  stock             Int
  orderItems        OrderItem[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Order {
  id               String      @id @default(uuid())
  userId           String
  user             User        @relation(fields: [userId], references: [id])
  items            OrderItem[]
  type             String      // 'local' | 'printful'
  printfulOrderId  String?
  status           String
  total            Float
  trackingNumber   String?
  trackingUrl      String?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Float
}
```

#### [ ] Paso 5: Migrar base de datos
```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### [ ] Paso 6: Crear servidor Express
```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Integración Printful (Semana 3)

#### [ ] Paso 7: Crear cuenta Printful
1. Ir a https://www.printful.com/
2. Crear cuenta
3. Verificar email
4. Completar perfil

#### [ ] Paso 8: Crear Store en Printful
1. Dashboard > Stores
2. "Add Store" > "Manual order platform / API"
3. Nombrar tu tienda: "Yard Sale 2.0"
4. Confirmar

#### [ ] Paso 9: Obtener API Key
1. Settings > API
2. "Enable API Access"
3. Copiar API Key
4. Agregar a `.env`

#### [ ] Paso 10: Implementar PrintfulService
```typescript
// backend/src/services/printful.service.ts
import { PrintfulClient } from '@printful/printful-sdk';

export class PrintfulService {
  private client: PrintfulClient;

  constructor() {
    this.client = new PrintfulClient({
      apiKey: process.env.PRINTFUL_API_KEY!,
    });
  }

  async getCatalog() {
    const { result } = await this.client.get('products');
    return result;
  }

  async getProduct(id: number) {
    const { result } = await this.client.get(`products/${id}`);
    return result;
  }

  async createOrder(orderData: any) {
    const { result } = await this.client.post('orders', orderData);
    return result;
  }

  async confirmOrder(id: string) {
    const { result } = await this.client.post(`orders/${id}/confirm`);
    return result;
  }

  async getOrder(id: string) {
    const { result } = await this.client.get(`orders/${id}`);
    return result;
  }

  async calculateShipping(recipient: any, items: any[]) {
    const { result } = await this.client.post('shipping/rates', {
      recipient,
      items,
    });
    return result;
  }
}
```

#### [ ] Paso 11: Testing de API
```bash
# Usar Postman o curl
curl http://localhost:3001/api/printful/catalog
```

### Frontend Updates (Semana 4)

#### [ ] Paso 12: Actualizar tipos TypeScript
```typescript
// src/types/index.ts
// (ya mostrado arriba)
```

#### [ ] Paso 13: Crear servicio API
```typescript
// src/api/printful.ts
// (ya mostrado arriba)
```

#### [ ] Paso 14: Actualizar componentes
- ProductCard
- ProductDetail
- CartItem
- Checkout

#### [ ] Paso 15: Testing E2E
- Agregar producto Printful al carrito
- Procesar checkout
- Verificar orden en Printful dashboard

---

## 💰 Costos y Consideraciones

### Costos de Printful
- **Gratis**: Cuenta y uso de la API
- **Solo pagas**: Cuando se crea una orden confirmada
- **Costos típicos**:
  - Camiseta básica: $8-12 USD (costo base)
  - Hoodie: $20-30 USD
  - Taza: $6-10 USD
  - Envío: Variable ($4-15 USD promedio USA)

### Tu Margen de Ganancia
```
Ejemplo: Camiseta
- Costo Printful: $10
- Tu precio de venta: $25
- Margen: $15 (60%)
- Recomendado: 40-80% de margen
```

### Costos de Infraestructura
**Estimado mensual:**
- Backend (Render/Railway): $7-25/mes
- Base de datos (Supabase/Railway): $0-25/mes
- Frontend (Vercel): $0 (plan gratuito)
- Dominio: $12/año
- **Total**: $15-50/mes

---

## 🧪 Testing

### Testing en Desarrollo
```bash
# 1. Usar modo sandbox de Printful
PRINTFUL_API_KEY=test_xxxxx

# 2. Testing local de webhooks
npm install -g ngrok
ngrok http 3001
# Usar URL ngrok en Printful webhooks
```

### Checklist de Testing
- [ ] Sincronizar catálogo de Printful
- [ ] Ver productos en frontend
- [ ] Agregar al carrito
- [ ] Calcular shipping
- [ ] Crear orden draft
- [ ] Confirmar orden
- [ ] Verificar en Printful dashboard
- [ ] Recibir webhook de envío
- [ ] Actualizar tracking en frontend

---

## 🗺️ Roadmap Completo

### Corto Plazo (1-2 meses)
- ✅ Setup backend Node.js + PostgreSQL
- ✅ Integración básica Printful API
- ✅ Sincronización de productos
- ✅ Checkout híbrido (local + Printful)
- ✅ Webhooks para tracking

### Mediano Plazo (3-6 meses)
- [ ] Diseñador de productos en frontend
- [ ] Upload de diseños personalizados
- [ ] Preview en tiempo real
- [ ] Multi-mockups (diferentes colores/tallas)
- [ ] Calculadora de márgenes en tiempo real

### Largo Plazo (6-12 meses)
- [ ] Panel de admin completo
- [ ] Analytics de ventas
- [ ] Gestión de inventario híbrido
- [ ] Programa de afiliados
- [ ] App móvil (React Native)

---

## 📖 Recursos Útiles

### Documentación Oficial
- **Printful API Docs**: https://developers.printful.com/
- **Printful SDK**: https://github.com/printful/printful-sdk-js
- **Mockup Generator**: https://developers.printful.com/docs/#tag/Mockup-Generator-API

### Tutoriales
- Printful YouTube Channel
- Blog oficial de Printful
- Comunidad en Discord

### Soporte
- Printful Support: support@printful.com
- Chat en vivo en dashboard
- Help Center: https://help.printful.com/

---

## ⚠️ Consideraciones Importantes

### Limitaciones
- **Tiempo de producción**: 2-7 días (avisar a clientes)
- **Costos de envío**: Pueden ser altos fuera de USA/EU
- **Sin control de calidad directo**: Confías en Printful
- **Márgenes variables**: Algunos productos tienen margen bajo

### Mejores Prácticas
1. **Transparencia**: Avisar que son productos print-on-demand
2. **Tiempos de entrega**: Mostrar claramente 7-14 días
3. **Política de devoluciones**: Definir bien antes de lanzar
4. **Pricing**: Calcular bien márgenes (mínimo 40%)
5. **Testing**: Ordenar muestras antes de vender

### Legal
- Términos y condiciones actualizados
- Política de privacidad (datos a Printful)
- Política de devoluciones
- Impuestos (si aplica en tu país)

---

## 🎯 Siguiente Paso Inmediato

**ACCIÓN RECOMENDADA:**
1. Crear cuenta en Printful (15 min)
2. Explorar el catálogo (30 min)
3. Ordenar 1-2 productos de muestra ($20-40)
4. Mientras llegan, empezar setup del backend (1 semana)
5. Una vez tengas las muestras, decidir qué productos ofrecer

**¿Necesitas ayuda?** Puedo ayudarte a:
- Crear la estructura del backend
- Implementar el PrintfulService
- Actualizar el frontend para productos POD
- Configurar webhooks
- Testing completo de la integración

---

**Creado**: Octubre 2025  
**Versión**: 1.0  
**Proyecto**: Yard Sale 2.0
