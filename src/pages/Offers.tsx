import React, { useEffect, useState } from 'react';
import { useCart, Product } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { ShoppingCart, ArrowRight, Star, ShieldCheck, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

export default function Offers() {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();
  const { banner } = useSettings();
  const [loading, setLoading] = useState(true);
  const [bcvRate, setBcvRate] = useState<number>(36.25);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    api.get('/products')
      .then(res => {
        // Simulate offers by taking some products or just showing all as offers since the UI implies it
        setProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });

    api.get('/bcv-rate')
      .then(res => {
        if (res.data.rate) setBcvRate(res.data.rate);
      })
      .catch(err => console.error('Error fetching BCV rate:', err));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F158F]"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F4F4F4] pb-20"
    >
      <div className="bg-[#D8121B] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight uppercase">Ofertas Especiales</h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">Aprovecha nuestros precios de locura en productos seleccionados. ¡Por tiempo limitado!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group cursor-pointer relative"
            >
              <div className="absolute top-4 right-4 z-10 bg-[#D8121B] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                <Tag className="h-3 w-3" /> OFERTA
              </div>
              
              <div className="aspect-square overflow-hidden bg-white relative p-4">
                <img 
                  src={product.image_url || 'https://placehold.co/400x400?text=Oferta'} 
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {product.stock <= 0 ? (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    Agotado
                  </div>
                ) : (
                  <div className="absolute top-4 left-4 bg-[#0F158F] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    Stock: {product.stock}
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow border-t border-gray-50">
                <span className="text-[10px] font-bold text-[#0F158F] uppercase tracking-widest mb-1">{product.category || 'General'}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#0F158F] transition-colors">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-4 flex-grow line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 line-through">${(product.price * 1.2).toFixed(2)}</span>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-[#D8121B] leading-none">${product.price.toFixed(2)}</span>
                      <span className="text-[10px] font-bold text-gray-500 mt-1">Bs. {(product.price * bcvRate).toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={product.stock <= 0}
                    className="bg-[#0F158F] hover:bg-blue-900 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100">
            No hay ofertas disponibles en este momento.
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            >
              {/* Image Section */}
              <div className="w-full md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative">
                <img 
                  src={selectedProduct.image_url || 'https://placehold.co/600x600?text=Oferta'} 
                  alt={selectedProduct.name}
                  className="max-w-full max-h-[400px] object-contain mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 left-4 md:hidden bg-white/80 p-2 rounded-full shadow-sm"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Details Section */}
              <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-[#0F158F] uppercase tracking-widest mb-2 block">{selectedProduct.category || 'General'}</span>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">{selectedProduct.name}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="hidden md:block text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Oferta Especial</span>
                </div>

                <div className="prose prose-sm text-gray-600 mb-8 flex-grow">
                  <p>{selectedProduct.description}</p>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Precio de Oferta</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-[#D8121B]">${selectedProduct.price.toFixed(2)}</span>
                        <span className="text-lg text-gray-400 line-through">${(selectedProduct.price * 1.2).toFixed(2)}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-500 mt-1">Bs. {(selectedProduct.price * bcvRate).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      {selectedProduct.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                          <ShieldCheck className="h-4 w-4" /> Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                          Agotado
                        </span>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{selectedProduct.stock} unidades en stock</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stock <= 0}
                    className="w-full bg-[#0F158F] hover:bg-blue-900 text-white py-4 rounded-xl font-bold text-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    {selectedProduct.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
