/// <reference types="vite/client" />
// src/services/api.ts
import axios from 'axios';

// Usamos la variable de entorno, o un valor por defecto si no existe
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si el token expiró o es inválido, limpiamos y redirigimos
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Cliente API centralizado para mantener compatibilidad con el código existente
 */
export const apiRequest = async (endpoint: string, method = 'GET', data: any = null) => {
  try {
    const response = await api({
      url: endpoint,
      method,
      data,
    });
    return response.data;
  } catch (error: any) {
    // Mantener el mismo formato de error que teníamos con fetch
    const message = error.response?.data?.message || error.message || 'Error en la petición';
    throw new Error(message);
  }
};

/**
 * Servicios de la API centralizados.
 * Úsalos en tus componentes en lugar de hacer fetch() directamente.
 */
export const apiService = {
  // --- 1. Autenticación y Admin ---
  loginAdmin: (data: any) => apiRequest('/login', 'POST', data), // Ojo: Si tu backend usa /auth/login, cámbialo aquí
  getUsers: () => apiRequest('/admin/users'),
  createUser: (data: any) => apiRequest('/admin/users', 'POST', data),
  updateUser: (id: string | number, data: any) => apiRequest(`/admin/users/${id}`, 'PUT', data),
  deleteUser: (id: string | number) => apiRequest(`/admin/users/${id}`, 'DELETE'),

  // --- 2. Productos y Categorías ---
  getProducts: () => apiRequest('/products'), // Si tu backend usa /inventory/products, cámbialo aquí
  createProduct: (data: any) => apiRequest('/products', 'POST', data),
  updateProduct: (id: string | number, data: any) => apiRequest(`/products/${id}`, 'PUT', data),
  deleteProduct: (id: string | number) => apiRequest(`/products/${id}`, 'DELETE'),
  
  getCategories: () => apiRequest('/categories'),
  createCategory: (data: any) => apiRequest('/categories', 'POST', data),
  updateCategory: (id: string | number, data: any) => apiRequest(`/categories/${id}`, 'PUT', data),
  deleteCategory: (id: string | number) => apiRequest(`/categories/${id}`, 'DELETE'),

  // --- 3. Clientes ---
  loginClient: (data: any) => apiRequest('/clients/login', 'POST', data),
  registerClient: (data: any) => apiRequest('/sales/clients', 'POST', data),
  getClients: () => apiRequest('/sales/clients'),
  getClientOrders: (id: string | number) => apiRequest(`/clients/${id}/orders`),

  // --- 4. Pedidos (Orders) ---
  getOrders: () => apiRequest('/orders'),
  getOrderById: (id: string | number) => apiRequest(`/orders/${id}`),
  createOrder: (data: any) => apiRequest('/orders', 'POST', data),
  updateOrderStatus: (id: string | number, status: string) => apiRequest(`/orders/${id}/status`, 'PUT', { status }),
  updateOrderPayment: (id: string | number, data: any) => apiRequest(`/orders/${id}/payment-reference`, 'PUT', data),

  // --- 5. Configuraciones (Settings) ---
  getBcvRate: () => apiRequest('/bcv-rate'),
  updateBcvRate: (rate: string) => apiRequest('/bcv-rate', 'PUT', { rate }),
  getLogo: () => apiRequest('/settings/logo'),
  updateLogo: (url: string) => apiRequest('/settings/logo', 'PUT', { url }),
};
