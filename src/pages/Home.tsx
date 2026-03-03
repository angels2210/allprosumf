import React, { useEffect, useState } from 'react';
import { useCart, Product } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { ShoppingCart, Plus, ArrowRight, Star, ShieldCheck, Truck, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const { addToCart } = useCart();
  const { banner } = useSettings();
  const [loading, setLoading] = useState(true);
  const [bcvRate, setBcvRate] = useState<number>(36.25);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#productos') {
      const element = document.getElementById('productos');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  useEffect(() => {
    api.get('/products')
      .then(res => {
        setProducts(res.data);
        setFilteredProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });

    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(err => {
        console.error('Error fetching categories:', err.message);
      });

    api.get('/bcv-rate')
      .then(res => {
        if (res.data.rate) setBcvRate(res.data.rate);
      })
      .catch(err => console.error('Error fetching BCV rate:', err));
  }, []);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      const lowerQuery = query.toLowerCase();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        (product.category && product.category.toLowerCase().includes(lowerQuery))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchParams, products]);

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
      {/* Products Section */}
      <div id="productos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {searchParams.get('search') ? `Resultados para "${searchParams.get('search')}"` : 'Productos Destacados'}
            </h2>
            <div className="h-1 w-20 bg-[#D8121B] mt-4"></div>
          </div>
          {!searchParams.get('search') && (
            <button className="hidden sm:flex items-center gap-2 text-[#0F158F] font-bold hover:text-blue-900 transition-colors">
              Ver todos <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {searchParams.get('search') && (
            <Link to="/" className="hidden sm:flex items-center gap-2 text-[#D8121B] font-bold hover:text-red-700 transition-colors">
              <X className="h-4 w-4" /> Limpiar búsqueda
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group cursor-pointer"
            >
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <img 
                  src={product.image_url || 'https://placehold.co/400x400?text=Producto'} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 bg-[#0F158F] text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  {product.category || 'General'}
                </div>
                {product.stock <= 0 ? (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                    Agotado
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                    Stock: {product.stock}
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-[#0F158F] transition-colors">{product.name}</h3>
                <p className="text-gray-500 text-xs mb-3 flex-grow line-clamp-2">{product.description}</p>
                <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="font-black text-[#D8121B] text-lg leading-none">${product.price.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-gray-400 mt-0.5">Bs. {(product.price * bcvRate).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={product.stock <= 0}
                    className="bg-[#0F158F] hover:bg-blue-900 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
            No hay productos disponibles en este momento.
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="relative bg-[#0F158F] overflow-hidden rounded-[2rem] shadow-2xl">
          <div className="absolute inset-0">
            <img 
              src={banner.imageUrl || "https://images.unsplash.com/photo-1586528116311-ad8ed7c508b0?q=80&w=2070&auto=format&fit=crop"} 
              alt="Warehouse" 
              className="w-full h-full object-cover opacity-20"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F158F] via-[#0F158F]/80 to-transparent"></div>
          </div>
          
          <div className="relative px-8 py-20 md:py-28 md:px-16">
            <div className="max-w-2xl">
              <span className="inline-block py-1 px-3 rounded-full bg-[#D8121B] text-white text-[10px] font-bold tracking-wider mb-6 uppercase">
                DISTRIBUIDOR OFICIAL
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                {banner.title || 'Todo lo que tu negocio necesita, en un solo lugar.'}
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-xl leading-relaxed font-medium">
                {banner.subtitle || 'Encuentra los mejores productos al mejor precio del mercado. Calidad garantizada y envíos a nivel nacional.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/#productos" className="bg-[#D8121B] hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 text-lg shadow-lg">
                  Ver Catálogo <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/admin" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center text-lg">
                  Acceso Distribuidores
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Categorías Populares</h2>
            <div className="h-1 w-20 bg-[#D8121B] mt-4"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.length > 0 ? categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:border-[#0F158F] hover:shadow-md transition-all cursor-pointer group">
              <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full mb-4 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <img src={`https://placehold.co/100x100?text=${cat.name.substring(0,2).toUpperCase()}`} alt={cat.name} className="w-10 h-10 object-cover rounded-full mix-blend-multiply" referrerPolicy="no-referrer" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
            </div>
          )) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              No hay categorías disponibles.
            </div>
          )}
        </div>
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
                  src={selectedProduct.image_url || 'https://placehold.co/600x600?text=Producto'} 
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
                  <span className="text-sm text-gray-500 font-medium">Producto Destacado</span>
                </div>

                <div className="prose prose-sm text-gray-600 mb-8 flex-grow">
                  <p>{selectedProduct.description}</p>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Precio por unidad</p>
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
