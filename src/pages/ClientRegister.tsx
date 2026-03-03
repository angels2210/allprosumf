import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, MapPin, Briefcase, FileText, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useClient } from '../context/ClientContext';
import { useSettings } from '../context/SettingsContext';
import { apiRequest } from '../services/api';

export default function ClientRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    type: 'natural', // 'natural' | 'juridica'
    identification: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useClient();
  const { logoUrl } = useSettings();

  const validateIdentification = (type: string, id: string) => {
    if (type === 'natural') {
      // V-12345678 or E-12345678
      return /^[VE]-\d{5,9}$/.test(id);
    } else {
      // J-12345678-9 or G-12345678-9
      return /^[JG]-\d{5,9}-\d{1}$/.test(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateIdentification(formData.type, formData.identification)) {
      setError(formData.type === 'natural' 
        ? 'Formato de cédula inválido (Ej: V-12345678)' 
        : 'Formato de RIF inválido (Ej: J-12345678-9)');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('El formato del correo electrónico no es válido');
      setLoading(false);
      return;
    }

    // Password length validation
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      // Exclude confirmPassword from the data sent to the server
      const { confirmPassword, ...dataToSend } = formData;
      
      // Usamos apiRequest que ya tiene configurado el VITE_API_URL (http://localhost:5000/api)
      // Cambiamos el endpoint a /sales/clients según la indicación del backend
      const data = await apiRequest('/sales/clients', 'POST', dataToSend);

      if (data.success || data.client || data.id) {
        // Adaptamos según lo que devuelva el backend
        login(data.client || data.user || dataToSend, data.token || 'dummy-token');
        navigate('/');
      } else {
        setError(data.message || 'Error al registrarse');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-24 object-contain" />
          ) : (
            <div className="bg-[#0F158F] p-4 rounded-full">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crear Cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-medium text-[#0F158F] hover:text-blue-900">
            Inicia sesión aquí
          </Link>
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Persona</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'natural', identification: ''})}
                  className={`flex items-center justify-center gap-2 py-2 px-4 border rounded-md text-sm font-medium transition-colors ${
                    formData.type === 'natural'
                      ? 'bg-blue-50 border-[#0F158F] text-[#0F158F]'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  Natural
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'juridica', identification: ''})}
                  className={`flex items-center justify-center gap-2 py-2 px-4 border rounded-md text-sm font-medium transition-colors ${
                    formData.type === 'juridica'
                      ? 'bg-blue-50 border-[#0F158F] text-[#0F158F]'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  Jurídica
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formData.type === 'natural' ? 'Nombre Completo' : 'Razón Social'}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="focus:ring-[#0F158F] focus:border-[#0F158F] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder={formData.type === 'natural' ? "Juan Pérez" : "Empresa C.A."}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formData.type === 'natural' ? 'Cédula de Identidad' : 'RIF'}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.identification}
                  onChange={(e) => setFormData({...formData, identification: e.target.value.toUpperCase()})}
                  className="focus:ring-[#0F158F] focus:border-[#0F158F] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder={formData.type === 'natural' ? "V-12345678" : "J-12345678-9"}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formData.type === 'natural' ? 'Formato: V-12345678 o E-12345678' : 'Formato: J-12345678-9 o G-12345678-9'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="focus:ring-[#0F158F] focus:border-[#0F158F] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="focus:ring-[#0F158F] focus:border-[#0F158F] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="focus:ring-[#0F158F] focus:border-[#0F158F] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="focus:ring-[#0F158F] focus:border-[#0F158F] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="+58 414-1234567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="focus:ring-[#0F158F] focus:border-[#0F158F] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="Caracas, Venezuela"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0F158F] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F158F] transition-colors disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-[#0F158F] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al menú principal
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
