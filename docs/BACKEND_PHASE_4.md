# 📦 FASE 4: API de Órdenes y Carrito
## Gestión Completa de Órdenes + Validación de Stock

**Duración Estimada**: 2-3 días  
**Complejidad**: Media-Alta  
**Prerequisitos**: Fases 1, 2 y 3 completadas

---

## 📋 Objetivos de la Fase

- ✅ Crear modelo de Orden con Mongoose
- ✅ Crear orden desde datos del carrito
- ✅ Validación de stock en tiempo real
- ✅ Actualización automática de stock post-orden
- ✅ Cálculos automáticos (subtotal, tax, shipping, total)
- ✅ Estados de orden (pending, processing, shipped, delivered, cancelled)
- ✅ Historial de órdenes por usuario
- ✅ Detalle completo de orden
- ✅ Cancelación de órdenes
- ✅ Actualización de estado (admin)
- ✅ Transacciones de MongoDB (atomicidad)
- ✅ Validadores de órdenes
- ✅ Estadísticas de órdenes (admin)
- ✅ Generación de número de orden único

---

## 🗃️ Paso 1: Crear Modelo de Orden

### 1.1 Crear `src/models/Order.ts`

```typescript
import mongoose, { Document, Schema } from 'mongoose';

// Interfaz para OrderItem
export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage: string;
  quantity: number;
  priceAtPurchase: number;
}

// Interfaz para ShippingAddress
export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Tipos
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'credit-card' | 'debit-card' | 'paypal' | 'cash-on-delivery';

// Interfaz del documento de Orden
export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: IShippingAddress;
  trackingNumber?: string;
  notes?: string;
  cancelledAt?: Date;
  cancelReason?: string;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema de OrderItem
const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productImage: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'La cantidad debe ser al menos 1'],
    },
    priceAtPurchase: {
      type: Number,
      required: true,
      min: [0, 'El precio no puede ser negativo'],
    },
  },
  { _id: false }
);

// Schema de ShippingAddress
const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    street: {
      type: String,
      required: [true, 'La calle es requerida'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'La ciudad es requerida'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'El estado es requerido'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'El código postal es requerido'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'El país es requerido'],
      default: 'México',
    },
  },
  { _id: false }
);

// Schema de Order
const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es requerido'],
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function (items: IOrderItem[]) {
          return items.length > 0;
        },
        message: 'La orden debe tener al menos un producto',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'El subtotal no puede ser negativo'],
    },
    tax: {
      type: Number,
      required: true,
      min: [0, 'El impuesto no puede ser negativo'],
    },
    shipping: {
      type: Number,
      required: true,
      min: [0, 'El envío no puede ser negativo'],
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'El total no puede ser negativo'],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['credit-card', 'debit-card', 'paypal', 'cash-on-delivery'],
      required: [true, 'El método de pago es requerido'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: [true, 'La dirección de envío es requerida'],
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      maxlength: [200, 'La razón de cancelación no puede exceder 200 caracteres'],
    },
    deliveredAt: {
      type: Date,
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

// Virtual para total de items
OrderSchema.virtual('itemCount').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual para verificar si puede ser cancelada
OrderSchema.virtual('canBeCancelled').get(function () {
  return ['pending', 'processing'].includes(this.status);
});

// Middleware: Generar número de orden único antes de guardar
OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.orderNumber = `YS-${timestamp}-${random}`;
  }
  next();
});

// Middleware: Actualizar deliveredAt cuando status cambia a delivered
OrderSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  next();
});

// Middleware: Actualizar cancelledAt cuando status cambia a cancelled
OrderSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  next();
});

// Índices compuestos
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });

const Order = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
```

---

## ✅ Paso 2: Validadores de Órdenes

### 2.1 Crear `src/validators/order.validator.ts`

```typescript
import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Validaciones para crear orden
 */
export const createOrderValidation: ValidationChain[] = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debes incluir al menos un producto en la orden'),

  body('items.*.productId')
    .notEmpty()
    .withMessage('El ID del producto es requerido')
    .isMongoId()
    .withMessage('ID de producto no válido'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('La cantidad es requerida')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser al menos 1'),

  body('subtotal')
    .notEmpty()
    .withMessage('El subtotal es requerido')
    .isFloat({ min: 0 })
    .withMessage('El subtotal debe ser un número positivo'),

  body('tax')
    .notEmpty()
    .withMessage('El impuesto es requerido')
    .isFloat({ min: 0 })
    .withMessage('El impuesto debe ser un número positivo'),

  body('shipping')
    .notEmpty()
    .withMessage('El costo de envío es requerido')
    .isFloat({ min: 0 })
    .withMessage('El envío debe ser un número positivo'),

  body('total')
    .notEmpty()
    .withMessage('El total es requerido')
    .isFloat({ min: 0 })
    .withMessage('El total debe ser un número positivo'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('El método de pago es requerido')
    .isIn(['credit-card', 'debit-card', 'paypal', 'cash-on-delivery'])
    .withMessage('Método de pago no válido'),

  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('La calle es requerida')
    .isLength({ min: 5, max: 100 })
    .withMessage('La calle debe tener entre 5 y 100 caracteres'),

  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('La ciudad es requerida')
    .isLength({ min: 2, max: 50 })
    .withMessage('La ciudad debe tener entre 2 y 50 caracteres'),

  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('El estado es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El estado debe tener entre 2 y 50 caracteres'),

  body('shippingAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('El código postal es requerido')
    .matches(/^\d{5}$/)
    .withMessage('El código postal debe tener 5 dígitos'),

  body('shippingAddress.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El país debe tener entre 2 y 50 caracteres'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres'),
];

/**
 * Validaciones para actualizar estado de orden
 */
export const updateOrderStatusValidation: ValidationChain[] = [
  param('id').isMongoId().withMessage('ID de orden no válido'),

  body('status')
    .notEmpty()
    .withMessage('El estado es requerido')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Estado no válido'),

  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('El número de rastreo debe tener entre 5 y 50 caracteres'),
];

/**
 * Validaciones para cancelar orden
 */
export const cancelOrderValidation: ValidationChain[] = [
  param('id').isMongoId().withMessage('ID de orden no válido'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La razón no puede exceder 200 caracteres'),
];

/**
 * Validaciones para búsqueda de órdenes
 */
export const searchOrdersValidation: ValidationChain[] = [
  query('status')
    .optional()
    .isIn(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Estado no válido'),

  query('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Estado de pago no válido'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),

  query('sortBy')
    .optional()
    .isIn(['recent', 'oldest', 'total-asc', 'total-desc'])
    .withMessage('Criterio de ordenamiento no válido'),
];

/**
 * Validación para ID de orden
 */
export const orderIdValidation: ValidationChain[] = [
  param('id').isMongoId().withMessage('ID de orden no válido'),
];
```

---

## 🎯 Paso 3: Controlador de Órdenes

### 3.1 Crear `src/controllers/order.controller.ts`

```typescript
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import logger from '@/utils/logger';

/**
 * @route   POST /api/v1/orders
 * @desc    Crear nueva orden
 * @access  Private
 */
export const createOrder = async (req: Request, res: Response) => {
  // Iniciar sesión de transacción para asegurar atomicidad
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const { items, subtotal, tax, shipping, total, paymentMethod, shippingAddress, notes } =
      req.body;

    // Validar y obtener información de productos
    const orderItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          error: 'Not Found',
          message: `Producto con ID ${item.productId} no encontrado`,
        });
      }

      if (!product.isActive) {
        await session.abortTransaction();
        return res.status(400).json({
          error: 'Bad Request',
          message: `El producto "${product.name}" no está disponible`,
        });
      }

      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          error: 'Bad Request',
          message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}`,
        });
      }

      // Actualizar stock del producto
      product.stock -= item.quantity;
      await product.save({ session });

      // Agregar item a la orden
      orderItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.image,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });

      calculatedSubtotal += product.price * item.quantity;
    }

    // Validar cálculos (tolerancia de 0.01 por redondeos)
    const TAX_RATE = 0.16; // 16%
    const FREE_SHIPPING_THRESHOLD = 500;

    const expectedTax = parseFloat((calculatedSubtotal * TAX_RATE).toFixed(2));
    const expectedShipping = calculatedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 50;
    const expectedTotal = parseFloat((calculatedSubtotal + expectedTax + expectedShipping).toFixed(2));

    if (
      Math.abs(subtotal - calculatedSubtotal) > 0.01 ||
      Math.abs(tax - expectedTax) > 0.01 ||
      Math.abs(shipping - expectedShipping) > 0.01 ||
      Math.abs(total - expectedTotal) > 0.01
    ) {
      await session.abortTransaction();
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Los cálculos de la orden no son correctos',
        expected: {
          subtotal: calculatedSubtotal,
          tax: expectedTax,
          shipping: expectedShipping,
          total: expectedTotal,
        },
        received: {
          subtotal,
          tax,
          shipping,
          total,
        },
      });
    }

    // Crear orden
    const order = new Order({
      userId: req.user!.userId,
      items: orderItems,
      subtotal: calculatedSubtotal,
      tax: expectedTax,
      shipping: expectedShipping,
      total: expectedTotal,
      paymentMethod,
      shippingAddress,
      notes,
    });

    await order.save({ session });

    // Commit de la transacción
    await session.commitTransaction();

    logger.info(`Orden creada: ${order.orderNumber} por usuario ${req.user!.userId}`);

    res.status(201).json({
      message: 'Orden creada exitosamente',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Error al crear orden:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al crear orden',
    });
  } finally {
    session.endSession();
  }
};

/**
 * @route   GET /api/v1/orders
 * @desc    Obtener órdenes del usuario autenticado
 * @access  Private
 */
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const {
      status,
      paymentStatus,
      page = 1,
      limit = 20,
      sortBy = 'recent',
    } = req.query;

    // Construir filtros
    const filters: any = { userId: req.user!.userId };

    if (status && status !== 'all') {
      filters.status = status;
    }

    if (paymentStatus) {
      filters.paymentStatus = paymentStatus;
    }

    // Ordenamiento
    let sort: any = {};
    switch (sortBy) {
      case 'recent':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'total-asc':
        sort = { total: 1 };
        break;
      case 'total-desc':
        sort = { total: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Paginación
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Consulta
    const [orders, totalOrders] = await Promise.all([
      Order.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('items.productId', 'name image slug')
        .lean(),
      Order.countDocuments(filters),
    ]);

    // Metadata
    const totalPages = Math.ceil(totalOrders / limitNum);

    res.status(200).json({
      orders,
      pagination: {
        total: totalOrders,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error: any) {
    logger.error('Error al obtener órdenes:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al obtener órdenes',
    });
  }
};

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Obtener detalle de orden
 * @access  Private
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('items.productId', 'name image slug price');

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Orden no encontrada',
      });
    }

    // Verificar permisos (solo el dueño o admin)
    if (req.user!.role !== 'admin' && order.userId._id.toString() !== req.user!.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No tienes permisos para ver esta orden',
      });
    }

    res.status(200).json({ order });
  } catch (error: any) {
    logger.error('Error al obtener orden:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al obtener orden',
    });
  }
};

/**
 * @route   PATCH /api/v1/orders/:id/cancel
 * @desc    Cancelar orden
 * @access  Private
 */
export const cancelOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        error: 'Not Found',
        message: 'Orden no encontrada',
      });
    }

    // Verificar permisos
    if (req.user!.role !== 'admin' && order.userId.toString() !== req.user!.userId) {
      await session.abortTransaction();
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No tienes permisos para cancelar esta orden',
      });
    }

    // Verificar si puede ser cancelada
    if (!['pending', 'processing'].includes(order.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        error: 'Bad Request',
        message: `No se puede cancelar una orden con estado "${order.status}"`,
      });
    }

    // Restaurar stock de productos
    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);
      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    // Actualizar orden
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = req.body.reason || 'Cancelado por el usuario';

    await order.save({ session });
    await session.commitTransaction();

    logger.info(`Orden cancelada: ${order.orderNumber}`);

    res.status(200).json({
      message: 'Orden cancelada exitosamente',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        cancelledAt: order.cancelledAt,
        cancelReason: order.cancelReason,
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Error al cancelar orden:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al cancelar orden',
    });
  } finally {
    session.endSession();
  }
};

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Actualizar estado de orden (solo admin)
 * @access  Private (Admin)
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array(),
      });
    }

    const { status, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Orden no encontrada',
      });
    }

    // Validar transición de estado
    const validTransitions: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `No se puede cambiar de "${order.status}" a "${status}"`,
      });
    }

    // Actualizar orden
    order.status = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    logger.info(`Orden ${order.orderNumber} actualizada a estado: ${status}`);

    res.status(200).json({
      message: 'Estado de orden actualizado',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        deliveredAt: order.deliveredAt,
      },
    });
  } catch (error: any) {
    logger.error('Error al actualizar estado:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al actualizar estado de orden',
    });
  }
};

/**
 * @route   GET /api/v1/orders/stats
 * @desc    Obtener estadísticas de órdenes (admin)
 * @access  Private (Admin)
 */
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const [totalOrders, statusCounts, revenueStats] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
          },
        },
      ]),
    ]);

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      totalOrders,
      ordersByStatus: {
        pending: statusMap.pending || 0,
        processing: statusMap.processing || 0,
        shipped: statusMap.shipped || 0,
        delivered: statusMap.delivered || 0,
        cancelled: statusMap.cancelled || 0,
      },
      revenue: {
        total: revenueStats[0]?.totalRevenue || 0,
        average: revenueStats[0]?.averageOrderValue || 0,
      },
    });
  } catch (error: any) {
    logger.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error al obtener estadísticas',
    });
  }
};
```

---

## 📍 Paso 4: Rutas de Órdenes

### 4.1 Crear `src/routes/order.routes.ts`

```typescript
import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getOrderStats,
} from '@/controllers/order.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
  createOrderValidation,
  searchOrdersValidation,
  orderIdValidation,
  cancelOrderValidation,
  updateOrderStatusValidation,
} from '@/validators/order.validator';

const router = Router();

// Todas las rutas de órdenes requieren autenticación
router.use(authenticate);

// Rutas de usuario
router.post('/', createOrderValidation, createOrder);
router.get('/', searchOrdersValidation, getUserOrders);
router.get('/:id', orderIdValidation, getOrderById);
router.patch('/:id/cancel', cancelOrderValidation, cancelOrder);

// Rutas de admin
router.patch('/:id/status', authorize('admin'), updateOrderStatusValidation, updateOrderStatus);
router.get('/admin/stats', authorize('admin'), getOrderStats);

export default router;
```

### 4.2 Integrar rutas en `src/app.ts`

```typescript
import orderRoutes from '@/routes/order.routes';

app.use(`${API_PREFIX}/orders`, orderRoutes);
```

---

## ✅ Paso 5: Testing con Postman

### 5.1 Crear Orden

```
POST http://localhost:5000/api/v1/orders
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "items": [
    {
      "productId": "67182a3b4c8f9a001c3e4b5d",
      "quantity": 2
    },
    {
      "productId": "67182a3b4c8f9a001c3e4b5e",
      "quantity": 1
    }
  ],
  "subtotal": 450.00,
  "tax": 72.00,
  "shipping": 50.00,
  "total": 572.00,
  "paymentMethod": "credit-card",
  "shippingAddress": {
    "street": "Calle Principal 123",
    "city": "Ciudad de México",
    "state": "CDMX",
    "zipCode": "01234",
    "country": "México"
  },
  "notes": "Entregar en horario de oficina"
}
```

### 5.2 Listar Órdenes del Usuario

```
GET http://localhost:5000/api/v1/orders
GET http://localhost:5000/api/v1/orders?status=pending
GET http://localhost:5000/api/v1/orders?page=1&limit=10
GET http://localhost:5000/api/v1/orders?sortBy=total-desc

Headers:
  Authorization: Bearer <token>
```

### 5.3 Detalle de Orden

```
GET http://localhost:5000/api/v1/orders/:id

Headers:
  Authorization: Bearer <token>
```

### 5.4 Cancelar Orden

```
PATCH http://localhost:5000/api/v1/orders/:id/cancel
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "reason": "Ya no necesito los productos"
}
```

### 5.5 Actualizar Estado (Admin)

```
PATCH http://localhost:5000/api/v1/orders/:id/status
Headers:
  Authorization: Bearer <admin-token>
  Content-Type: application/json

Body:
{
  "status": "shipped",
  "trackingNumber": "TRACK123456789"
}
```

### 5.6 Estadísticas (Admin)

```
GET http://localhost:5000/api/v1/orders/admin/stats

Headers:
  Authorization: Bearer <admin-token>
```

---

## ✅ Checklist de Verificación

- [ ] Modelo de Order creado con validaciones
- [ ] Generación automática de orderNumber
- [ ] Validadores de órdenes implementados
- [ ] Controlador de órdenes completo
- [ ] Transacciones de MongoDB funcionando
- [ ] Validación de stock en tiempo real
- [ ] Actualización de stock post-orden
- [ ] Restauración de stock al cancelar
- [ ] Cálculos automáticos validados
- [ ] Estados de orden funcionando
- [ ] POST /orders funciona (crear orden)
- [ ] GET /orders funciona (listar órdenes)
- [ ] GET /orders/:id funciona (detalle)
- [ ] PATCH /orders/:id/cancel funciona
- [ ] PATCH /orders/:id/status funciona (admin)
- [ ] GET /orders/admin/stats funciona (admin)
- [ ] Paginación implementada
- [ ] Filtros por estado funcionan
- [ ] Permisos verificados (user/admin)
- [ ] Logs de órdenes funcionando

---

## 🎯 Próximos Pasos

Una vez completada la Fase 4, continúa con **BACKEND_PHASE_5.md** para:
- Integrar el backend con el frontend
- Actualizar servicios de API
- Implementar interceptores
- Manejo de tokens
- Testing de integración completo

---

**Autor**: Nicolas Acuña  
**Fecha**: 26 de Octubre 2025  
**Fase**: 4 de 6  
**Estado**: ✅ Documentación Completa
