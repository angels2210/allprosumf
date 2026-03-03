import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { Package, ShoppingBag, LogOut, Plus, Image as ImageIcon, CheckCircle, XCircle, Clock, BarChart3, Search, Eye, Settings, UploadCloud, Edit, Trash2, Tag, Users, DollarSign, UserPlus, ShoppingCart, MessageSquare, Printer, ShieldCheck, History, UserCog, Lock, FilePenLine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SupportChatAdmin from '../components/SupportChatAdmin';
import NotaEntrega from '../components/NotaEntrega';
import toast from 'react-hot-toast';
import { api, apiService } from '../services/api';
import { orderService } from '../services/orderService';

interface Category {
  id: number;
  name: string;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_id_number: string;
  business_name?: string;
  address?: string;
  manager_name?: string;
  seller_name_code?: string;
  seller_name?: string;
  seller_code?: string;
  total: number;
  payment_method: string;
  payment_reference: string;
  payment_receipt?: string;
  status: string;
  created_at: string;
  items: {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
  }[];
}

interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface AdminUser {
  id: number;
  username: string;
  role: string;
  seller_code?: string;
  first_name?: string;
  last_name?: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'reports' | 'categories' | 'settings' | 'clients' | 'vendedores' | 'chat' | 'cargar_pedidos' | 'audit'>('orders');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [sellerPerformance, setSellerPerformance] = useState<any[]>([]);
  const [loggedInSellerPerformance, setLoggedInSellerPerformance] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [editingRolePermissions, setEditingRolePermissions] = useState<{role: string, permissions: string[]} | null>(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return orders.filter(order =>
      order.customer_name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [orders, searchTerm]);
  
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showNotaEntrega, setShowNotaEntrega] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentReferenceModal, setShowPaymentReferenceModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  
  // User Form State
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'vendedor',
    seller_code: '',
    first_name: '',
    last_name: ''
  });
  
  // Seller Order Form State
  const [sellerOrder, setSellerOrder] = useState({
    customer_name: '',
    customer_phone: '',
    customer_id_number: '',
    customer_id_type: 'V',
    business_name: '',
    address: '',
    manager_name: '',
    seller_name_code: '',
    payment_method: 'contado',
    payment_reference: '',
    credit_days: 0,
    apply_discount: false,
    items: [] as { product_id: number, quantity: number, name: string, price: number }[]
  });
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const { logoUrl, banner, contactInfo, updateLogoUrl, updateBanner, updateContactInfo } = useSettings();
  const [newLogoUrl, setNewLogoUrl] = useState(logoUrl);
  const [newBanner, setNewBanner] = useState({
    title: banner.title,
    subtitle: banner.subtitle,
    imageUrl: banner.imageUrl
  });
  const [newContactInfo, setNewContactInfo] = useState({
    phone: contactInfo.phone,
    footerText: contactInfo.footerText
  });
  const [bcvRate, setBcvRate] = useState<string>('36.25');
  const [updatingBcv, setUpdatingBcv] = useState(false);
  const [updatingBanner, setUpdatingBanner] = useState(false);
  const [updatingContact, setUpdatingContact] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'product' | 'category' | null;
    id: number | null;
    name?: string;
  }>({ isOpen: false, type: null, id: null });

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    category: '',
    commission_rate: 0.05
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    
    if (!token || !userStr) {
      navigate('/admin');
      return;
    }
    
    const user = JSON.parse(userStr);
    setAdminUser(user);
    
    if (user.seller_code) {
      setSellerOrder(prev => ({ ...prev, seller_name_code: user.seller_code }));
    }
    
    if (user.role === 'vendedor') {
      setActiveTab('cargar_pedidos');
    }
    
    fetchData();
    fetchBcvRate();
    if (user.role === 'vendedor') {
      fetchCommissions(user.id);
      fetchLoggedInSellerPerformance(user.id);
    } else if (user.role === 'administrador') {
      fetchSellerPerformance();
      fetchAuditLogs();
      fetchAdminUsers();
      fetchPermissions();
      fetchRoles();
    }
  }, [navigate]);

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/admin/permissions');
      setAllPermissions(res.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/admin/roles');
      setAvailableRoles(res.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleUpdateRolePermissions = async (role: string, permissions: string[]) => {
    try {
      await api.post('/admin/permissions', {
        role,
        permissions,
        adminId: adminUser?.id,
        adminUsername: adminUser?.username
      });
      toast.success('Permisos actualizados');
      fetchPermissions();
      fetchAuditLogs();
      setEditingRolePermissions(null);
    } catch (error) {
      toast.error('Error al actualizar permisos');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      setAuditLogs(res.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setAdminUsers(res.data);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', {
        ...newUser,
        adminId: adminUser?.id,
        adminUsername: adminUser?.username
      });
      toast.success('Usuario creado correctamente');
      setShowAddUser(false);
      setNewUser({ username: '', password: '', role: 'vendedor', seller_code: '', first_name: '', last_name: '' });
      fetchAdminUsers();
      fetchAuditLogs();
    } catch (error) {
      toast.error('Error al crear usuario');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        username: editingUser.username,
        role: editingUser.role,
        password: (editingUser as any).newPassword || '',
        seller_code: editingUser.seller_code || '',
        first_name: editingUser.first_name || '',
        last_name: editingUser.last_name || '',
        adminId: adminUser?.id,
        adminUsername: adminUser?.username
      });
      toast.success('Usuario actualizado');
      setEditingUser(null);
      fetchAdminUsers();
      fetchAuditLogs();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await api.delete(`/admin/users/${id}`, {
        params: {
          adminId: adminUser?.id,
          adminUsername: adminUser?.username
        }
      });
      toast.success('Usuario eliminado');
      fetchAdminUsers();
      fetchAuditLogs();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const fetchSellerPerformance = async () => {
    try {
      const res = await api.get('/admin/sellers/performance');
      if (res.data && res.data.length > 0) {
        setSellerPerformance(res.data);
      } else {
        const usersRes = await api.get('/admin/users');
        const sellers = usersRes.data
          .filter((u: any) => u.role === 'vendedor')
          .map((u: any) => ({
            id: u.id,
            username: u.username,
            seller_code: u.seller_code,
            total_orders: 0,
            total_sales: 0,
            total_commissions: 0,
            top_products: [],
            recent_orders: []
          }));
        setSellerPerformance(sellers);
      }
    } catch (error) {
      console.error('Error fetching seller performance:', error);
    }
  };

  const fetchLoggedInSellerPerformance = async (sellerId: number) => {
    try {
      const res = await api.get(`/admin/sellers/${sellerId}/performance`);
      setLoggedInSellerPerformance(res.data);
    } catch (error) {
      console.error('Error fetching logged-in seller performance:', error);
    }
  };

  const fetchClientDetails = useCallback(debounce(async (idType: string, idNumber: string) => {
    if (!idType || !idNumber) {
      return;
    }
    try {
      const res = await api.get('/clients/check', {
        params: { id_type: idType, id_number: idNumber }
      });
      const client = res.data;
      if (client) {
        setSellerOrder(prev => ({
          ...prev,
          customer_name: client.customer_name || '',
          customer_phone: client.customer_phone || '',
          business_name: client.business_name || '',
          address: client.address || '',
          manager_name: client.manager_name || '',
        }));
        toast.success('Información del cliente cargada automáticamente');
      } else {
        setSellerOrder(prev => ({
          ...prev,
          customer_name: '',
          customer_phone: '',
          business_name: '',
          address: '',
          manager_name: '',
        }));
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast.error('Error al buscar cliente');
    }
  }, 500), []);

  const fetchCommissions = async (sellerId: number) => {
    try {
      const res = await api.get(`/commissions/${sellerId}`);
      setCommissions(res.data);
    } catch (error) {
      console.error('Error fetching commissions:', error);
    }
  };

  useEffect(() => {
    setNewLogoUrl(logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    setNewBanner({
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl
    });
  }, [banner]);

  useEffect(() => {
    setNewContactInfo({
      phone: contactInfo.phone,
      footerText: contactInfo.footerText
    });
  }, [contactInfo]);

  const fetchBcvRate = async () => {
    try {
      const res = await api.get('/bcv-rate');
      if (res.data.rate) setBcvRate(res.data.rate.toString());
    } catch (error) {
      console.error('Error fetching BCV rate:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, categoriesRes, clientsRes] = await Promise.all([
        api.get('/products'),
        api.get('/orders'),
        api.get('/categories'),
        api.get('/clients')
      ]);
      
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setCategories(categoriesRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/');
  };

  const handleUpdateBcv = async () => {
    setUpdatingBcv(true);
    try {
      await api.put('/bcv-rate', { rate: parseFloat(bcvRate) });
      toast.success('Tasa BCV actualizada correctamente');
    } catch (error) {
      console.error('Error updating BCV rate:', error);
      toast.error('Error al actualizar la tasa');
    } finally {
      setUpdatingBcv(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBanner({ ...newBanner, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateBanner = async () => {
    setUpdatingBanner(true);
    try {
      await updateBanner(newBanner);
      toast.success('Banner actualizado correctamente');
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Error al actualizar el banner');
    } finally {
      setUpdatingBanner(false);
    }
  };

  const handleUpdateContact = async () => {
    setUpdatingContact(true);
    try {
      await updateContactInfo(newContactInfo);
      toast.success('Información de contacto actualizada correctamente');
    } catch (error) {
      console.error('Error updating contact info:', error);
      toast.error('Error al actualizar la información de contacto');
    } finally {
      setUpdatingContact(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await api.put(`/products/${editingProduct.id}`, {
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        stock: editingProduct.stock,
        category: editingProduct.category,
        image_url: editingProduct.image_url,
        commission_rate: editingProduct.commission_rate
      });
      
      toast.success('Producto actualizado correctamente');
      setEditingProduct(null);
      fetchData();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar el producto');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'product',
      id: product.id,
      name: product.name
    });
  };

  const handleDeleteCategory = (category: Category) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'category',
      id: category.id,
      name: category.name
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.id || !deleteConfirmation.type) return;

    try {
      if (deleteConfirmation.type === 'product') {
        await api.delete(`/products/${deleteConfirmation.id}`);
        toast.success('Producto eliminado');
        fetchData();
      } else if (deleteConfirmation.type === 'category') {
        await api.delete(`/categories/${deleteConfirmation.id}`);
        toast.success('Categoría eliminada');
        fetchData();
      }
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Error al eliminar el elemento');
    } finally {
      setDeleteConfirmation({ isOpen: false, type: null, id: null });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await api.post('/categories', { name: newCategoryName });
      toast.success('Categoría agregada');
      setNewCategoryName('');
      fetchData();
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error(error.message || 'Error al agregar la categoría');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      await api.put(`/categories/${editingCategory.id}`, { name: editingCategory.name });
      setEditingCategory(null);
      fetchData();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
        image_url: newProduct.image_url || 'https://picsum.photos/seed/placeholder/400/400',
        commission_rate: newProduct.commission_rate
      });
      
      toast.success('Producto agregado correctamente');
      setShowAddProduct(false);
      setNewProduct({ name: '', description: '', price: '', stock: '', image_url: '', category: '', commission_rate: 0.05 });
      fetchData();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error al agregar el producto');
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      fetchData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleUpdatePaymentReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await api.put(`/orders/${selectedOrder.id}/payment-reference`, {
        payment_reference: paymentReference,
        adminId: adminUser?.id,
        adminUsername: adminUser?.username
      });

      toast.success('Referencia de pago actualizada');
      setShowPaymentReferenceModal(false);
      setPaymentReference('');
      fetchData();
      fetchAuditLogs();
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const addOrUpdateClient = async (clientData: any) => {
    try {
      // Check if client exists
      const checkRes = await api.get('/clients/check', {
        params: {
          id_number: clientData.customer_id_number,
          id_type: clientData.customer_id_type
        }
      });
      
      const existingClient = checkRes.data;
      if (existingClient) {
        return existingClient.id;
      }

      // If client doesn't exist, create a new one
      const createRes = await api.post('/clients', clientData);
      toast.success('Cliente agregado/actualizado correctamente');
      return createRes.data.id;
    } catch (error) {
      toast.error('Error de conexión al gestionar cliente');
      return null;
    }
  };

  const handleSellerOrderSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (sellerOrder.items.length === 0) {
      toast.error('Debe agregar al menos un producto al pedido');
      return;
    }

    // Prepare client data for creation/update
    const clientData = {
      customer_name: sellerOrder.customer_name,
      customer_phone: sellerOrder.customer_phone,
      customer_id_number: sellerOrder.customer_id_type + sellerOrder.customer_id_number,
      customer_id_type: sellerOrder.customer_id_type,
      business_name: sellerOrder.business_name,
      address: sellerOrder.address,
    };

    const clientId = await addOrUpdateClient(clientData);
    if (!clientId) {
      // If client creation/update failed, stop order submission
      return;
    }

    try {
      const response = await api.post('/orders', {
        customer_name: sellerOrder.customer_name,
        customer_phone: sellerOrder.customer_phone,
        customer_id_number: sellerOrder.customer_id_type + sellerOrder.customer_id_number,
        business_name: sellerOrder.business_name,
        address: sellerOrder.address,
        manager_name: sellerOrder.manager_name,
        seller_name_code: sellerOrder.seller_name_code,
        payment_method: sellerOrder.payment_method,
        payment_reference: sellerOrder.payment_reference,
        credit_days: sellerOrder.credit_days,
        total: sellerOrder.apply_discount 
          ? sellerOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 0.95
          : sellerOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
        seller_id: adminUser?.id,
        client_id: clientId,
        items: sellerOrder.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
      });

      toast.success('Pedido cargado correctamente');
      setShowNotaEntrega(false);
      setIsPreviewMode(false);

      setSellerOrder({
        customer_name: '',
        customer_phone: '',
        customer_id_number: '',
        customer_id_type: 'V',
        business_name: '',
        address: '',
        manager_name: '',
        seller_name_code: adminUser?.seller_code || '',
        payment_method: 'contado',
        payment_reference: '',
        credit_days: 0,
        apply_discount: false,
        items: []
      });
      if (adminUser) fetchCommissions(adminUser.id);
      fetchData();

      // Automatically show delivery note
      try {
        const orderRes = await api.get(`/orders/${response.data.orderId}`);
        setSelectedOrder(orderRes.data);
        setShowNotaEntrega(true);
      } catch (err) {
        console.error('Error fetching new order for delivery note:', err);
      }
    } catch (error) {
      console.error('Error creating seller order:', error);
      toast.error('Error al cargar el pedido');
    }
  };

  const handlePreviewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (sellerOrder.items.length === 0) {
      toast.error('Debe agregar al menos un producto al pedido');
      return;
    }

    // Create a temporary order object for the preview
    const tempOrder = {
      id: 0, // No ID yet
      customer_name: sellerOrder.customer_name,
      customer_phone: sellerOrder.customer_phone,
      customer_id_number: sellerOrder.customer_id_type + sellerOrder.customer_id_number,
      business_name: sellerOrder.business_name,
      address: sellerOrder.address,
      seller_name_code: sellerOrder.seller_name_code,
      seller_name: adminUser?.first_name ? `${adminUser.first_name} ${adminUser.last_name || ''}`.trim() : adminUser?.username,
      seller_code: adminUser?.seller_code,
      payment_method: sellerOrder.payment_method,
      total: sellerOrder.apply_discount 
        ? sellerOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 0.95
        : sellerOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
      items: sellerOrder.items.map((item, index) => ({
        id: index,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      created_at: new Date().toISOString()
    };

    setSelectedOrder(tempOrder as any);
    setIsPreviewMode(true);
    setShowNotaEntrega(true);
  };

  const addProductToSellerOrder = (product: Product, quantity: number = 1) => {
    const existing = sellerOrder.items.find(i => i.product_id === product.id);
    if (existing) {
      setSellerOrder({
        ...sellerOrder,
        items: sellerOrder.items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
      });
    } else {
      setSellerOrder({
        ...sellerOrder,
        items: [...sellerOrder.items, { product_id: product.id, quantity: quantity, name: product.name, price: product.price }]
      });
    }
  };

  const removeProductFromSellerOrder = (productId: number) => {
    setSellerOrder({
      ...sellerOrder,
      items: sellerOrder.items.filter(i => i.product_id !== productId)
    });
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const canAccess = (tab: string) => {
    if (!adminUser) return false;
    // Allow 'administrador', 'admin', or undefined (backward compatibility) to access everything
    if (adminUser.role === 'administrador' || adminUser.role === 'admin' || !adminUser.role) return true;
    
    // Dynamic permissions check
    if ((adminUser as any).permissions) {
      return (adminUser as any).permissions.includes(tab);
    }

    if (adminUser.role === 'soporte') {
      return ['orders', 'products', 'categories', 'clients', 'chat', 'settings'].includes(tab);
    }
    if (adminUser.role === 'vendedor') {
      return ['vendedores', 'cargar_pedidos'].includes(tab);
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F158F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#0F158F] text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain bg-white rounded-lg p-1" />
          ) : (
            <div className="bg-white text-[#0F158F] p-1 rounded-lg font-black text-xs">AP</div>
          )}
          <div>
            <h2 className="text-lg font-bold tracking-tight leading-none">Panel Admin</h2>
            <p className="text-blue-300 text-[10px] uppercase font-bold mt-1">ALLPROSUM 33</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 bg-blue-800/50 rounded-lg text-blue-100"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex md:w-64 bg-[#0F158F] text-white flex-col shadow-xl z-10 sticky top-0 h-screen">
        <div className="p-6 border-b border-blue-800 flex flex-col items-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 mb-4 object-contain bg-white rounded-xl p-2 shadow-inner" />
          ) : (
            <div className="bg-white text-[#0F158F] p-3 rounded-xl font-black text-2xl mb-4 shadow-inner">AP</div>
          )}
          <h2 className="text-xl font-bold tracking-tight">Panel Admin</h2>
          <p className="text-blue-300 text-sm">ALLPROSUM 33 C.A</p>
        </div>
        
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto hide-scrollbar">
          {canAccess('orders') && (
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-[#D8121B] text-white font-medium shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5" />
                Pedidos
              </div>
              {pendingOrdersCount > 0 && (
                <span className="bg-white text-[#D8121B] text-xs font-bold px-2 py-1 rounded-full">{pendingOrdersCount}</span>
              )}
            </button>
          )}
          {canAccess('products') && (
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-[#D8121B] text-white font-medium shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}
            >
              <Package className="h-5 w-5" />
              Productos
            </button>
          )}
          {canAccess('categories') && (
            <button 
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'categories' ? 'bg-[#D8121B] text-white font-medium shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}
            >
              <Tag className="h-5 w-5" />
              Categorías
            </button>
          )}
          {canAccess('clients') && (
            <button 
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'clients' ? 'bg-[#D8121B] text-white font-medium shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}
            >
              <Users className="h-5 w-5" />
              Clientes
            </button>
          )}

          {canAccess('chat') && (
            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'chat' ? 'bg-[#D8121B] text-white font-medium shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}
            >
              <MessageSquare className="h-5 w-5" />
              Chat de Soporte
            </button>
          )}

          {canAccess('cargar_pedidos') && (
            <button 
              onClick={() => setActiveTab('cargar_pedidos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'cargar_pedidos' ? 'bg-[#D8121B] text-white font-medium shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}
            >
              <ShoppingCart className="h-5 w-5" />
              Cargar Pedidos
            </button>
          )}

          {canAccess('vendedores') && (
            <button 
              onClick={() => setActiveTab('vendedores')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'vendedores' ? 'bg-[#D8121B] text-white font-medium shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}
            >
              <DollarSign className="h-5 w-5" />
              {adminUser?.role === 'administrador' ? 'Gestión de Vendedores' : 'Mis Comisiones'}
            </button>
          )}

          {canAccess('reports') && (
            <button 
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'reports' ? 'bg-[#D8121B] text-white font-medium shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}
            >
              <BarChart3 className="h-5 w-5" />
              Reportes
            </button>
          )}
          {canAccess('audit') && (
            <button 
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'audit' ? 'bg-[#D8121B] text-white font-medium shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}
            >
              <History className="h-5 w-5" />
              Auditoría
            </button>
          )}
          {canAccess('settings') && (
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-[#D8121B] text-white font-medium shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}
            >
              <Settings className="h-5 w-5" />
              Configuración
            </button>
          )}
        </nav>
        
        <div className="p-4 border-t border-blue-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-blue-100 hover:bg-blue-800 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Bottom Nav (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex overflow-x-auto items-center py-2 px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-t-2xl hide-scrollbar">
        {canAccess('orders') && (
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all ${activeTab === 'orders' ? 'text-[#D8121B] scale-110' : 'text-gray-400'}`}
          >
            <div className="relative">
              <ShoppingBag className="h-6 w-6" />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D8121B] text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">Pedidos</span>
          </button>
        )}
        {canAccess('products') && (
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all ${activeTab === 'products' ? 'text-[#D8121B] scale-110' : 'text-gray-400'}`}
          >
            <Package className="h-6 w-6" />
            <span className="text-[10px] font-bold">Productos</span>
          </button>
        )}
        {canAccess('categories') && (
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all ${activeTab === 'categories' ? 'text-[#D8121B] scale-110' : 'text-gray-400'}`}
          >
            <Tag className="h-6 w-6" />
            <span className="text-[10px] font-bold">Categorías</span>
          </button>
        )}
        {canAccess('clients') && (
          <button 
            onClick={() => setActiveTab('clients')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all ${activeTab === 'clients' ? 'text-[#D8121B] scale-110' : 'text-gray-400'}`}
          >
            <Users className="h-6 w-6" />
            <span className="text-[10px] font-bold">Clientes</span>
          </button>
        )}
        {canAccess('chat') && (
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all ${activeTab === 'chat' ? 'text-[#D8121B] scale-110' : 'text-gray-400'}`}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-[10px] font-bold">Chat</span>
          </button>
        )}
        {canAccess('cargar_pedidos') && (
          <button 
            onClick={() => setActiveTab('cargar_pedidos')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all ${activeTab === 'cargar_pedidos' ? 'text-[#D8121B] scale-110' : 'text-gray-400'}`}
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="text-[10px] font-bold">Cargar</span>
          </button>
        )}
        {canAccess('vendedores') && (
          <button 
            onClick={() => setActiveTab('vendedores')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all ${activeTab === 'vendedores' ? 'text-[#D8121B] scale-110' : 'text-gray-400'}`}
          >
            <DollarSign className="h-6 w-6" />
            <span className="text-[10px] font-bold text-center leading-tight">{adminUser?.role === 'administrador' ? 'Gestión de\nVendedores' : 'Comisiones'}</span>
          </button>
        )}
        {canAccess('reports') && (
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all ${activeTab === 'reports' ? 'text-[#D8121B] scale-110' : 'text-gray-400'}`}
          >
            <BarChart3 className="h-6 w-6" />
            <span className="text-[10px] font-bold">Reportes</span>
          </button>
        )}
        {canAccess('audit') && (
          <button 
            onClick={() => setActiveTab('audit')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all ${activeTab === 'audit' ? 'text-[#D8121B] scale-110' : 'text-gray-400'}`}
          >
            <History className="h-6 w-6" />
            <span className="text-[10px] font-bold">Auditoría</span>
          </button>
        )}
        {canAccess('settings') && (
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all ${activeTab === 'settings' ? 'text-[#D8121B] scale-110' : 'text-gray-400'}`}
          >
            <Settings className="h-6 w-6" />
            <span className="text-[10px] font-bold">Ajustes</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow p-4 md:p-10 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={activeTab}
        >
          {activeTab === 'orders' && canAccess('orders') && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
                <div className="relative w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Buscar por cliente..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 pl-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>


              

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm font-medium uppercase tracking-wider">
                        <th className="p-4">ID</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">VENDEDOR</th>
                        <th className="p-4">Pago</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-mono text-sm text-gray-500">#{order.id}</td>
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{order.customer_name}</p>
                            <p className="text-sm text-gray-500">{order.customer_phone}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-sm text-gray-900">{order.seller_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{order.seller_code || 'Sin código'}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-medium text-gray-900 capitalize">{order.payment_method.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500 font-mono">Ref: {order.payment_reference}</p>
                          </td>
                          <td className="p-4 font-bold text-[#0F158F]">${order.total.toFixed(2)}</td>
                          <td className="p-4">
                            {order.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <Clock className="h-3 w-3" /> Por Revisar
                              </span>
                            )}
                            {order.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3" /> Aprobado
                              </span>
                            )}
                            {order.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3" /> Rechazado
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {order.status === 'approved' && (
                                <button
                                  onClick={() => { 
                                    setSelectedOrder(order); 
                                    setIsPreviewMode(false);
                                    setShowNotaEntrega(true); 
                                  }}
                                  className="p-2 bg-blue-50 text-[#0F158F] hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Ver Nota de Entrega"
                                >
                                  <Printer className="h-5 w-5" />
                                </button>
                              )}
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 bg-blue-50 text-[#0F158F] hover:bg-blue-100 rounded-lg transition-colors"
                                title="Ver Detalles"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              {adminUser?.role !== 'vendedor' && (
                                <button 
                                  onClick={() => { setSelectedOrder(order); setPaymentReference(order.payment_reference); setShowPaymentReferenceModal(true); }}
                                  className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Editar Referencia de Pago"
                                >
                                  <FilePenLine className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No hay pedidos registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && canAccess('products') && (
            <div>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Catálogo de Productos</h1>
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <div className="relative flex-grow">
                    <input 
                      type="text" 
                      placeholder="Buscar producto..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  <button 
                    onClick={() => setShowAddProduct(!showAddProduct)}
                    className="bg-[#D8121B] hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                  >
                    {showAddProduct ? 'Cancelar' : <><Plus className="h-5 w-5" /> Nuevo Producto</>}
                  </button>
                </div>
              </div>

              {showAddProduct && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Agregar Nuevo Producto</h3>
                  <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto</label>
                      <input 
                        type="text" required
                        value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Precio ($)</label>
                      <input 
                        type="number" step="0.01" required
                        value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                      <textarea 
                        required rows={3}
                        value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Disponible</label>
                      <input 
                        type="number" required
                        value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                      <select 
                        required
                        value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white"
                      >
                        <option value="">Seleccionar categoría...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL de la Imagen</label>
                      <div className="flex gap-2">
                        <input 
                          type="url" placeholder="https://..."
                          value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})}
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                        />
                      </div>
                      {newProduct.image_url && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Vista previa:</p>
                          <img src={newProduct.image_url} alt="Preview" className="h-24 object-contain rounded-lg border border-gray-200" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'block')} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comisión Base (%)</label>
                      <input 
                        type="number" step="0.01" required
                        value={newProduct.commission_rate} onChange={e => setNewProduct({...newProduct, commission_rate: parseFloat(e.target.value)})}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Ej: 0.05 para 5%</p>
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-4">
                      <button 
                        type="submit"
                        className="bg-[#0F158F] hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-bold transition-colors"
                      >
                        Guardar Producto
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="aspect-square bg-gray-100 relative">
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 bg-[#0F158F] text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {product.category || 'Sin Categoría'}
                      </div>
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                        Stock: {product.stock}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{product.description}</p>
                      <div className="mt-auto flex justify-between items-center">
                        <span className="font-black text-[#0F158F]">${product.price.toFixed(2)}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingProduct({
                              ...product,
                              description: product.description || '',
                              image_url: product.image_url || '',
                              category: product.category || ''
                            })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'categories' && canAccess('categories') && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Category Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Plus className="h-5 w-5 text-[#D8121B]" /> Nueva Categoría
                    </h3>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Categoría</label>
                        <input 
                          type="text" required
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Ej. Bebidas, Limpieza..."
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-[#0F158F] hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md"
                      >
                        Agregar Categoría
                      </button>
                    </form>
                  </div>
                </div>

                {/* Categories List */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {categories.map(category => (
                          <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              {editingCategory?.id === category.id ? (
                                <input 
                                  type="text"
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                  className="w-full px-3 py-1 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-medium text-gray-900">{category.name}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {editingCategory?.id === category.id ? (
                                  <>
                                    <button 
                                      onClick={handleUpdateCategory}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                      title="Guardar"
                                    >
                                      <CheckCircle className="h-5 w-5" />
                                    </button>
                                    <button 
                                      onClick={() => setEditingCategory(null)}
                                      className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                                      title="Cancelar"
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => setEditingCategory(category)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Editar"
                                    >
                                      <Edit className="h-5 w-5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteCategory(category)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && canAccess('clients') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Clientes Registrados</h2>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#0F158F]" />
                <span className="font-bold text-gray-900">{clients.length}</span>
                <span className="text-gray-500 text-sm">Total</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Identificación</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{client.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.type === 'juridica' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {client.type || 'Natural'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{client.identification || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{client.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{client.address || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <p>No hay clientes registrados aún.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && canAccess('reports') && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reporte de Ventas</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Ventas Totales</h3>
                  <p className="text-3xl font-bold text-[#0F158F]">
                    ${orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Pedidos Aprobados</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {orders.filter(o => o.status === 'approved').length}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 border-l-4 border-l-[#D8121B]">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Pagos por Revisar</h3>
                  <p className="text-3xl font-bold text-[#D8121B]">
                    {pendingOrdersCount}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Ventas por Día (Últimos 7 días)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const last7Days = Array.from({length: 7}, (_, i) => {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          return d.toISOString().split('T')[0];
                        }).reverse();

                        return last7Days.map(date => {
                          const dayOrders = orders.filter(o => 
                            o.status === 'approved' && 
                            o.created_at.startsWith(date)
                          );
                          return {
                            name: new Date(date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                            ventas: dayOrders.reduce((sum, o) => sum + o.total, 0)
                          };
                        });
                      })()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                      />
                      <Bar dataKey="ventas" fill="#0F158F" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vendedores' && canAccess('vendedores') && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {adminUser?.role === 'administrador' ? 'Gestión de Vendedores Activos' : 'Mis Comisiones'}
                </h1>
              </div>

              {adminUser?.role === 'administrador' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Sellers List */}
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Vendedores</h3>
                    {sellerPerformance.map(seller => (
                      <button
                        key={seller.id}
                        onClick={() => setSelectedSellerId(seller.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedSellerId === seller.id ? 'bg-[#0F158F] text-white border-[#0F158F] shadow-lg' : 'bg-white text-gray-900 border-gray-100 hover:border-blue-200'}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold">{seller.username}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${selectedSellerId === seller.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#0F158F]'}`}>
                            {seller.total_orders} Pedidos
                          </span>
                        </div>
                        <div className={`text-sm ${selectedSellerId === seller.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          Ventas: <span className="font-bold">${(seller.total_sales || 0).toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                    {sellerPerformance.length === 0 && (
                      <p className="text-gray-500 italic text-center py-8">No hay vendedores registrados.</p>
                    )}
                  </div>

                  {/* Seller Details */}
                  <div className="lg:col-span-2">
                    {selectedSellerId ? (
                      <div className="space-y-8">
                        {(() => {
                          const seller = sellerPerformance.find(s => s.id === selectedSellerId);
                          if (!seller) return null;
                          return (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                  <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Lo que más vende</h4>
                                  <div className="space-y-3">
                                    {seller.top_products.map((p: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center">
                                        <span className="text-sm text-gray-700 truncate mr-4">{p.name}</span>
                                        <span className="text-sm font-bold text-[#0F158F] whitespace-nowrap">{p.total_quantity} bultos</span>
                                      </div>
                                    ))}
                                    {seller.top_products.length === 0 && <p className="text-gray-400 italic text-sm">Sin ventas registradas.</p>}
                                  </div>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                  <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Resumen Financiero</h4>
                                  <div className="space-y-4">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Total Ventas</span>
                                      <span className="text-lg font-bold text-gray-900">${(seller.total_sales || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Total Comisiones</span>
                                      <span className="text-lg font-bold text-green-600">${(seller.total_commissions || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                  <h4 className="font-bold text-gray-900">Pedidos Recientes</h4>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Cliente</th>
                                        <th className="p-4">Monto</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4">Fecha</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {seller.recent_orders.map((o: any) => (
                                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                          <td className="p-4 font-mono text-xs text-gray-400">#{o.id}</td>
                                          <td className="p-4 font-bold text-sm text-gray-900">{o.customer_name}</td>
                                          <td className="p-4 font-bold text-sm text-[#D8121B]">${o.total.toFixed(2)}</td>
                                          <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${o.status === 'approved' ? 'bg-green-100 text-green-800' : o.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                              {o.status}
                                            </span>
                                          </td>
                                          <td className="p-4 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400">
                        <Users className="h-16 w-16 mb-4 opacity-20" />
                        <p className="font-medium">Seleccione un vendedor para ver sus detalles</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {loggedInSellerPerformance && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                          <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Lo que más vende</h4>
                          <div className="space-y-3">
                            {loggedInSellerPerformance.top_products.map((p: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="text-sm text-gray-700 truncate mr-4">{p.name}</span>
                                <span className="text-sm font-bold text-[#0F158F] whitespace-nowrap">{p.total_quantity} bultos</span>
                              </div>
                            ))}
                            {loggedInSellerPerformance.top_products.length === 0 && <p className="text-gray-400 italic text-sm">Sin ventas registradas.</p>}
                          </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                          <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Resumen Financiero</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Ventas</span>
                              <span className="text-lg font-bold text-gray-900">${(loggedInSellerPerformance.total_sales || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Comisiones</span>
                              <span className="text-lg font-bold text-green-600">${(loggedInSellerPerformance.total_commissions || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                          <h4 className="font-bold text-gray-900">Pedidos Recientes</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                <th className="p-4">ID</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Monto</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {loggedInSellerPerformance.recent_orders.map((o: any) => (
                                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="p-4 font-mono text-xs text-gray-400">#{o.id}</td>
                                  <td className="p-4 font-bold text-sm text-gray-900">{o.customer_name}</td>
                                  <td className="p-4 font-bold text-sm text-[#D8121B]">${o.total.toFixed(2)}</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${o.status === 'approved' ? 'bg-green-100 text-green-800' : o.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                      {o.status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                                  <td className="p-4 text-right">
                                    {o.status === 'approved' && (
                                      <button
                                        onClick={() => {
                                          const fullOrder = orders.find(order => order.id === o.id);
                                          if (fullOrder) {
                                            setSelectedOrder(fullOrder);
                                            setIsPreviewMode(false);
                                            setShowNotaEntrega(true);
                                          }
                                        }}
                                        className="p-2 bg-blue-50 text-[#0F158F] hover:bg-blue-100 rounded-lg transition-colors"
                                        title="Ver Nota de Entrega"
                                      >
                                        <Printer className="h-4 w-4" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Commissions Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-gray-500 text-sm font-medium mb-2">Comisiones Pendientes</h3>
                      <p className="text-3xl font-bold text-[#D8121B]">
                        ${commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-gray-500 text-sm font-medium mb-2">Comisiones Pagadas</h3>
                      <p className="text-3xl font-bold text-green-600">
                        ${commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-gray-500 text-sm font-medium mb-2">Total Ganado</h3>
                      <p className="text-3xl font-bold text-[#0F158F]">
                        ${commissions.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Commissions Table */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-xl font-bold text-gray-900">Historial de Comisiones</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <th className="p-4">Pedido</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Monto Pedido</th>
                            <th className="p-4">Comisión</th>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {commissions.map(comm => (
                            <tr key={comm.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-mono text-sm text-gray-500">#{comm.order_id}</td>
                              <td className="p-4 font-bold text-gray-900">{comm.customer_name}</td>
                              <td className="p-4 text-gray-700">${(Number(comm.order_total) || 0).toFixed(2)}</td>
                              <td className="p-4 font-bold text-[#0F158F]">${(Number(comm.amount) || 0).toFixed(2)}</td>
                              <td className="p-4 text-sm text-gray-500">{new Date(comm.created_at).toLocaleDateString()}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${comm.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {comm.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {commissions.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-500">No hay comisiones registradas.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'cargar_pedidos' && canAccess('cargar_pedidos') && (
            <div className="space-y-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cargar Nuevo Pedido</h1>
              </div>

              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="flex flex-col lg:flex-row min-h-[600px]">
                  {/* Left Side: Product Selection */}
                  <div className="w-full lg:w-1/2 p-6 border-r border-gray-100 bg-gray-50/50 overflow-y-auto max-h-[800px]">
                    <div className="mb-6">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input 
                          type="text"
                          placeholder="Buscar productos para el pedido..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          className="flex flex-col p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{product.category}</span>
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
                          <p className="text-lg font-black text-[#D8121B] mt-auto">${product.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="number"
                              min="1"
                              defaultValue={1}
                              id={`qty-${product.id}`}
                              className="w-16 text-center border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#0F158F] outline-none"
                            />
                            <button
                              onClick={() => {
                                const qty = parseInt((document.getElementById(`qty-${product.id}`) as HTMLInputElement)?.value) || 1;
                                addProductToSellerOrder(product, qty);
                              }}
                              className="bg-[#0F158F] text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-blue-800 transition-colors flex-1"
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Order Details */}
                  <div className="w-full lg:w-1/2 p-6 flex flex-col bg-white overflow-y-auto max-h-[800px]">
                    <form onSubmit={handlePreviewOrder} className="space-y-6 flex-grow">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Razón Social del Comercio</label>
                          <input 
                            type="text" required
                            value={sellerOrder.business_name} onChange={e => setSellerOrder({...sellerOrder, business_name: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white"
                            placeholder="Nombre del negocio"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Cliente / Encargado</label>
                            <input 
                              type="text" required
                              value={sellerOrder.customer_name} onChange={e => setSellerOrder({...sellerOrder, customer_name: e.target.value})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cédula / RIF Comercio</label>
                            <div className="flex rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-[#0F158F] overflow-hidden bg-white">
                              <select
                                value={sellerOrder.customer_id_type}
                                onChange={e => {
                                  setSellerOrder({...sellerOrder, customer_id_type: e.target.value});
                                  fetchClientDetails(e.target.value, sellerOrder.customer_id_number);
                                }}
                                className="px-4 py-2 bg-gray-100 border-r border-gray-300 outline-none font-bold text-gray-700"
                              >
                                <option value="V">V</option>
                                <option value="J">J</option>
                              </select>
                              <input 
                                type="text" required
                                value={sellerOrder.customer_id_number} 
                                onChange={e => {
                                  setSellerOrder({...sellerOrder, customer_id_number: e.target.value});
                                  fetchClientDetails(sellerOrder.customer_id_type, e.target.value);
                                }}
                                className="w-full px-4 py-2 outline-none bg-white"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección o Referencia</label>
                          <textarea 
                            required rows={2}
                            value={sellerOrder.address} onChange={e => setSellerOrder({...sellerOrder, address: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono del Cliente</label>
                            <input 
                              type="text" required
                              value={sellerOrder.customer_phone} onChange={e => setSellerOrder({...sellerOrder, customer_phone: e.target.value})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código de Vendedor</label>
                            <input 
                              type="text"
                              value={adminUser?.seller_code || ''}
                              readOnly
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Pago</label>
                            <select 
                              value={sellerOrder.payment_method} onChange={e => setSellerOrder({...sellerOrder, payment_method: e.target.value})}
                              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white font-bold"
                            >
                              <option value="contado">DE CONTADO</option>
                              <option value="credito">A CRÉDITO</option>
                            </select>
                          </div>
                              {sellerOrder.payment_method === 'credito' && (
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Días de Crédito</label>
                                  <input 
                                    type="number"
                                    value={sellerOrder.credit_days || ''} 
                                    onChange={e => setSellerOrder({...sellerOrder, credit_days: parseInt(e.target.value) || 0})}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white"
                                  />
                                </div>
                              )}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-bold text-sm text-gray-900 mb-3">Productos en el Pedido</h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                          {sellerOrder.items.map(item => (
                            <div key={item.product_id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                              <div className="flex items-center gap-3">
                                <span className="bg-blue-50 text-[#0F158F] font-bold px-2 py-1 rounded-lg text-xs">{item.quantity}x</span>
                                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                                <button 
                                  type="button"
                                  onClick={() => removeProductFromSellerOrder(item.product_id)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {sellerOrder.items.length === 0 && (
                            <p className="text-center text-gray-400 text-xs py-4 italic">No hay productos seleccionados</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <input
                          type="checkbox"
                          id="applyDiscount"
                          checked={sellerOrder.apply_discount}
                          onChange={e => setSellerOrder({...sellerOrder, apply_discount: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-300 text-[#0F158F] focus:ring-[#0F158F]"
                        />
                        <label htmlFor="applyDiscount" className="text-sm font-medium text-gray-700">Aplicar descuento (5%)</label>
                      </div>

                      <div className="bg-[#0F158F] p-4 rounded-2xl text-white">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-blue-200 text-xs font-bold uppercase">Total del Pedido</span>
                          <span className="text-2xl font-black">${sellerOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-80">
                          <span className="text-blue-200 text-[10px] font-bold uppercase">Comisión Estimada (5%)</span>
                          <span className="text-sm font-bold">${(sellerOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 0.05).toFixed(2)}</span>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={sellerOrder.items.length === 0}
                        className="w-full bg-[#0F158F] hover:bg-blue-900 disabled:bg-gray-300 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                      >
                        VER NOTA DE ENTREGA / PREVISUALIZAR
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'audit' && canAccess('audit') && (
            <div className="space-y-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <History className="h-8 w-8 text-[#0F158F]" /> Registro de Auditoría
                </h1>
                <button 
                  onClick={fetchAuditLogs}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Clock className="h-4 w-4" /> Actualizar
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">Fecha y Hora</th>
                        <th className="p-4">Usuario</th>
                        <th className="p-4">Acción</th>
                        <th className="p-4">Detalles</th>
                        <th className="p-4">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors text-sm">
                          <td className="p-4 text-gray-500 font-mono whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-gray-900">{log.username || 'Sistema'}</span>
                            <span className="block text-[10px] text-gray-400">ID: {log.user_id || 'N/A'}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              log.action.includes('DELETE') ? 'bg-red-100 text-red-700' :
                              log.action.includes('CREATE') ? 'bg-green-100 text-green-700' :
                              log.action.includes('LOGIN') ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </td>
                          <td className="p-4 text-gray-400 font-mono text-xs">
                            {log.ip_address}
                          </td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500 italic">No hay registros de auditoría disponibles.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && canAccess('chat') && (
            <SupportChatAdmin />
          )}

          {activeTab === 'settings' && canAccess('settings') && (
            <div className="space-y-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Configuración del Sitio</h1>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Logo Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-[#0F158F]" /> Identidad Visual
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subir Logo o Pegar URL</label>
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                          <input 
                            type="url" 
                            value={newLogoUrl}
                            onChange={(e) => setNewLogoUrl(e.target.value)}
                            placeholder="https://ejemplo.com/logo.png"
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                          />
                        </div>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label 
                            htmlFor="logo-upload"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#0F158F] hover:bg-blue-50 transition-all"
                          >
                            <UploadCloud className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">Haz clic para subir imagen</span>
                          </label>
                        </div>
                        <button 
                          onClick={() => updateLogoUrl(newLogoUrl)}
                          className="w-full bg-[#0F158F] hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md"
                        >
                          Actualizar Logo en toda la App
                        </button>
                      </div>
                    </div>
                    
                    {newLogoUrl && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center">
                        <p className="text-xs text-gray-500 mb-4 uppercase font-bold tracking-wider">Vista previa actual:</p>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <img src={newLogoUrl} alt="Logo Preview" className="h-16 object-contain" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* BCV Rate Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#D8121B]" /> Tasa de Cambio (BCV)
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tasa Actual (Bs. / USD)</label>
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Bs.</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={bcvRate}
                            onChange={(e) => setBcvRate(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none font-bold text-lg"
                          />
                        </div>
                        <button 
                          onClick={handleUpdateBcv}
                          disabled={updatingBcv}
                          className="bg-[#D8121B] hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-md disabled:opacity-50"
                        >
                          {updatingBcv ? '...' : 'Actualizar'}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        Esta tasa se utiliza para calcular los precios en Bolívares en el carrito y en los detalles de pago para los clientes.
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                      <p className="text-sm text-amber-800">
                        <strong>Nota:</strong> Al actualizar esta tasa, los clientes verán el nuevo monto en Bolívares inmediatamente al finalizar su compra.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banner Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-[#0F158F]" /> Personalización del Banner (Hero)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título del Banner</label>
                        <input 
                          type="text" 
                          value={newBanner.title}
                          onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                          placeholder="Título llamativo..."
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo / Descripción</label>
                        <textarea 
                          rows={3}
                          value={newBanner.subtitle}
                          onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                          placeholder="Descripción breve de tu negocio..."
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de Fondo (URL o Subir)</label>
                        <div className="flex flex-col gap-4">
                          <input 
                            type="url" 
                            value={newBanner.imageUrl}
                            onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                          />
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleBannerImageUpload}
                              className="hidden"
                              id="banner-upload"
                            />
                            <label 
                              htmlFor="banner-upload"
                              className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#0F158F] hover:bg-blue-50 transition-all"
                            >
                              <UploadCloud className="h-5 w-5 text-gray-400" />
                              <span className="text-sm font-medium text-gray-600">Cambiar imagen de fondo</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleUpdateBanner}
                        disabled={updatingBanner}
                        className="w-full bg-[#0F158F] hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md disabled:opacity-50"
                      >
                        {updatingBanner ? 'Actualizando...' : 'Guardar Cambios del Banner'}
                      </button>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100 flex flex-col">
                      <p className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-white border-b border-gray-100">Vista Previa en Vivo</p>
                      <div className="relative flex-grow min-h-[300px] flex items-center justify-center p-8 text-center">
                        <div className="absolute inset-0">
                          <img 
                            src={newBanner.imageUrl || 'https://picsum.photos/seed/banner/800/400'} 
                            alt="Banner Preview" 
                            className="w-full h-full object-cover opacity-30"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#0F158F]/80 to-transparent"></div>
                        </div>
                        <div className="relative z-10 max-w-md">
                          <h4 className="text-2xl font-black text-white mb-2 leading-tight">{newBanner.title || 'Título del Banner'}</h4>
                          <p className="text-sm text-blue-100 opacity-90">{newBanner.subtitle || 'Subtítulo del banner...'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Permissions Management */}
                {adminUser?.role === 'administrador' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#D8121B]" /> Permisos por Rol
                      </h3>
                      <button 
                        onClick={() => setShowAddRole(true)}
                        className="flex items-center gap-2 bg-[#D8121B] hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Nuevo Rol
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {availableRoles.map(role => {
                        const rolePerms = allPermissions.filter(p => p.role === role).map(p => p.permission);
                        return (
                          <div key={role} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-bold text-gray-900 capitalize">{role}</h4>
                              <button 
                                onClick={() => setEditingRolePermissions({role, permissions: rolePerms})}
                                className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                              >
                                Editar Permisos
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {rolePerms.length > 0 ? rolePerms.map(p => (
                                <span key={p} className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] text-gray-600 font-medium">
                                  {p}
                                </span>
                              )) : (
                                <span className="text-xs text-gray-400 italic">Sin permisos asignados</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Admin Users Management */}
                {adminUser?.role === 'administrador' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-[#0F158F]" /> Gestión de Usuarios
                      </h3>
                      <button 
                        onClick={() => setShowAddUser(true)}
                        className="flex items-center gap-2 bg-[#0F158F] hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                      >
                        <UserPlus className="h-4 w-4" /> Nuevo Usuario
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <th className="p-4">Usuario</th>
                            <th className="p-4">CÓDIGO</th>
                            <th className="p-4">Rol</th>
                            <th className="p-4">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {adminUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-bold text-gray-900">
                                {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
                              </td>
                              <td className="p-4 text-sm text-gray-600">{user.seller_code || <span className="text-gray-300 italic">Sin código</span>}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  user.role === 'administrador' ? 'bg-purple-100 text-purple-800' :
                                  user.role === 'soporte' ? 'bg-blue-100 text-blue-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => setEditingUser(user)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    disabled={user.username === 'admin'}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">Editar Producto</h2>
                <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto</label>
                    <input 
                      type="text" required
                      value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Precio ($)</label>
                    <input 
                      type="number" step="0.01" required
                      value={editingProduct.price || ''} 
                      onChange={e => setEditingProduct({...editingProduct, price: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                    <textarea 
                      required rows={3}
                      value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Disponible</label>
                    <input 
                      type="number" required
                      value={editingProduct.stock || ''} 
                      onChange={e => setEditingProduct({...editingProduct, stock: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                    <select 
                      required
                      value={editingProduct.category || ''} 
                      onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white"
                    >
                      <option value="">Seleccionar categoría...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL de la Imagen</label>
                    <input 
                      type="url" required
                      value={editingProduct.image_url} onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comisión Base (%)</label>
                    <input 
                      type="number" step="0.01" required
                      value={editingProduct.commission_rate || 0.05} 
                      onChange={e => setEditingProduct({...editingProduct, commission_rate: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Ej: 0.05 para 5%</p>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                    <button 
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="bg-[#0F158F] hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-bold transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-2xl shadow-2xl w-full ${adminUser?.role === 'vendedor' ? 'max-w-2xl' : 'max-w-5xl'} max-h-[90vh] overflow-hidden flex flex-col`}
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">
                  {adminUser?.role === 'vendedor' ? 'Detalle del Pedido' : `Verificación de Pago - Pedido #${selectedOrder.id}`}
                </h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              {adminUser?.role === 'vendedor' ? (
                <div className="p-6 overflow-y-auto">
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-[#0F158F]">Detalle del Pedido #{selectedOrder.id}</h2>
                    
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <p><span className="font-bold">Cliente:</span> {selectedOrder.customer_name}</p>
                      <p><span className="font-bold">Negocio:</span> {selectedOrder.business_name}</p>
                      <p><span className="font-bold">Teléfono:</span> {selectedOrder.customer_phone}</p>
                      <p><span className="font-bold">Dirección:</span> {selectedOrder.address}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <p><span className="font-bold">Método de pago:</span> {selectedOrder.payment_method}</p>
                      <p><span className="font-bold">Referencia:</span> {selectedOrder.payment_reference || 'N/A'}</p>
                      <p><span className="font-bold">Total:</span> <span className="text-[#D8121B] font-bold">${(selectedOrder.total || 0).toFixed(2)}</span></p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="font-bold mb-2">Productos:</p>
                      {selectedOrder.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-200">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span className="font-bold">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center flex-col gap-4">
                      <div className="flex justify-center">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${
                          selectedOrder.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          selectedOrder.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          Estado: {selectedOrder.status === 'approved' ? 'Aprobado' : selectedOrder.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                        </span>
                      </div>
                      
                      {selectedOrder.status === 'approved' && (
                        <button 
                          onClick={() => {
                            setIsPreviewMode(false);
                            setShowNotaEntrega(true);
                          }}
                          className="w-full bg-[#0F158F] hover:bg-blue-900 text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                        >
                          <Printer className="h-5 w-5" /> Imprimir Nota de Entrega
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                  {/* Left Side: Details */}
                  <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-gray-100">
                    <h3 className="font-bold text-lg mb-4 text-[#0F158F]">Datos del Cliente / Comercio</h3>
                    <div className="bg-gray-50 p-4 rounded-xl mb-6 space-y-2">
                      {selectedOrder.business_name && <p><span className="font-medium">Comercio:</span> {selectedOrder.business_name}</p>}
                      <p><span className="font-medium">Nombre:</span> {selectedOrder.customer_name}</p>
                      <p><span className="font-medium">Cédula/RIF:</span> {selectedOrder.customer_id_number}</p>
                      <p><span className="font-medium">Teléfono:</span> {selectedOrder.customer_phone}</p>
                      {selectedOrder.address && <p><span className="font-medium">Dirección:</span> {selectedOrder.address}</p>}
                      {selectedOrder.seller_name_code && <p><span className="font-medium">Vendedor:</span> {selectedOrder.seller_name_code}</p>}
                      <p><span className="font-medium">Fecha:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>

                    <h3 className="font-bold text-lg mb-4 text-[#0F158F]">Detalles del Pago</h3>
                    <div className="bg-gray-50 p-4 rounded-xl mb-6">
                      <p><span className="font-medium">Método:</span> <span className="capitalize">{selectedOrder.payment_method.replace('_', ' ')}</span></p>
                      <p><span className="font-medium">Referencia:</span> <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">{selectedOrder.payment_reference}</span></p>
                      <p className="mt-2 text-xl"><span className="font-medium">Total a verificar:</span> <span className="font-black text-[#D8121B]">${selectedOrder.total.toFixed(2)}</span></p>
                    </div>

                    <h3 className="font-bold text-lg mb-4 text-[#0F158F]">Artículos</h3>
                    <ul className="divide-y divide-gray-100 mb-6">
                      {selectedOrder.items.map(item => (
                        <li key={item.id} className="py-2 flex justify-between">
                          <span>{item.quantity}x {item.product_name}</span>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    
                      <div className="flex flex-col gap-4 mt-8">
                        {selectedOrder.status === 'approved' && (
                          <button 
                            onClick={() => {
                              setIsPreviewMode(false);
                              setShowNotaEntrega(true);
                            }}
                            className="w-full bg-[#0F158F] hover:bg-blue-900 text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                          >
                            <Printer className="h-5 w-5" /> Generar Nota de Entrega
                          </button>
                        )}
                        <button 
                          onClick={() => { setPaymentReference(selectedOrder.payment_reference); setShowPaymentReferenceModal(true); }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                        >
                          <FilePenLine className="h-5 w-5" /> Editar Referencia
                        </button>
                        {selectedOrder.status === 'pending' && (
                          <div className="flex gap-4">
                            <button 
                              onClick={() => updateOrderStatus(selectedOrder.id, 'approved')}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                            >
                              <CheckCircle className="h-5 w-5" /> Verificar y Descontar Stock
                            </button>
                            <button 
                              onClick={() => updateOrderStatus(selectedOrder.id, 'rejected')}
                              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                            >
                              <XCircle className="h-5 w-5" /> Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                  </div>

                  {/* Right Side: Receipt Image */}
                  <div className="w-full md:w-1/2 bg-gray-900 p-6 flex flex-col items-center justify-center relative min-h-[300px]">
                    {selectedOrder.payment_receipt ? (
                      <div className="w-full h-full flex items-center justify-center overflow-auto">
                        <img 
                          src={selectedOrder.payment_receipt} 
                          alt="Comprobante de Pago" 
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl hover:scale-150 transition-transform duration-300 cursor-zoom-in origin-center"
                        />
                      </div>
                    ) : (
                      <div className="text-gray-500 flex flex-col items-center">
                        <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                        <p>El cliente no adjuntó imagen del comprobante.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¿Estás seguro?</h3>
                <p className="text-gray-500 mb-6">
                  Estás a punto de eliminar {deleteConfirmation.type === 'product' ? 'el producto' : 'la categoría'} <span className="font-bold text-gray-800">"{deleteConfirmation.name}"</span>. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null })}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-md"
                  >
                    Sí, Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {showNotaEntrega && selectedOrder && (
          <NotaEntrega 
            order={selectedOrder} 
            onClose={() => {
              setShowNotaEntrega(false);
              setIsPreviewMode(false);
            }} 
            onConfirm={isPreviewMode ? handleSellerOrderSubmit : undefined}
            bcvRate={parseFloat(bcvRate)}
            logoUrl={logoUrl}
          />
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Nuevo Usuario</h2>
                <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                    <input 
                      type="text" required
                      value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input 
                      type="password" required
                      value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                    <input
                      type="text"
                      value={newUser.first_name || ''}
                      onChange={e => setNewUser({...newUser, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F158F] outline-none"
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellido</label>
                    <input
                      type="text"
                      value={newUser.last_name || ''}
                      onChange={e => setNewUser({...newUser, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F158F] outline-none"
                      placeholder="Apellido"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <select 
                      value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white"
                    >
                      {availableRoles.map(role => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código de Vendedor</label>
                    <input 
                      type="text"
                      value={newUser.seller_code || ''}
                      onChange={e => setNewUser({...newUser, seller_code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F158F] outline-none"
                      placeholder="Ej: VEN-001"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-[#0F158F] hover:bg-blue-900 text-white py-3 rounded-xl font-bold transition-colors shadow-md mt-4"
                  >
                    Crear Usuario
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Editar Usuario</h2>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                    <input 
                      type="text" required
                      value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (dejar vacío para no cambiar)</label>
                    <input 
                      type="password"
                      value={(editingUser as any).newPassword || ''} 
                      onChange={e => setEditingUser({...editingUser, newPassword: e.target.value} as any)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                    <input
                      type="text"
                      value={editingUser.first_name || ''}
                      onChange={e => setEditingUser({...editingUser, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F158F] outline-none"
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellido</label>
                    <input
                      type="text"
                      value={editingUser.last_name || ''}
                      onChange={e => setEditingUser({...editingUser, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F158F] outline-none"
                      placeholder="Apellido"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <select 
                      value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-white"
                    >
                      {availableRoles.map(role => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código de Vendedor</label>
                    <input 
                      type="text"
                      value={editingUser.seller_code || ''}
                      onChange={e => setEditingUser({...editingUser, seller_code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F158F] outline-none"
                      placeholder="Ej: VEN-001"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-[#0F158F] hover:bg-blue-900 text-white py-3 rounded-xl font-bold transition-colors shadow-md mt-4"
                  >
                    Guardar Cambios
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Edit Role Permissions Modal */}
      <AnimatePresence>
        {editingRolePermissions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Editar Permisos: <span className="capitalize">{editingRolePermissions.role}</span></h2>
                <button onClick={() => setEditingRolePermissions(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {['products', 'orders', 'reports', 'categories', 'settings', 'clients', 'vendedores', 'chat', 'cargar_pedidos', 'audit'].map(perm => (
                    <label key={perm} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox"
                        checked={editingRolePermissions.permissions.includes(perm)}
                        onChange={(e) => {
                          const newPerms = e.target.checked 
                            ? [...editingRolePermissions.permissions, perm]
                            : editingRolePermissions.permissions.filter(p => p !== perm);
                          setEditingRolePermissions({...editingRolePermissions, permissions: newPerms});
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-[#0F158F] focus:ring-[#0F158F]"
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">{perm.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
                <button 
                  onClick={() => handleUpdateRolePermissions(editingRolePermissions.role, editingRolePermissions.permissions)}
                  className="w-full bg-[#0F158F] hover:bg-blue-900 text-white py-3 rounded-xl font-bold transition-colors shadow-md"
                >
                  Guardar Permisos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Role Modal */}
      <AnimatePresence>
        {showAddRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Nuevo Rol</h2>
                <button onClick={() => setShowAddRole(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol</label>
                    <input 
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Ej: supervisor"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (newRoleName.trim()) {
                        const role = newRoleName.toLowerCase().trim();
                        if (!availableRoles.includes(role)) {
                          setAvailableRoles([...availableRoles, role]);
                          setEditingRolePermissions({role, permissions: []});
                          setShowAddRole(false);
                          setNewRoleName('');
                        } else {
                          toast.error('El rol ya existe');
                        }
                      }
                    }}
                    className="w-full bg-[#0F158F] hover:bg-blue-900 text-white py-3 rounded-xl font-bold transition-colors shadow-md"
                  >
                    Crear y Asignar Permisos
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showPaymentReferenceModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Actualizar Referencia de Pago</h2>
            <p className="text-gray-600 mb-6">Pedido ID: {selectedOrder.id}</p>
            <form onSubmit={handleUpdatePaymentReference}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Referencia</label>
                <input 
                  type="text"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none bg-gray-50"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setShowPaymentReferenceModal(false)}
                  className="px-6 py-3 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 rounded-xl text-white bg-[#0F158F] hover:bg-blue-800 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
