import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useClient } from '../context/ClientContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export default function ClientLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useClient();
  const { logoUrl } = useSettings();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/clients/login', { email, password });
      const data = response.data;

      if (data.success) {
        login(data.user, data.token);
        toast.success(`Bienvenido, ${data.user.name}`);
        navigate('/profile');
      } else {
        setError(data.message || 'Credenciales inválidas');
        toast.error(data.message || 'Credenciales inválidas');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error de conexión. Intente nuevamente.';
      setError(msg);
      toast.error(msg);
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
          <Link to="/">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-20 object-contain" />
            ) : (
              <div className="bg-[#0F158F] p-4 rounded-full">
                <User className="h-10 w-10 text-white" />
              </div>
            )}
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ¿No tienes cuenta?
          <Link 
            to="/register"
            className="font-medium text-[#0F158F] hover:text-blue-800 ml-1"
          >
            Regístrate aquí
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
              <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-[#0F158F] focus:border-[#0F158F] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-[#0F158F] focus:border-[#0F158F] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0F158F] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F158F] transition-colors disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Ingresar'}
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
