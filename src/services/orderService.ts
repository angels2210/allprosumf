import { api } from './api';

export interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
}

export interface OrderData {
  customer_name: string;
  customer_phone: string;
  customer_id_number: string;
  business_name?: string;
  address?: string;
  manager_name?: string;
  seller_name_code?: string;
  total: number;
  payment_method: string;
  payment_reference?: string;
  items: OrderItem[];
}

export const orderService = {
  createOrder: async (orderData: OrderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  getOrderById: async (id: number | string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  updateStatus: async (id: number | string, status: string) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },
  updatePaymentReference: async (id: number | string, reference: string) => {
    const response = await api.put(`/orders/${id}/payment-reference`, { payment_reference: reference });
    return response.data;
  }
};
