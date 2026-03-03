import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Truck, Star, Users, Award, Heart } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function About() {
  const { banner } = useSettings();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F4F4F4] pb-20"
    >
      {/* Hero Section */}
      <div className="bg-[#0F158F] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src={banner.imageUrl || "https://images.unsplash.com/photo-1586528116311-ad8ed7c508b0?q=80&w=2070&auto=format&fit=crop"} 
            alt="Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Sobre Nosotros</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Somos ALLPROSUM 33, tu aliado comercial de confianza en Venezuela.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Nuestra Historia</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Fundada con la visión de conectar a los mejores productores con los consumidores venezolanos, ALLPROSUM 33 se ha consolidado como una distribuidora líder en el mercado nacional. Nos especializamos en snacks, alimentos y productos de consumo masivo de alta calidad.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Nuestro compromiso va más allá de la distribución; buscamos construir relaciones duraderas con nuestros clientes y proveedores, basadas en la confianza, la eficiencia y la excelencia en el servicio.
              </p>
              <div className="flex gap-4 mt-8">
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-xl">
                  <span className="text-3xl font-black text-[#0F158F]">+5</span>
                  <span className="text-xs font-bold text-gray-500 uppercase">Años</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-xl">
                  <span className="text-3xl font-black text-[#0F158F]">+1k</span>
                  <span className="text-xs font-bold text-gray-500 uppercase">Clientes</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-xl">
                  <span className="text-3xl font-black text-[#0F158F]">100%</span>
                  <span className="text-xs font-bold text-gray-500 uppercase">Calidad</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl overflow-hidden shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop" 
                  alt="Warehouse" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#D8121B] text-white p-6 rounded-2xl shadow-lg max-w-xs hidden md:block">
                <p className="font-bold text-lg italic">"Llevamos calidad a cada rincón del país."</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mt-20 mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#0F158F]">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Integridad</h3>
              <p className="text-gray-500">Actuamos con honestidad y transparencia en cada transacción y relación comercial.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#0F158F]">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Compromiso</h3>
              <p className="text-gray-500">Estamos dedicados al éxito de nuestros clientes, brindando soporte y atención personalizada.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#0F158F]">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Excelencia</h3>
              <p className="text-gray-500">Buscamos la mejora continua en nuestros procesos y la máxima calidad en nuestros productos.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
