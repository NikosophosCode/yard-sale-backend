# 🛍️ FASE 3: API de Productos
## CRUD + Búsqueda + Filtros + Upload de Imágenes

**Duración Estimada**: 2-3 días  
**Complejidad**: Media  
**Prerequisitos**: Fase 1 y 2 completadas

---

## 📋 Objetivos de la Fase

- ✅ Crear modelos de Producto y Categoría con Mongoose
- ✅ Implementar CRUD completo de productos
- ✅ Sistema de búsqueda avanzada (full-text search)
- ✅ Filtros por categoría, precio, condición, rating
- ✅ Paginación con metadata completo
- ✅ Ordenamiento múltiple
- ✅ Upload de imágenes a Cloudinary
- ✅ Middleware de Multer para archivos
- ✅ Productos relacionados por categoría
- ✅ Productos destacados (featured)
- ✅ Validadores de productos
- ✅ Seeder para migrar datos de db.json
- ✅ Endpoints de categorías

---

## 📦 Paso 1: Instalar Dependencias

```powershell
# Upload de archivos
npm install multer cloudinary multer-storage-cloudinary

# Tipos
npm install -D @types/multer

# Utilidades adicionales
npm install slugify
```

---

## ☁️ Paso 2: Configurar Cloudinary

### 2.1 Obtener Credenciales

1. Crear cuenta en [Cloudinary](https://cloudinary.com/users/register/free)
2. Ir al Dashboard
3. Copiar: Cloud Name, API Key, API Secret

### 2.2 Actualizar `.env`

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=yardsale-products
```

### 2.3 Crear `src/config/cloudinary.ts`

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import logger from '@/utils/logger';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verificar configuración
const verifyCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();

  if (!cloud_name || !api_key || !api_secret) {
    logger.error('❌ Cloudinary no está configurado correctamente');
    logger.error('Verifica las variables de entorno CLOUDINARY_*');
    return false;
  }

  logger.info('✅ Cloudinary configurado correctamente');
  return true;
};

verifyCloudinaryConfig();

// Configuración de almacenamiento para Multer
export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: process.env.CLOUDINARY_FOLDER || 'yardsale-products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Limitar tamaño máximo
        { quality: 'auto' }, // Calidad automática
        { fetch_format: 'auto' }, // Formato automático (webp si es soportado)
      ],
      public_id: `product-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  },
});

// Función para eliminar imagen de Cloudinary
export const deleteCloudinaryImage = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok') {
      logger.info(`Imagen eliminada de Cloudinary: ${publicId}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error al eliminar imagen de Cloudinary:', error);
    return false;
  }
};

// Función para extraer public_id de URL de Cloudinary
export const extractPublicId = (url: string): string | null => {
  try {
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

export default cloudinary;
```

---

## 🗃️ Paso 3: Crear Modelos

### 3.1 Crear `src/models/Category.ts`

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es requerido'],
      trim: true,
      maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres'],
    },
    icon: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    productCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Índices
CategorySchema.index({ slug: 1 });
CategorySchema.index({ isActive: 1 });

const Category = mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
```

### 3.2 Crear `src/models/Product.ts`

```typescript
import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

export interface IProduct extends Document {
  name: string;
  slug: string;
  price: number;
  description: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  image: string;
  images: string[];
  stock: number;
  rating: number;
  reviews: number;
  featured: boolean;
  isActive: boolean;
  sellerId: mongoose.Types.ObjectId;
  tags: string[];
  specifications?: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
      index: 'text', // Para búsqueda full-text
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'El precio es requerido'],
      min: [0, 'El precio no puede ser negativo'],
      max: [1000000, 'El precio no puede exceder 1,000,000'],
    },
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      trim: true,
      maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
      index: 'text', // Para búsqueda full-text
    },
    category: {
      type: String,
      required: [true, 'La categoría es requerida'],
      enum: ['clothes', 'electronics', 'furniture', 'toys', 'others'],
      index: true,
    },
    condition: {
      type: String,
      required: [true, 'La condición es requerida'],
      enum: ['new', 'like-new', 'good', 'fair'],
      default: 'good',
    },
    image: {
      type: String,
      required: [true, 'La imagen principal es requerida'],
    },
    images: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: 'No puedes agregar más de 10 imágenes',
      },
    },
    stock: {
      type: Number,
      required: [true, 'El stock es requerido'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'El rating no puede ser menor a 0'],
      max: [5, 'El rating no puede ser mayor a 5'],
    },
    reviews: {
      type: Number,
      default: 0,
      min: [0, 'El número de reviews no puede ser negativo'],
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El vendedor es requerido'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: 'No puedes agregar más de 10 tags',
      },
    },
    specifications: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual para indicar si está en stock
ProductSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Virtual para indicar stock bajo
ProductSchema.virtual('lowStock').get(function () {
  return this.stock > 0 && this.stock <= 5;
});

// Middleware: Generar slug automáticamente antes de guardar
ProductSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
  next();
});

// Middleware: Asegurar que image esté en images
ProductSchema.pre('save', function (next) {
  if (this.image && !this.images.includes(this.image)) {
    this.images.unshift(this.image);
  }
  next();
});

// Índices compuestos para búsqueda y filtrado
ProductSchema.index({ name: 'text', description: 'text' }); // Full-text search
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ featured: 1, isActive: 1 });
ProductSchema.index({ sellerId: 1, isActive: 1 });

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
```

---

## 🛡️ Paso 4: Middleware de Upload

### 4.1 Crear `src/middlewares/upload.middleware.ts`

```typescript
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { cloudinaryStorage } from '@/config/cloudinary';
import path from 'path';

// Tipos de archivo permitidos
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Filtro de archivos
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Verificar tipo MIME
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan: JPG, PNG, WEBP'));
  }
};

// Configuración de Multer con Cloudinary
export const uploadProduct = multer({
  storage: cloudinaryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB máximo
    files: 10, // Máximo 10 archivos
  },
});

// Middleware para una sola imagen
export const uploadSingle = uploadProduct.single('image');

// Middleware para múltiples imágenes
export const uploadMultiple = uploadProduct.array('images', 10);

// Middleware de manejo de errores de Multer
export const handleUploadError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File Too Large',
        message: 'El archivo no puede exceder 5 MB',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too Many Files',
        message: 'No puedes subir más de 10 archivos',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected Field',
        message: 'Campo de archivo inesperado',
      });
    }
  }

  if (err) {
    return res.status(400).json({
      error: 'Upload Error',
      message: err.message || 'Error al subir archivo',
    });
  }

  next();
};
```

---

## ✅ Paso 5: Validadores de Productos

### 5.1 Crear `src/validators/product.validator.ts`

```typescript
import { body, query, param, ValidationChain } from 'express-validator';

/**
 * Validaciones para crear producto
 */
export const createProductValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

  body('price')
    .notEmpty()
    .withMessage('El precio es requerido')
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('El precio debe ser un número positivo menor a 1,000,000'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),

  body('category')
    .notEmpty()
    .withMessage('La categoría es requerida')
    .isIn(['clothes', 'electronics', 'furniture', 'toys', 'others'])
    .withMessage('Categoría no válida'),

  body('condition')
    .notEmpty()
    .withMessage('La condición es requerida')
    .isIn(['new', 'like-new', 'good', 'fair'])
    .withMessage('Condición no válida'),

  body('stock')
    .notEmpty()
    .withMessage('El stock es requerido')
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),

  body('featured').optional().isBoolean().withMessage('Featured debe ser un booleano'),

  body('tags').optional().isArray().withMessage('Tags debe ser un array'),

  body('tags.*').optional().isString().withMessage('Cada tag debe ser un string'),
];

/**
 * Validaciones para actualizar producto
 */
export const updateProductValidation: ValidationChain[] = [
  param('id').isMongoId().withMessage('ID de producto no válido'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

  body('price')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('El precio debe ser un número positivo menor a 1,000,000'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),

  body('category')
    .optional()
    .isIn(['clothes', 'electronics', 'furniture', 'toys', 'others'])
    .withMessage('Categoría no válida'),

  body('condition')
    .optional()
    .isIn(['new', 'like-new', 'good', 'fair'])
    .withMessage('Condición no válida'),

  body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),

  body('featured').optional().isBoolean().withMessage('Featured debe ser un booleano'),

  body('isActive').optional().isBoolean().withMessage('isActive debe ser un booleano'),
];

/**
 * Validaciones para búsqueda y filtros
 */
export const searchProductsValidation: ValidationChain[] = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Búsqueda muy larga'),

  query('category')
    .optional()
    .isIn(['all', 'clothes', 'electronics', 'furniture', 'toys', 'others'])
    .withMessage('Categoría no válida'),

  query('condition')
    .optional()
    .isIn(['new', 'like-new', 'good', 'fair'])
    .withMessage('Condición no válida'),

  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Precio mínimo debe ser positivo'),

  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Precio máximo debe ser positivo'),

  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating mínimo debe estar entre 0 y 5'),

  query('sortBy')
    .optional()
    .isIn(['recent', 'price-asc', 'price-desc', 'name', 'rating'])
    .withMessage('Criterio de ordenamiento no válido'),

  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),

  query('featured').optional().isBoolean().withMessage('Featured debe ser un booleano'),
];

/**
 * Validación para ID de producto
 */
export const productIdValidation: ValidationChain[] = [
  param('id').isMongoId().withMessage('ID de producto no válido'),
];
```

---

## 🎯 Paso 6: Controlador de Productos

### 6.1 Crear `src/controllers/product.controller.ts`

```typescript
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { deleteCloudinaryImage, extractPublicId } from '@/config/cloudinary';
import logger from '@/utils/logger';

/**
 * @route   GET /api/v1/products
 * @desc    Obtener todos los productos con filtros y paginación
 * @access  Public
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    // Parámetros de consulta
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'recent',
      page = 1,
      limit = 20,
      featured,
    } = req.query;

    // Construir filtros
    const filters: any = { isActive: true };

    // Búsqueda de texto
    if (search) {
      filters.$text = { $search: search as string };
    }

    // Filtro por categoría
    if (category && category !== 'all') {
      filters.category = category;
    }

    // Filtro por condición
    if (condition) {
      filters.condition = condition;
    }

    // Filtro por rango de precio
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }

    // Filtro por rating mínimo
    if (minRating) {
      filters.rating = { $gte: Number(minRating) };
    }

    // Filtro por featured
    if (featured !== undefined) {
      filters.featured = featured === 'true';
    }

    // Ordenamiento
    let sort: any = {};
    switch (sortBy) {
      case 'recent':
        sort = { createdAt: -1 };
        break;
      case 'price-asc':
        sort = { price: 1 };
        break;
      case 'price-desc':
        sort = { price: -1 };
        break;
      case 'name':
        sort = { name: 1 };
        break;
      case 'rating':
        sort = { rating: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Si hay búsqueda de texto, agregar score al sort
    if (search) {
      sort = { score: { $meta: 'textScore' }, ...sort };
    }

    // Paginación
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Proyección para búsqueda de texto
    const projection = search ? { score: { $meta: 'textScore' } } : {};

    // Consulta con paginación
    const [products, totalProducts] = await Promise.all([
      Product.find(filters, projection)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('sellerId', 'name email')
        .lean(),
      Product.countDocuments(filters),
    ]);

    // Metadata de paginación
    const totalPages = Math.ceil(totalProducts / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      products,
      pagination: {
        total: totalProducts,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        search: search || null,
        category: category || 'all',
        condition: condition || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        minRating: minRating || null,
        sortBy,
        featured: featured || null,
      },
    });
  } catch (error: any) {
    logger.error('Error al obtener productos:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al obtener productos',
    });
  }
};

/**
 * @route   GET /api/v1/products/:id
 * @desc    Obtener producto por ID
 * @access  Public
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const product = await Product.findById(req.params.id).populate('sellerId', 'name email avatar');

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Producto no encontrado',
      });
    }

    res.status(200).json({ product });
  } catch (error: any) {
    logger.error('Error al obtener producto:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al obtener producto',
    });
  }
};

/**
 * @route   POST /api/v1/products
 * @desc    Crear nuevo producto
 * @access  Private (Admin o Seller)
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const { name, price, description, category, condition, stock, featured, tags } = req.body;

    // Obtener URLs de imágenes subidas
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Debes subir al menos una imagen',
      });
    }

    const images = files.map((file) => file.path);
    const image = images[0]; // Primera imagen como principal

    // Crear producto
    const product = new Product({
      name,
      price,
      description,
      category,
      condition,
      image,
      images,
      stock,
      featured: featured || false,
      tags: tags || [],
      sellerId: req.user!.userId, // Del middleware de autenticación
    });

    await product.save();

    // Actualizar contador de categoría
    await Category.findOneAndUpdate({ id: category }, { $inc: { productCount: 1 } });

    logger.info(`Producto creado: ${product.name} (${product._id})`);

    res.status(201).json({
      message: 'Producto creado exitosamente',
      product,
    });
  } catch (error: any) {
    logger.error('Error al crear producto:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al crear producto',
    });
  }
};

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Actualizar producto
 * @access  Private (Admin o Owner)
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Producto no encontrado',
      });
    }

    // Verificar permisos (solo admin o owner)
    if (req.user!.role !== 'admin' && product.sellerId.toString() !== req.user!.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No tienes permisos para actualizar este producto',
      });
    }

    // Actualizar campos permitidos
    const allowedUpdates = [
      'name',
      'price',
      'description',
      'category',
      'condition',
      'stock',
      'featured',
      'isActive',
      'tags',
    ];

    const updates: any = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Si se subieron nuevas imágenes
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const newImages = files.map((file) => file.path);
      updates.images = [...product.images, ...newImages].slice(0, 10); // Máximo 10 imágenes
      updates.image = newImages[0]; // Actualizar imagen principal
    }

    Object.assign(product, updates);
    await product.save();

    logger.info(`Producto actualizado: ${product.name} (${product._id})`);

    res.status(200).json({
      message: 'Producto actualizado exitosamente',
      product,
    });
  } catch (error: any) {
    logger.error('Error al actualizar producto:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al actualizar producto',
    });
  }
};

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Eliminar producto
 * @access  Private (Admin o Owner)
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Producto no encontrado',
      });
    }

    // Verificar permisos
    if (req.user!.role !== 'admin' && product.sellerId.toString() !== req.user!.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No tienes permisos para eliminar este producto',
      });
    }

    // Eliminar imágenes de Cloudinary
    for (const imageUrl of product.images) {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        await deleteCloudinaryImage(publicId);
      }
    }

    // Eliminar producto
    await product.deleteOne();

    // Actualizar contador de categoría
    await Category.findOneAndUpdate({ id: product.category }, { $inc: { productCount: -1 } });

    logger.info(`Producto eliminado: ${product.name} (${product._id})`);

    res.status(200).json({
      message: 'Producto eliminado exitosamente',
    });
  } catch (error: any) {
    logger.error('Error al eliminar producto:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al eliminar producto',
    });
  }
};

/**
 * @route   GET /api/v1/products/:id/related
 * @desc    Obtener productos relacionados (misma categoría)
 * @access  Public
 */
export const getRelatedProducts = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Producto no encontrado',
      });
    }

    const limit = Number(req.query.limit) || 4;

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .sort({ rating: -1 })
      .limit(limit)
      .select('-__v');

    res.status(200).json({
      products: relatedProducts,
      count: relatedProducts.length,
    });
  } catch (error: any) {
    logger.error('Error al obtener productos relacionados:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al obtener productos relacionados',
    });
  }
};

/**
 * @route   GET /api/v1/products/featured
 * @desc    Obtener productos destacados
 * @access  Public
 */
export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 8;

    const products = await Product.find({ featured: true, isActive: true })
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit)
      .select('-__v');

    res.status(200).json({
      products,
      count: products.length,
    });
  } catch (error: any) {
    logger.error('Error al obtener productos destacados:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al obtener productos destacados',
    });
  }
};
```

---

*Continúa en la siguiente sección debido a la extensión...*

## 📍 Paso 7: Rutas de Productos

### 7.1 Crear `src/routes/product.routes.ts`

```typescript
import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  getFeaturedProducts,
} from '@/controllers/product.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { uploadMultiple, handleUploadError } from '@/middlewares/upload.middleware';
import {
  searchProductsValidation,
  productIdValidation,
  createProductValidation,
  updateProductValidation,
} from '@/validators/product.validator';

const router = Router();

// Rutas públicas
router.get('/', searchProductsValidation, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', productIdValidation, getProductById);
router.get('/:id/related', productIdValidation, getRelatedProducts);

// Rutas protegidas (requieren autenticación)
router.post(
  '/',
  authenticate,
  uploadMultiple,
  handleUploadError,
  createProductValidation,
  createProduct
);

router.put(
  '/:id',
  authenticate,
  uploadMultiple,
  handleUploadError,
  updateProductValidation,
  updateProduct
);

router.delete('/:id', authenticate, productIdValidation, deleteProduct);

export default router;
```

### 7.2 Crear rutas de categorías `src/routes/category.routes.ts`

```typescript
import { Router } from 'express';
import Category from '@/models/Category';

const router = Router();

/**
 * @route   GET /api/v1/categories
 * @desc    Obtener todas las categorías
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).select('-__v').sort({ name: 1 });

    res.status(200).json({
      categories,
      count: categories.length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al obtener categorías',
    });
  }
});

export default router;
```

### 7.3 Integrar rutas en `src/app.ts`

Agregar después de los middlewares y antes del 404 handler:

```typescript
// Importar rutas
import productRoutes from '@/routes/product.routes';
import categoryRoutes from '@/routes/category.routes';

// API Routes
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
```

---

## 🌱 Paso 8: Seeder para Migrar Datos

### 8.1 Crear `src/utils/seeders.ts`

```typescript
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Product from '@/models/Product';
import Category from '@/models/Category';
import User from '@/models/User';
import logger from '@/utils/logger';
import connectDB from '@/config/database';

// Cargar datos de db.json
const loadJsonData = () => {
  const dbPath = path.join(__dirname, '../../db.json');
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
};

/**
 * Seed de categorías
 */
export const seedCategories = async () => {
  try {
    const categories = [
      {
        id: 'clothes',
        name: 'Ropa',
        slug: 'ropa',
        description: 'Ropa y accesorios de moda',
        icon: '👕',
      },
      {
        id: 'electronics',
        name: 'Electrónicos',
        slug: 'electronicos',
        description: 'Dispositivos electrónicos y gadgets',
        icon: '📱',
      },
      {
        id: 'furniture',
        name: 'Muebles',
        slug: 'muebles',
        description: 'Muebles y decoración para el hogar',
        icon: '🛋️',
      },
      {
        id: 'toys',
        name: 'Juguetes',
        slug: 'juguetes',
        description: 'Juguetes y juegos para niños',
        icon: '🎮',
      },
      {
        id: 'others',
        name: 'Otros',
        slug: 'otros',
        description: 'Otros productos diversos',
        icon: '📦',
      },
    ];

    await Category.deleteMany({});
    await Category.insertMany(categories);

    logger.info(`✅ ${categories.length} categorías creadas`);
  } catch (error) {
    logger.error('Error al crear categorías:', error);
    throw error;
  }
};

/**
 * Seed de productos desde db.json
 */
export const seedProducts = async () => {
  try {
    const jsonData = loadJsonData();
    const products = jsonData.products;

    // Obtener el primer usuario como vendedor por defecto
    const defaultSeller = await User.findOne({ role: 'admin' });

    if (!defaultSeller) {
      throw new Error('No hay usuarios en la base de datos. Crea un usuario primero.');
    }

    // Limpiar productos existentes
    await Product.deleteMany({});

    // Mapear productos de db.json a formato de MongoDB
    const productDocuments = products.map((p: any) => ({
      name: p.name,
      price: p.price,
      description: p.description,
      category: p.category,
      condition: p.condition,
      image: p.image,
      images: p.images,
      stock: p.stock,
      rating: p.rating,
      reviews: p.reviews,
      featured: p.featured,
      sellerId: defaultSeller._id,
    }));

    await Product.insertMany(productDocuments);

    // Actualizar contadores de categorías
    const categories = await Category.find();
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category.id, isActive: true });
      category.productCount = count;
      await category.save();
    }

    logger.info(`✅ ${productDocuments.length} productos creados`);
  } catch (error) {
    logger.error('Error al crear productos:', error);
    throw error;
  }
};

/**
 * Ejecutar todos los seeders
 */
export const runSeeders = async () => {
  try {
    await connectDB();

    logger.info('🌱 Iniciando seeders...');

    await seedCategories();
    await seedProducts();

    logger.info('✅ Seeders completados exitosamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error en seeders:', error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  runSeeders();
}
```

### 8.2 Agregar script en `package.json`

```json
{
  "scripts": {
    "seed": "ts-node src/utils/seeders.ts"
  }
}
```

### 8.3 Ejecutar seeder

```powershell
npm run seed
```

---

## ✅ Paso 9: Testing con Postman

### 9.1 Crear Collection de Postman

**GET** - Listar Productos
```
GET http://localhost:5000/api/v1/products
GET http://localhost:5000/api/v1/products?category=electronics
GET http://localhost:5000/api/v1/products?search=laptop
GET http://localhost:5000/api/v1/products?minPrice=50&maxPrice=200
GET http://localhost:5000/api/v1/products?sortBy=price-asc&page=1&limit=10
```

**GET** - Detalle de Producto
```
GET http://localhost:5000/api/v1/products/:id
```

**GET** - Productos Destacados
```
GET http://localhost:5000/api/v1/products/featured?limit=8
```

**GET** - Productos Relacionados
```
GET http://localhost:5000/api/v1/products/:id/related?limit=4
```

**POST** - Crear Producto (requiere auth + imágenes)
```
POST http://localhost:5000/api/v1/products
Headers:
  Authorization: Bearer <token>
Body: form-data
  name: Nuevo Producto
  price: 150
  description: Descripción del producto...
  category: electronics
  condition: new
  stock: 10
  images: [archivos]
```

**PUT** - Actualizar Producto (requiere auth)
```
PUT http://localhost:5000/api/v1/products/:id
Headers:
  Authorization: Bearer <token>
Body: JSON
{
  "price": 180,
  "stock": 8
}
```

**DELETE** - Eliminar Producto (requiere auth)
```
DELETE http://localhost:5000/api/v1/products/:id
Headers:
  Authorization: Bearer <token>
```

**GET** - Listar Categorías
```
GET http://localhost:5000/api/v1/categories
```

---

## ✅ Checklist de Verificación

- [ ] Cloudinary configurado y funcionando
- [ ] Modelos de Product y Category creados
- [ ] Middleware de upload funcionando (Multer + Cloudinary)
- [ ] Validadores de productos implementados
- [ ] Controlador de productos completo
- [ ] Rutas de productos registradas
- [ ] Rutas de categorías registradas
- [ ] Seeder ejecutado exitosamente
- [ ] 20 productos en MongoDB
- [ ] 5 categorías en MongoDB
- [ ] GET /products funciona con paginación
- [ ] Filtros funcionan (categoría, precio, condición)
- [ ] Búsqueda de texto funciona
- [ ] Ordenamiento funciona
- [ ] POST /products funciona (con upload de imágenes)
- [ ] PUT /products funciona
- [ ] DELETE /products funciona (elimina imágenes de Cloudinary)
- [ ] Productos relacionados funcionan
- [ ] Productos destacados funcionan
- [ ] Autorización funciona (solo owner/admin puede editar)
- [ ] Full-text search indexado en MongoDB

---

## 🎯 Próximos Pasos

Una vez completada la Fase 3, continúa con **BACKEND_PHASE_4.md** para implementar:
- API de Órdenes
- Gestión de carrito en backend
- Validación de stock
- Estados de órdenes
- Webhooks de pago

---

**Autor**: Nicolas Acuña  
**Fecha**: 26 de Octubre 2025  
**Fase**: 3 de 6  
**Estado**: ✅ Documentación Completa
