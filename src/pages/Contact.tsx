import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, MapPin, Mail, Clock, Send, CheckCircle, Truck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Contact() {
  const { contactInfo } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F4F4F4] pb-20"
    >
      {/* Hero Section */}
      <div className="bg-[#0F158F] text-white py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Contáctanos</h1>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto">Estamos aquí para ayudarte. Escríbenos o llámanos.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Información de Contacto</h3>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-full text-[#0F158F]">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Teléfono</h4>
                  <p className="text-gray-600">{contactInfo.phone}</p>
                  <p className="text-sm text-gray-400 mt-1">Lunes a Viernes, 8am - 5pm</p>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-full text-[#0F158F]">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Ubicación</h4>
                  <p className="text-gray-600">Caracas, Venezuela</p>
                  <p className="text-sm text-gray-400 mt-1">Envíos a todo el país</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-full text-[#0F158F]">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Correo Electrónico</h4>
                  <p className="text-gray-600">ventas@allprosum33.com</p>
                  <p className="text-sm text-gray-400 mt-1">Respuesta en 24h</p>
                </div>
              </div>
            </div>

            <div className="bg-[#D8121B] text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4">¿Eres Distribuidor?</h3>
                <p className="mb-6 text-red-100">Obtén precios especiales y beneficios exclusivos al registrarte como mayorista.</p>
                <button className="bg-white text-[#D8121B] px-6 py-3 rounded-xl font-bold w-full hover:bg-gray-100 transition-colors">
                  Contactar Ventas Mayoristas
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-20 transform rotate-12">
                <Truck className="h-40 w-40" />
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">¡Mensaje Enviado!</h3>
                  <p className="text-gray-600 mb-8">Gracias por contactarnos. Nuestro equipo te responderá a la brevedad posible.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-[#0F158F] font-bold hover:underline"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Envíanos un Mensaje</h3>
                  <p className="text-gray-500 mb-8">Completa el formulario y te responderemos lo antes posible.</p>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                        <input 
                          type="text" required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                        <input 
                          type="email" required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="tucorreo@ejemplo.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                      <input 
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="+58 ..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                      <textarea 
                        required rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="¿En qué podemos ayudarte?"
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#0F158F] hover:bg-blue-900 text-white py-4 rounded-xl font-bold text-lg transition-all hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <Send className="h-5 w-5" /> Enviar Mensaje
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
