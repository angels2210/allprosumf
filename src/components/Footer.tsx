import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, CreditCard, Banknote, ShieldCheck, Truck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const { logoUrl, contactInfo } = useSettings();

  return (
    <footer className="bg-[#0F158F] text-white pt-16 pb-8 border-t-4 border-[#D8121B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Features Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 pb-12 border-b border-blue-800">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-4 rounded-full">
              <Truck className="h-8 w-8 text-[#D8121B]" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">Envíos Nacionales</h4>
              <p className="text-sm text-blue-200">A todo el territorio venezolano</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-4 rounded-full">
              <ShieldCheck className="h-8 w-8 text-[#D8121B]" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">Compra Segura</h4>
              <p className="text-sm text-blue-200">Protección en todas tus compras</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-4 rounded-full">
              <CreditCard className="h-8 w-8 text-[#D8121B]" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">Múltiples Pagos</h4>
              <p className="text-sm text-blue-200">Pago Móvil, Transferencias, Zelle</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              {logoUrl ? (
                <img src={logoUrl} alt="Allprosum 33" className="h-12 object-contain bg-white p-1 rounded" />
              ) : (
                <div className="bg-white text-[#0F158F] p-2 rounded-lg font-black text-xl tracking-tighter leading-none">
                  ALL<span className="text-[#D8121B]">PRO</span>
                </div>
              )}
              <div className="flex flex-col leading-none">
                <span className="font-black text-white text-xl tracking-tight">ALLPROSUM 33</span>
                <span className="text-[10px] font-bold text-blue-300 tracking-widest uppercase">Tu aliado comercial</span>
              </div>
            </div>
            <p className="text-blue-200 text-sm mb-6 leading-relaxed">
              Somos distribuidores oficiales de las mejores marcas. Nuestro compromiso es ofrecer productos de calidad al mejor precio del mercado venezolano.
            </p>
            <div className="flex gap-4">
              <a href="#" className="bg-white/10 hover:bg-[#D8121B] p-2 rounded-full transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-[#D8121B] p-2 rounded-full transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-[#D8121B] p-2 rounded-full transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-6 uppercase tracking-wider">Enlaces Rápidos</h3>
            <ul className="space-y-3 text-blue-200 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[#D8121B]">›</span> Inicio</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[#D8121B]">›</span> Productos</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[#D8121B]">›</span> Ofertas</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[#D8121B]">›</span> Nosotros</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[#D8121B]">›</span> Contacto</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-6 uppercase tracking-wider">Categorías</h3>
            <ul className="space-y-3 text-blue-200 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[#D8121B]">›</span> Lubricantes</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[#D8121B]">›</span> Filtros</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[#D8121B]">›</span> Refrigerantes</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[#D8121B]">›</span> Baterías</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><span className="text-[#D8121B]">›</span> Accesorios</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-6 uppercase tracking-wider">Contacto</h3>
            <ul className="space-y-4 text-blue-200 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#D8121B] flex-shrink-0 mt-0.5" />
                <span>Av. Principal, Edificio Allprosum, Caracas, Venezuela.</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#D8121B] flex-shrink-0" />
                <span>{contactInfo.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#D8121B] flex-shrink-0" />
                <span>ventas@allprosum33.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-blue-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-blue-300 text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} {contactInfo.footerText}
          </p>
          <div className="flex items-center gap-4 text-blue-300">
            <span className="text-xs font-bold uppercase tracking-widest">Métodos de Pago:</span>
            <div className="flex gap-2">
              <div className="bg-white/10 px-3 py-1 rounded text-xs font-bold">PAGO MÓVIL</div>
              <div className="bg-white/10 px-3 py-1 rounded text-xs font-bold">ZELLE</div>
              <div className="bg-white/10 px-3 py-1 rounded text-xs font-bold">TRANSFERENCIA</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
