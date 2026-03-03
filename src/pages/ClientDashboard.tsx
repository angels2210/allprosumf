import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../context/ClientContext';
import { LogOut, User, MapPin, Phone, Mail, Package, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, FileText, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function ClientDashboard() {
  const { client, logout } = useClient();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    if (client) {
      api.get(`/clients/${client.id}/orders`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setOrders(res.data);
          }
        })
        .catch(err => console.error('Error fetching orders:', err))
        .finally(() => setLoadingOrders(false));
    }
  }, [client]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleOrder = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return 'Pendiente';
    }
  };

  if (!client) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Cuenta</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-fit"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-full text-[#0F158F]">
                {client.type === 'juridica' ? <Briefcase className="h-8 w-8" /> : <User className="h-8 w-8" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{client.type || 'Cliente'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <FileText className="h-5 w-5 text-gray-400" />
                <span>{client.identification || 'No registrado'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-5 w-5 text-gray-400" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="h-5 w-5 text-gray-400" />
                <span>{client.phone || 'No registrado'}</span>
              </div>
              <div className="flex items-start gap-3 text-gray-600">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <span>{client.address || 'No registrada'}</span>
              </div>
            </div>
          </motion.div>

          {/* Recent Orders */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-full text-[#0F158F]">
                <Package className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Mis Pedidos</h2>
            </div>

            {loadingOrders ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F158F] mx-auto"></div>
                <p className="text-gray-500 mt-4">Cargando pedidos...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Aún no has realizado pedidos</p>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-4 text-[#0F158F] font-bold hover:underline"
                >
                  Ir a comprar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleOrder(order.id)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900">#{order.id}</span>
                        <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                        <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {getStatusText(order.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
                        {expandedOrder === order.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedOrder === order.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 border-t border-gray-200 bg-white">
                            <h4 className="text-sm font-medium text-gray-500 mb-3">Detalles del pedido</h4>
                            <ul className="space-y-3">
                              {order.items && order.items.map((item) => (
                                <li key={item.id} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 w-8 h-8 rounded flex items-center justify-center text-xs font-medium text-gray-500">
                                      {item.quantity}x
                                    </div>
                                    <span className="text-gray-900">{item.product_name}</span>
                                  </div>
                                  <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                              <span className="font-medium text-gray-900">Total</span>
                              <span className="text-lg font-bold text-[#0F158F]">${order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
