import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useClient } from '../context/ClientContext';
import { Trash2, Plus, Minus, CreditCard, Banknote, CheckCircle, UploadCloud, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { api } from '../services/api';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total: cartSubtotal, clearCart } = useCart();
  const { client } = useClient();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerIdNumber, setCustomerIdNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [managerName, setManagerName] = useState('');
  const [sellerNameCode, setSellerNameCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pago_movil' | 'transferencia' | 'contado' | 'credito'>('pago_movil');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [bcvRate, setBcvRate] = useState<number>(36.25); // Default fallback

  // Calculate discounts
  const calculateFinalTotal = () => {
    let discountedTotal = 0;
    cart.forEach(item => {
      let itemDiscount = 0;
      if (paymentMethod === 'contado') {
        if (item.quantity > 5) {
          itemDiscount = 0.07;
        } else {
          itemDiscount = 0.05;
        }
      }
      discountedTotal += (item.price * item.quantity) * (1 - itemDiscount);
    });
    return discountedTotal;
  };

  const finalTotal = calculateFinalTotal();
  const totalSavings = cartSubtotal - finalTotal;

  useEffect(() => {
    if (client) {
      setCustomerName(client.name || '');
      setCustomerPhone(client.phone || '');
      // customerIdNumber is not in client object currently, so we leave it empty or add it to client model later
    }
  }, [client]);

  useEffect(() => {
    api.get('/bcv-rate')
      .then(res => {
        if (res.data.rate) setBcvRate(res.data.rate);
      })
      .catch(err => console.error('Error fetching BCV rate:', err));
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPaymentReceipt(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false
  } as any);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/orders', {
        client_id: client?.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_id_number: customerIdNumber,
        business_name: businessName,
        address: address,
        manager_name: managerName,
        seller_name_code: sellerNameCode,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        payment_receipt: paymentReceipt,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      });
      
      const data = response.data;
      if (data.success) {
        setOrderId(data.orderId);
        clearCart();
        setStep(3);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Hubo un error al procesar su pedido. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step === 1) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <ShoppingCart className="h-24 w-24 text-gray-300 mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Su carrito está vacío</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Parece que aún no ha agregado ningún producto a su carrito. 
          Explore nuestros productos y encuentre lo que necesita.
        </p>
        <Link 
          to="/" 
          className="bg-[#0F158F] hover:bg-blue-900 text-white px-8 py-4 rounded-xl font-bold transition-colors"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {step === 1 ? 'Carrito de Compras' : step === 2 ? 'Finalizar Compra' : '¡Pedido Confirmado!'}
      </h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column - Content based on step */}
        <div className="flex-grow">
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {cart.map(item => (
                  <li key={item.id} className="p-6 flex flex-col sm:flex-row items-center gap-6">
                    <img 
                      src={item.image_url || 'https://placehold.co/100x100?text=Producto'} 
                      alt={item.name} 
                      className="w-24 h-24 object-cover rounded-xl bg-[#F4F4F4]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-grow text-center sm:text-left">
                      <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">${item.price.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-[#F4F4F4] text-gray-600 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-medium text-gray-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-[#F4F4F4] text-gray-600 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="w-24 text-right font-bold text-lg text-[#0F158F]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 2 && (
            <form id="checkout-form" onSubmit={handleCheckout} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Datos del Comercio y Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Razón Social del Comercio</label>
                    <input 
                      type="text" 
                      required
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] focus:border-transparent outline-none transition-all"
                      placeholder="Nombre del negocio / comercio"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Cliente / Encargado</label>
                    <input 
                      type="text" 
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] focus:border-transparent outline-none transition-all"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">RIF o Cédula del Comercio</label>
                    <input 
                      type="text" 
                      required
                      value={customerIdNumber}
                      onChange={e => setCustomerIdNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] focus:border-transparent outline-none transition-all"
                      placeholder="Ej. J-12345678-9"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección o Referencia</label>
                    <textarea 
                      required
                      rows={2}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] focus:border-transparent outline-none transition-all"
                      placeholder="Dirección exacta para el despacho"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de Contacto</label>
                    <input 
                      type="tel" 
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] focus:border-transparent outline-none transition-all"
                      placeholder="Ej. 0414-1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendedor (Nombre o Código)</label>
                    <input 
                      type="text" 
                      required
                      value={sellerNameCode}
                      onChange={e => setSellerNameCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] focus:border-transparent outline-none transition-all"
                      placeholder="Quién le atendió"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Método de Pago</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <label className={`
                    relative flex items-center p-4 cursor-pointer rounded-xl border-2 transition-all
                    ${paymentMethod === 'contado' ? 'border-[#0F158F] bg-blue-50' : 'border-gray-200 hover:border-blue-200'}
                  `}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="contado"
                      checked={paymentMethod === 'contado'}
                      onChange={() => setPaymentMethod('contado')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${paymentMethod === 'contado' ? 'bg-[#0F158F] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Banknote className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">De Contado</p>
                        <p className="text-sm text-gray-500">Efectivo / Divisas</p>
                      </div>
                    </div>
                  </label>

                  <label className={`
                    relative flex items-center p-4 cursor-pointer rounded-xl border-2 transition-all
                    ${paymentMethod === 'credito' ? 'border-[#0F158F] bg-blue-50' : 'border-gray-200 hover:border-blue-200'}
                  `}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="credito"
                      checked={paymentMethod === 'credito'}
                      onChange={() => setPaymentMethod('credito')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${paymentMethod === 'credito' ? 'bg-[#0F158F] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">A Crédito</p>
                        <p className="text-sm text-gray-500">Pago posterior</p>
                      </div>
                    </div>
                  </label>

                  <label className={`
                    relative flex items-center p-4 cursor-pointer rounded-xl border-2 transition-all
                    ${paymentMethod === 'pago_movil' ? 'border-[#0F158F] bg-blue-50' : 'border-gray-200 hover:border-blue-200'}
                  `}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="pago_movil"
                      checked={paymentMethod === 'pago_movil'}
                      onChange={() => setPaymentMethod('pago_movil')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${paymentMethod === 'pago_movil' ? 'bg-[#0F158F] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Pago Móvil</p>
                        <p className="text-sm text-gray-500">Inmediato</p>
                      </div>
                    </div>
                  </label>

                  <label className={`
                    relative flex items-center p-4 cursor-pointer rounded-xl border-2 transition-all
                    ${paymentMethod === 'transferencia' ? 'border-[#0F158F] bg-blue-50' : 'border-gray-200 hover:border-blue-200'}
                  `}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="transferencia"
                      checked={paymentMethod === 'transferencia'}
                      onChange={() => setPaymentMethod('transferencia')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${paymentMethod === 'transferencia' ? 'bg-[#0F158F] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Banknote className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Transferencia</p>
                        <p className="text-sm text-gray-500">Bancos Nacionales</p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="bg-[#F4F4F4] p-6 rounded-xl border border-gray-200 mb-6">
                  <h4 className="font-bold text-gray-900 mb-4">Instrucciones de pago:</h4>
                  {paymentMethod === 'pago_movil' ? (
                    <ul className="space-y-2 text-gray-600">
                      <li><span className="font-medium">Banco:</span> Banesco (0134)</li>
                      <li><span className="font-medium">Teléfono:</span> 0414-1234567</li>
                      <li><span className="font-medium">RIF:</span> J-12345678-9</li>
                      <li><span className="font-medium">Monto a pagar:</span> ${(finalTotal).toFixed(2)} / Bs. {(finalTotal * bcvRate).toFixed(2)}</li>
                    </ul>
                  ) : paymentMethod === 'transferencia' ? (
                    <ul className="space-y-2 text-gray-600">
                      <li><span className="font-medium">Banco:</span> Provincial (0108)</li>
                      <li><span className="font-medium">Cuenta:</span> 0108-xxxx-xxxx-xxxx-xxxx</li>
                      <li><span className="font-medium">Nombre:</span> ALLPROSUM 33 C.A</li>
                      <li><span className="font-medium">RIF:</span> J-12345678-9</li>
                      <li><span className="font-medium">Monto a pagar:</span> ${(finalTotal).toFixed(2)} / Bs. {(finalTotal * bcvRate).toFixed(2)}</li>
                    </ul>
                  ) : paymentMethod === 'contado' ? (
                    <p className="text-gray-600">
                      Por favor, coordine la entrega del efectivo con su vendedor asignado o en nuestra sede física.
                      <br /><span className="font-bold text-[#0F158F]">Monto: ${finalTotal.toFixed(2)}</span>
                    </p>
                  ) : (
                    <p className="text-gray-600">
                      Su pedido será procesado bajo la modalidad de crédito. Sujeto a aprobación previa por el departamento de cobranzas.
                      <br /><span className="font-bold text-[#0F158F]">Monto: ${finalTotal.toFixed(2)}</span>
                    </p>
                  )}
                </div>

                {(paymentMethod === 'pago_movil' || paymentMethod === 'transferencia') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Número de Referencia</label>
                      <input 
                        type="text" 
                        required
                        value={paymentReference}
                        onChange={e => setPaymentReference(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F158F] focus:border-transparent outline-none transition-all"
                        placeholder="Últimos 6 dígitos de la referencia"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comprobante de Pago (Captura - Opcional)</label>
                      <div 
                        {...getRootProps()} 
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[#0F158F] bg-blue-50' : 'border-gray-300 hover:border-[#0F158F] hover:bg-[#F4F4F4]'}`}
                      >
                        <input {...getInputProps()} />
                        {paymentReceipt ? (
                          <div className="flex flex-col items-center">
                            <img src={paymentReceipt} alt="Comprobante" className="h-32 object-contain mb-4 rounded-lg shadow-sm" />
                            <p className="text-sm text-green-600 font-bold">¡Imagen cargada correctamente!</p>
                            <p className="text-xs text-gray-500 mt-1">Haz clic o arrastra otra imagen para cambiarla</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-700 font-medium mb-1">Arrastra y suelta tu captura aquí</p>
                            <p className="text-sm text-gray-500">o haz clic para seleccionar el archivo</p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Por favor, realice el pago y luego ingrese el número de referencia y la captura para confirmar su pedido.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 text-green-500 mb-6">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Pedido en Espera de Confirmación!</h2>
              <p className="text-xl text-gray-600 mb-8">
                Su número de orden es: <span className="font-bold text-[#0F158F]">#{orderId}</span>
              </p>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Hemos recibido su pedido. 
                Estaremos verificando la transacción y nos comunicaremos con usted a la brevedad para confirmar su compra.
              </p>
              <div className="bg-blue-50 text-[#0F158F] p-6 rounded-xl mb-8 max-w-md mx-auto text-sm">
                <p className="font-bold mb-2">¿Qué sigue?</p>
                <p>Tu pago está siendo verificado. Te notificaremos una vez que sea aprobado para proceder con el envío.</p>
              </div>
              <Link 
                to="/" 
                className="inline-block bg-[#0F158F] hover:bg-blue-900 text-white px-8 py-4 rounded-xl font-bold transition-colors"
              >
                Volver a la tienda
              </Link>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        {step !== 3 && (
          <div className="lg:w-96 flex-shrink-0">
            <div className="bg-[#F4F4F4] rounded-2xl p-8 sticky top-24 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Resumen del Pedido</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${cartSubtotal.toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Descuento (Contado)</span>
                    <span>-${totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span>Por calcular</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6 mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-gray-900">Total USD</span>
                  <span className="text-3xl font-black text-[#D8121B]">${finalTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Total Bs. (Tasa BCV: {bcvRate})</span>
                  <span className="text-xl font-bold text-gray-700">Bs. {(finalTotal * bcvRate).toFixed(2)}</span>
                </div>
              </div>

              {step === 1 ? (
                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-[#D8121B] hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-red-500/30"
                >
                  Proceder al Pago
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    const form = document.getElementById('checkout-form') as HTMLFormElement;
                    if (form) {
                      if (form.checkValidity()) {
                        handleCheckout({ preventDefault: () => {} } as React.FormEvent);
                      } else {
                        form.reportValidity();
                      }
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-[#D8121B] hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-red-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    'Confirmar Pedido'
                  )}
                </button>
              )}
              
              {step === 2 && (
                <button 
                  onClick={() => setStep(1)}
                  className="w-full mt-4 bg-white border border-gray-300 hover:bg-[#F4F4F4] text-gray-700 py-4 rounded-xl font-bold transition-colors"
                >
                  Volver al Carrito
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Dummy ShoppingCart icon for empty state
function ShoppingCart(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}
