# 🔗 FASE 5: Integración Frontend-Backend
## Actualización de Servicios + Interceptores + Token Management

**Duración Estimada**: 2-3 días  
**Complejidad**: Media  
**Prerequisitos**: Fases 1-4 completadas (Backend) + Frontend actual

---

## 📋 Objetivos de la Fase

- ✅ Actualizar servicios de API del frontend
- ✅ Configurar Axios con interceptores
- ✅ Implementar manejo de tokens JWT
- ✅ Refresh token automático
- ✅ Actualizar AuthContext con backend real
- ✅ Actualizar hooks (useProducts, useCart)
- ✅ Manejo de errores centralizado
- ✅ Estados de loading mejorados
- ✅ Variables de entorno de producción
- ✅ Testing de integración completo
- ✅ Migración gradual sin romper funcionalidad

---

## 🔧 Paso 1: Configurar Variables de Entorno

### 1.1 Actualizar `.env` del Frontend

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1

# Configuración para producción (se usará con VITE_MODE=production)
VITE_API_URL_PROD=https://api.yardsale.com/api/v1

# Token configuration
VITE_TOKEN_KEY=yardsale_access_token
VITE_REFRESH_TOKEN_KEY=yardsale_refresh_token
VITE_USER_KEY=yardsale_user

# Environment
VITE_MODE=development
```

### 1.2 Crear `.env.example` actualizado

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1
VITE_API_URL_PROD=https://api.yardsale.com/api/v1

# Token configuration
VITE_TOKEN_KEY=yardsale_access_token
VITE_REFRESH_TOKEN_KEY=yardsale_refresh_token
VITE_USER_KEY=yardsale_user

# Environment
VITE_MODE=development
```

---

## 📦 Paso 2: Configurar Axios con Interceptores

### 2.1 Crear `src/utils/axios.ts`

```typescript
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

// URL base de la API
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Keys de localStorage
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'yardsale_access_token';
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'yardsale_refresh_token';

// Crear instancia de Axios
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para controlar si ya estamos refrescando el token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * Procesar cola de peticiones fallidas después de refresh
 */
const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * REQUEST INTERCEPTOR
 * Agregar token JWT a todas las peticiones
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 * Manejar errores y refresh token automático
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si el error es 401 (Unauthorized) y no es la petición de login
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        // Si falla login o refresh, no reintentar
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Si ya estamos refrescando, agregar a la cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        // No hay refresh token, redirigir a login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Intentar refresh token
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;

        // Guardar nuevo token
        localStorage.setItem(TOKEN_KEY, accessToken);

        // Actualizar header de la petición original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Procesar cola
        processQueue(null);

        // Reintentar petición original
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh, limpiar y redirigir
        processQueue(refreshError as Error);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Manejar otros errores
    handleApiError(error);

    return Promise.reject(error);
  }
);

/**
 * Manejar errores de API con toasts
 */
const handleApiError = (error: AxiosError<any>) => {
  if (error.response) {
    // El servidor respondió con un status fuera del rango 2xx
    const { status, data } = error.response;

    switch (status) {
      case 400:
        toast.error(data?.message || 'Datos inválidos');
        break;
      case 401:
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente');
        break;
      case 403:
        toast.error('No tienes permisos para realizar esta acción');
        break;
      case 404:
        toast.error(data?.message || 'Recurso no encontrado');
        break;
      case 409:
        toast.error(data?.message || 'El recurso ya existe');
        break;
      case 422:
        toast.error('Error de validación');
        break;
      case 429:
        toast.error('Demasiadas peticiones. Intenta de nuevo más tarde');
        break;
      case 500:
        toast.error('Error del servidor. Intenta de nuevo más tarde');
        break;
      default:
        toast.error('Ocurrió un error inesperado');
    }
  } else if (error.request) {
    // La petición se hizo pero no hubo respuesta
    toast.error('No se pudo conectar con el servidor. Verifica tu conexión');
  } else {
    // Algo pasó al configurar la petición
    toast.error('Error al procesar la solicitud');
  }
};

/**
 * Helper para obtener el token actual
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Helper para guardar tokens
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Helper para limpiar tokens
 */
export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export default axiosInstance;
```

---

## 🔐 Paso 3: Actualizar Servicio de Autenticación

### 3.1 Actualizar `src/api/auth.ts`

```typescript
import axios from '@/utils/axios';
import { setTokens, clearTokens } from '@/utils/axios';
import type { User } from '@/types';

const USER_KEY = import.meta.env.VITE_USER_KEY || 'yardsale_user';

interface AuthResponse {
  message: string;
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Login de usuario
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await axios.post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    const { user, accessToken, refreshToken } = response.data;

    // Guardar tokens y usuario
    setTokens(accessToken, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
  }
}

/**
 * Registro de usuario
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await axios.post<AuthResponse>('/auth/register', data);

    const { user, accessToken, refreshToken } = response.data;

    // Guardar tokens y usuario
    setTokens(accessToken, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al registrar usuario');
  }
}

/**
 * Logout de usuario
 */
export async function logout(): Promise<void> {
  try {
    // Limpiar tokens y datos del usuario
    clearTokens();
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    // Limpiar de todas formas
    clearTokens();
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * Obtener usuario actual
 */
export async function getCurrentUser(): Promise<Omit<User, 'password'>> {
  try {
    const response = await axios.get('/auth/me');
    const user = response.data.user;

    // Actualizar usuario en localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener usuario');
  }
}

/**
 * Recuperación de contraseña
 */
export async function recoverPassword(email: string): Promise<{ message: string }> {
  try {
    const response = await axios.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al enviar email de recuperación');
  }
}

/**
 * Resetear contraseña
 */
export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string
): Promise<{ message: string }> {
  try {
    const response = await axios.post('/auth/reset-password', {
      token,
      password,
      confirmPassword,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al resetear contraseña');
  }
}

/**
 * Actualizar perfil
 */
export async function updateProfile(data: {
  name?: string;
  email?: string;
  avatar?: string;
}): Promise<Omit<User, 'password'>> {
  try {
    const response = await axios.patch('/users/profile', data);
    const user = response.data.user;

    // Actualizar usuario en localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al actualizar perfil');
  }
}

/**
 * Cambiar contraseña
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string }> {
  try {
    const response = await axios.post('/users/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al cambiar contraseña');
  }
}

/**
 * Obtener usuario de localStorage
 */
export function getUserFromStorage(): Omit<User, 'password'> | null {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
}
```

---

## 🛍️ Paso 4: Actualizar Servicio de Productos

### 4.1 Actualizar `src/api/products.ts`

```typescript
import axios from '@/utils/axios';
import type { Product, Category } from '@/types';

export interface ProductFilters {
  search?: string;
  category?: Category;
  sortBy?: 'recent' | 'price-asc' | 'price-desc' | 'name' | 'rating';
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: ProductFilters;
}

/**
 * Obtener todos los productos con filtros
 */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
  try {
    const params = new URLSearchParams();

    // Filtros
    if (filters.search) params.append('search', filters.search);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.condition) params.append('condition', filters.condition);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.featured !== undefined) params.append('featured', filters.featured.toString());

    const response = await axios.get<ProductsResponse>('/products', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener productos');
  }
}

/**
 * Obtener producto por ID
 */
export async function getProductById(id: string): Promise<Product> {
  try {
    const response = await axios.get<{ product: Product }>(`/products/${id}`);
    return response.data.product;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener producto');
  }
}

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  try {
    const response = await axios.get<{ products: Product[] }>('/products/featured', {
      params: { limit },
    });
    return response.data.products;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener productos destacados');
  }
}

/**
 * Obtener productos relacionados
 */
export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
  try {
    const response = await axios.get<{ products: Product[] }>(`/products/${productId}/related`, {
      params: { limit },
    });
    return response.data.products;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener productos relacionados');
  }
}

/**
 * Crear producto (admin)
 */
export async function createProduct(formData: FormData): Promise<Product> {
  try {
    const response = await axios.post<{ product: Product }>('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.product;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al crear producto');
  }
}

/**
 * Actualizar producto (admin/owner)
 */
export async function updateProduct(id: string, formData: FormData): Promise<Product> {
  try {
    const response = await axios.put<{ product: Product }>(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.product;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al actualizar producto');
  }
}

/**
 * Eliminar producto (admin/owner)
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await axios.delete(`/products/${id}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al eliminar producto');
  }
}

/**
 * Obtener categorías
 */
export async function getCategories(): Promise<CategoryInfo[]> {
  try {
    const response = await axios.get<{ categories: CategoryInfo[] }>('/categories');
    return response.data.categories;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener categorías');
  }
}

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}
```

---

## 📦 Paso 5: Crear Servicio de Órdenes

### 5.1 Crear `src/api/orders.ts`

```typescript
import axios from '@/utils/axios';
import type { Order, OrderItem, Address, PaymentMethod, CartItem } from '@/types';

export interface CreateOrderData {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  notes?: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Crear nueva orden
 */
export async function createOrder(data: CreateOrderData): Promise<Order> {
  try {
    const response = await axios.post<{ order: Order }>('/orders', data);
    return response.data.order;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al crear orden');
  }
}

/**
 * Obtener órdenes del usuario
 */
export async function getUserOrders(params?: {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}): Promise<OrdersResponse> {
  try {
    const response = await axios.get<OrdersResponse>('/orders', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener órdenes');
  }
}

/**
 * Obtener orden por ID
 */
export async function getOrderById(id: string): Promise<Order> {
  try {
    const response = await axios.get<{ order: Order }>(`/orders/${id}`);
    return response.data.order;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener orden');
  }
}

/**
 * Cancelar orden
 */
export async function cancelOrder(id: string, reason?: string): Promise<void> {
  try {
    await axios.patch(`/orders/${id}/cancel`, { reason });
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al cancelar orden');
  }
}

/**
 * Actualizar estado de orden (admin)
 */
export async function updateOrderStatus(
  id: string,
  status: string,
  trackingNumber?: string
): Promise<void> {
  try {
    await axios.patch(`/orders/${id}/status`, { status, trackingNumber });
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al actualizar orden');
  }
}

/**
 * Obtener estadísticas de órdenes (admin)
 */
export async function getOrderStats(): Promise<any> {
  try {
    const response = await axios.get('/orders/admin/stats');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
  }
}
```

---

## 🔄 Paso 6: Actualizar AuthContext

### 6.1 Actualizar `src/contexts/AuthContext.tsx`

```typescript
import { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authAPI from '@/api/auth';
import type { User } from '@/types';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; avatar?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar sesión al montar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Intentar obtener usuario del storage primero
      const storedUser = authAPI.getUserFromStorage();

      if (storedUser) {
        setUser(storedUser);

        // Verificar con el backend en background
        try {
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Si falla, mantener usuario del storage
          console.warn('No se pudo verificar sesión con el servidor');
        }
      }
    } catch (error) {
      console.error('Error al verificar sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      setUser(response.user);
      toast.success('¡Bienvenido de vuelta!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      const response = await authAPI.register({ name, email, password, confirmPassword });
      setUser(response.user);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      toast.success('Sesión cerrada');
      navigate('/login');
    } catch (error: any) {
      toast.error('Error al cerrar sesión');
      throw error;
    }
  };

  const recoverPassword = async (email: string) => {
    try {
      const response = await authAPI.recoverPassword(email);
      toast.success(response.message);
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const resetPassword = async (
    token: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      const response = await authAPI.resetPassword(token, password, confirmPassword);
      toast.success(response.message);
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateProfile = async (data: { name?: string; email?: string; avatar?: string }) => {
    try {
      const updatedUser = await authAPI.updateProfile(data);
      setUser(updatedUser);
      toast.success('Perfil actualizado');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword, confirmPassword);
      toast.success(response.message);
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    recoverPassword,
    resetPassword,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

---

## 📦 Paso 7: Actualizar Hook useProducts

### 7.1 Modificar `src/hooks/useProducts.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import * as productsApi from '@/api/products';
import { useToast } from './useToast';

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const useProducts = (initialFilters: ProductFilters = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    ...initialFilters,
  });
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const toast = useToast();

  // Fetch products with current filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await productsApi.getProducts(filters);
      setProducts(response.products);
      setPagination(response.pagination);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error loading products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1, // Reset to page 1 if filters change (except explicit page change)
    }));
  }, []);

  // Pagination helpers
  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  }, [pagination.hasNextPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      setFilters((prev) => ({ ...prev, page: Math.max((prev.page || 1) - 1, 1) }));
    }
  }, [pagination.hasPrevPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page }));
    }
  }, [pagination.totalPages]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({ page: 1, limit: 12 });
  }, []);

  // Refetch manually
  const refetch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    nextPage,
    prevPage,
    goToPage,
    clearFilters,
    refetch,
  };
};

// Hook para producto individual
export const useProduct = (productId: string | undefined) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await productsApi.getProductById(productId);
      setProduct(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error loading product';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
};

// Hook para productos relacionados
export const useRelatedProducts = (productId: string | undefined, limit = 4) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const fetchRelated = async () => {
      setLoading(true);
      try {
        const data = await productsApi.getRelatedProducts(productId, limit);
        setProducts(data);
      } catch (err) {
        console.error('Error loading related products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [productId, limit]);

  return { products, loading };
};

// Hook para productos destacados
export const useFeaturedProducts = (limit = 8) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const data = await productsApi.getFeaturedProducts(limit);
        setProducts(data);
      } catch (err) {
        console.error('Error loading featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, [limit]);

  return { products, loading };
};
```

**Verificar**:
```powershell
# Actualizar el componente Home
```

---

## 🛒 Paso 8: Actualizar Hook useCart

### 8.1 Mantener `src/hooks/useCart.ts` con Zustand (Recomendado)

**Estrategia**: Mantener el carrito en localStorage para mejor UX, sincronizar solo en checkout

```typescript
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types';
import { useToast } from './useToast';

export const useCart = () => {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    tax,
    shipping,
    total,
  } = useCartStore();

  const toast = useToast();

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    // Verificar stock disponible
    const currentItem = items.find((item) => item.id === product.id);
    const currentQuantity = currentItem?.quantity || 0;
    const newQuantity = currentQuantity + quantity;

    if (newQuantity > product.stock) {
      toast.error(`Only ${product.stock} units available`);
      return false;
    }

    addItem(product, quantity);
    toast.success(`${product.name} added to cart`);
    return true;
  };

  const handleRemoveFromCart = (productId: string) => {
    removeItem(productId);
    toast.success('Product removed from cart');
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }

    const item = items.find((i) => i.id === productId);
    if (!item) return;

    if (quantity > item.stock) {
      toast.error(`Only ${item.stock} units available`);
      return;
    }

    updateQuantity(productId, quantity);
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  return {
    items,
    addToCart: handleAddToCart,
    removeFromCart: handleRemoveFromCart,
    updateQuantity: handleUpdateQuantity,
    clearCart: handleClearCart,
    totalItems,
    subtotal,
    tax,
    shipping,
    total,
  };
};
```

**Nota**: El carrito se mantiene en localStorage. Solo cuando el usuario haga checkout, se enviará la orden al backend y se validará el stock en tiempo real.

---

## 🧪 Paso 9: Testing de la Integración

### 9.1 Verificar endpoints del backend

```powershell
# Iniciar el backend
cd yard-sale-backend
npm run dev
```

### 9.2 Verificar conexión desde el frontend

```powershell
# En otra terminal, iniciar el frontend
cd ..
npm run dev
```

### 9.3 Tests manuales

**Test 1: Registro de usuario**
1. Abrir http://localhost:5173/register
2. Llenar formulario con datos válidos
3. Verificar:
   - ✅ Usuario creado en MongoDB
   - ✅ Tokens guardados en localStorage
   - ✅ Redirección a Home
   - ✅ Toast de éxito

**Test 2: Login**
1. Abrir http://localhost:5173/login
2. Ingresar credenciales
3. Verificar:
   - ✅ Tokens actualizados
   - ✅ Usuario en AuthContext
   - ✅ Redirección correcta

**Test 3: Productos**
1. Abrir Home
2. Verificar:
   - ✅ Productos cargados desde backend
   - ✅ Paginación funcionando
   - ✅ Filtros aplicados correctamente
   - ✅ Búsqueda en tiempo real

**Test 4: Crear Orden**
1. Agregar productos al carrito
2. Ir a Checkout
3. Completar formulario
4. Verificar:
   - ✅ Orden creada en MongoDB
   - ✅ Stock actualizado
   - ✅ Redirección a OrderSuccess
   - ✅ Carrito limpio

**Test 5: Token Refresh**
1. Login
2. Esperar 1 día (o cambiar JWT_EXPIRES_IN a 1m para testing)
3. Hacer cualquier acción que requiera auth
4. Verificar:
   - ✅ Token renovado automáticamente
   - ✅ Sin logout inesperado
   - ✅ Request completado exitosamente

---

## 📋 Paso 10: Checklist de Migración Completa

### Pre-Deploy

#### Backend
- [ ] MongoDB Atlas configurado (crear cluster gratuito)
- [ ] Cloudinary configurado (cuenta gratuita)
- [ ] Variables de entorno configuradas (.env)
- [ ] Seeders ejecutados (migrar db.json a MongoDB)
- [ ] Endpoints testeados con Postman/Thunder Client
- [ ] Logs funcionando correctamente
- [ ] Health check endpoint respondiendo

#### Frontend
- [ ] VITE_API_URL actualizado (apuntar al backend real)
- [ ] Axios interceptors configurados
- [ ] Servicios actualizados (auth, products, orders)
- [ ] AuthContext integrado
- [ ] Hooks actualizados (useProducts, useCart)
- [ ] Manejo de errores implementado
- [ ] Loading states en todos los componentes
- [ ] Toast notifications funcionando

### Testing
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Token refresh funciona
- [ ] Productos se cargan correctamente
- [ ] Paginación funciona
- [ ] Filtros funcionan
- [ ] Búsqueda funciona
- [ ] Crear orden funciona
- [ ] Ver mis órdenes funciona
- [ ] Cancelar orden funciona
- [ ] Protección de rutas funciona
- [ ] Redirecciones correctas

### Deploy
- [ ] Backend deployado (Railway/Render)
- [ ] Frontend deployado (Vercel/Netlify)
- [ ] MongoDB Atlas en producción
- [ ] Variables de entorno de producción configuradas
- [ ] CORS configurado correctamente
- [ ] SSL activo (https)
- [ ] API funcionando en producción
- [ ] Frontend conectado al backend de producción

### Post-Deploy
- [ ] Crear usuarios de prueba en producción
- [ ] Verificar flujos completos en producción
- [ ] Monitorear logs de errores
- [ ] Configurar alertas (opcional)
- [ ] Documentar API (Postman Collection)
- [ ] README actualizado con instrucciones

---

## 🎯 Próximos Pasos

1. **Inmediato**: 
   - Iniciar backend y frontend localmente
   - Hacer tests manuales de todos los flujos
   - Verificar que la integración funcione correctamente

2. **Corto Plazo**:
   - Configurar MongoDB Atlas
   - Configurar Cloudinary
   - Ejecutar seeders
   - Deploy a Railway (backend)
   - Deploy a Vercel (frontend)

3. **Mediano Plazo**:
   - Implementar tests automatizados (Fase 6)
   - Configurar CI/CD (Fase 6)
   - Mejorar monitoreo y logging
   - Optimizar performance

---

## ✅ Checklist Final de la Fase 5

- [x] Variables de entorno configuradas
- [x] Axios instance con interceptors
- [x] Servicio de auth actualizado
- [x] Servicio de products actualizado
- [x] Servicio de orders creado
- [x] AuthContext actualizado
- [x] useProducts hook actualizado con paginación
- [x] useCart mantenido con Zustand (mejor UX)
- [x] Guía de testing manual
- [x] Checklist de migración completo

---

## 🎉 Fase 5 Completa

El frontend ahora está completamente integrado con el backend real. Puedes:
- ✅ Autenticarte con JWT
- ✅ Navegar productos con paginación
- ✅ Filtrar y buscar productos
- ✅ Crear órdenes con validación de stock
- ✅ Ver historial de órdenes
- ✅ Tokens renovados automáticamente
- ✅ Manejo profesional de errores

**Siguiente Fase**: [BACKEND_PHASE_6.md](./BACKEND_PHASE_6.md) - Testing y Deployment

---

**Autor**: Nicolas Acuña  
**Fecha**: 26 de Octubre 2025  
**Fase**: 5 de 6 (Parte 1)  
**Estado**: ✅ Documentación en Progreso
