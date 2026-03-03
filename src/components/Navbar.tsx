import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Phone, MapPin, ChevronDown, Home, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useClient } from '../context/ClientContext';

export default function Navbar() {
  const { cart } = useCart();
  const { logoUrl, contactInfo } = useSettings();
  const { client, isAuthenticated } = useClient();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-[#0F158F] text-white text-xs py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contactInfo.phone}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Envíos a nivel nacional</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="hover:text-blue-200 transition-colors">Login Administrativo</Link>
            <span>|</span>
            <a href="#" className="hover:text-blue-200 transition-colors">Atención al Cliente</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 md:gap-8">
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Allprosum 33" className="h-12 object-contain" />
              ) : (
                <div className="bg-[#0F158F] text-white p-2 rounded-lg font-black text-xl tracking-tighter leading-none shadow-sm">
                  ALL<span className="text-[#D8121B]">PRO</span>
                </div>
              )}
              <div className="flex flex-col leading-none">
                <span className="font-black text-[#0F158F] text-xl tracking-tight">ALLPROSUM 33</span>
                <span className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase mt-0.5">Tu aliado comercial</span>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-grow hidden md:flex items-center max-w-2xl">
              <form onSubmit={handleSearch} className="relative w-full flex shadow-sm rounded-xl overflow-hidden">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¿Qué estás buscando hoy?" 
                  className="w-full pl-6 pr-12 py-3 border-2 border-r-0 border-gray-100 focus:border-[#0F158F] focus:ring-0 outline-none transition-colors bg-gray-50 focus:bg-white text-sm"
                />
                <button type="submit" className="bg-[#0F158F] hover:bg-blue-900 text-white px-8 transition-colors flex items-center justify-center">
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
              <Link to={isAuthenticated ? "/profile" : "/login"} className="flex flex-col items-center text-gray-700 hover:text-[#0F158F] transition-colors group">
                <User className="h-6 w-6 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase hidden sm:block">
                  {isAuthenticated ? `Hola, ${client?.name.split(' ')[0]}` : 'Cuenta'}
                </span>
              </Link>
              
              <Link to="/cart" className="relative flex flex-col items-center text-gray-700 hover:text-[#D8121B] transition-colors group">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 mb-0.5 group-hover:scale-110 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#D8121B] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-md">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase hidden sm:block">Carrito</span>
              </Link>
            </div>
          </div>
          
          {/* Mobile Search */}
          <div className="mt-4 md:hidden flex">
            <form onSubmit={handleSearch} className="w-full flex">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..." 
                className="w-full pl-4 pr-10 py-2 rounded-l-lg border-2 border-r-0 border-gray-200 focus:border-[#0F158F] outline-none bg-gray-50"
              />
              <button type="submit" className="bg-[#0F158F] text-white px-4 rounded-r-lg">
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMenuOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 py-6 px-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] z-50 rounded-t-3xl flex flex-col items-center text-center">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-6"></div>
            <ul className="space-y-4 font-bold text-gray-700 w-full">
              <li>
                <Link 
                  to="/" 
                  className="block hover:text-[#0F158F] transition-colors py-2 border-b border-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  INICIO
                </Link>
              </li>
              <li>
                <Link 
                  to="/#productos" 
                  className="block hover:text-[#0F158F] transition-colors py-2 border-b border-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  PRODUCTOS
                </Link>
              </li>
              <li>
                <Link 
                  to="/offers" 
                  className="block text-[#D8121B] hover:text-red-700 transition-colors py-2 border-b border-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  OFERTAS
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="block hover:text-[#0F158F] transition-colors py-2 border-b border-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  NOSOTROS
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="block hover:text-[#0F158F] transition-colors py-2 border-b border-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  CONTACTO
                </Link>
              </li>
              <li>
                <Link 
                  to={isAuthenticated ? "/profile" : "/login"}
                  className="block hover:text-[#0F158F] transition-colors py-2 text-sm text-gray-500 font-normal"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="inline-block h-4 w-4 mr-2" />
                  {isAuthenticated ? 'Mi Cuenta' : 'Iniciar Sesión / Registrarse'}
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin"
                  className="block hover:text-[#0F158F] transition-colors py-2 text-sm text-gray-500 font-normal border-t border-gray-100 mt-2 pt-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login Administrativo
                </Link>
              </li>
            </ul>
          </div>
        </>
      )}

      {/* Categories Nav */}
      <div className="hidden md:block bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-10 text-xs font-black text-gray-800">
            <li className="relative">
              <button className="flex items-center gap-3 bg-[#D8121B] text-white px-6 py-4 hover:bg-red-700 transition-all shadow-md group">
                <Menu className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                TODAS LAS CATEGORÍAS
              </button>
            </li>
            <li><Link to="/" className="hover:text-[#0F158F] transition-colors py-4 block tracking-wider">INICIO</Link></li>
            <li><Link to="/#productos" className="hover:text-[#0F158F] transition-colors py-4 flex items-center gap-1 tracking-wider">PRODUCTOS <ChevronDown className="h-4 w-4 text-gray-400"/></Link></li>
            <li><Link to="/offers" className="hover:text-[#D8121B] text-[#D8121B] transition-colors py-4 block tracking-wider">OFERTAS</Link></li>
            <li><Link to="/about" className="hover:text-[#0F158F] transition-colors py-4 block tracking-wider">NOSOTROS</Link></li>
            <li><Link to="/contact" className="hover:text-[#0F158F] transition-colors py-4 block tracking-wider">CONTACTO</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Nav (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center py-2 px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-t-2xl">
        <Link 
          to="/" 
          className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-[#0F158F] transition-all"
        >
          <Home className="h-6 w-6" />
          <span className="text-[10px] font-bold">Inicio</span>
        </Link>
        <Link 
          to="/#productos" 
          className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-[#0F158F] transition-all"
        >
          <Package className="h-6 w-6" />
          <span className="text-[10px] font-bold">Productos</span>
        </Link>
        <Link 
          to="/cart" 
          className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-[#D8121B] transition-all"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D8121B] text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Carrito</span>
        </Link>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-all ${isMenuOpen ? 'text-[#0F158F] scale-110' : 'text-gray-400'}`}
        >
          <Menu className="h-6 w-6" />
          <span className="text-[10px] font-bold">Menú</span>
        </button>
      </div>
    </header>
  );
}
