import React from 'react';
import { motion } from 'motion/react';
import { XCircle, Printer } from 'lucide-react';

interface NotaEntregaProps {
  order: any;
  onClose: () => void;
  onConfirm?: () => void;
  bcvRate: number;
  logoUrl?: string;
}

export default function NotaEntrega({ order, onClose, onConfirm, bcvRate, logoUrl }: NotaEntregaProps) {
  const handlePrint = () => {
    window.print();
  };

  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 7); // Default 7 days validity

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 no-print">
          <h2 className="text-xl font-bold text-gray-900">
            {onConfirm ? 'Previsualización de Nota de Entrega' : 'Nota de Entrega'}
          </h2>
          <div className="flex gap-2">
            {!onConfirm && (
              <button 
                onClick={handlePrint}
                className="bg-[#0F158F] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition-colors"
              >
                <Printer className="h-5 w-5" /> Imprimir
              </button>
            )}
            {onConfirm && (
              <button 
                onClick={onConfirm}
                className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-md"
              >
                Confirmar y Cargar Pedido
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-2">
              <XCircle className="h-8 w-8" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-8 bg-white print:p-0" id="printable-nota">
          <style>{`
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; margin: 0; }
              #printable-nota { padding: 0 !important; width: 100% !important; }
              .print-border { border: 1px solid #e5e7eb !important; }
            }
          `}</style>
          
          <div className="max-w-[800px] mx-auto border border-gray-200 p-8 rounded-lg print:border-0 print:p-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex flex-col">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-16 object-contain mb-2 self-start" />
                ) : (
                  <div className="text-2xl font-black text-[#0F158F] mb-1">ALLPROSUM 33 C.A</div>
                )}
                <div className="text-xs text-gray-500 font-bold">TU MEJOR ALIADO COMERCIAL</div>
                <div className="text-sm font-bold mt-2">J-507568458</div>
              </div>
              <div className="text-right text-sm space-y-1">
                <p><span className="font-bold">Fecha:</span> {new Date(order.created_at || new Date()).toLocaleDateString()}</p>
                <p><span className="font-bold">Vence:</span> {dueDate.toLocaleDateString()}</p>
                <p><span className="font-bold">Nota:</span> {order.id ? `NE${String(order.id).padStart(5, '0')}` : 'BORRADOR'}</p>
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] mb-6 border border-gray-200 p-4 rounded-md bg-gray-50/30">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-gray-500 font-bold">Razón Social / Comercio</span>
                <span className="font-bold text-gray-900">{order.business_name || order.customer_name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-gray-500 font-bold">RIF / Cédula</span>
                <span className="font-bold text-gray-900">{order.customer_id_number || '-'}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-[9px] uppercase text-gray-500 font-bold">Dirección de Entrega</span>
                <span className="font-medium text-gray-800">{order.address || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-gray-500 font-bold">Atención a</span>
                <span className="font-bold text-gray-900">{order.customer_name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-gray-500 font-bold">Teléfono Contacto</span>
                <span className="font-bold text-gray-900">{order.customer_phone}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-gray-500 font-bold">Condición de Pago</span>
                <span className="font-black text-[#D8121B] uppercase">{order.payment_method.replace('_', ' ')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-gray-500 font-bold">Vendedor</span>
                <span className="font-bold text-gray-900">{order.seller_name_code || '-'}</span>
              </div>
            </div>

            <div className="text-center font-bold bg-gray-100 py-1 mb-4 uppercase tracking-widest text-sm">
              Nota de Entrega
            </div>

            {/* Table */}
            <table className="w-full text-sm mb-8 border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="py-2 px-2 text-center font-bold uppercase text-[10px] border-r border-gray-300 w-24">Unidades</th>
                  <th className="py-2 px-4 text-center font-bold uppercase text-[10px] border-r border-gray-300">Descripción</th>
                  <th className="py-2 px-2 text-center font-bold uppercase text-[10px] border-r border-gray-300 w-28">Precio Unit.</th>
                  <th className="py-2 px-2 text-center font-bold uppercase text-[10px] w-28">Total USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-center border-r border-gray-200 font-medium">{item.quantity}</td>
                    <td className="py-2 px-4 text-center border-r border-gray-200 uppercase text-[11px]">{item.product_name}</td>
                    <td className="py-2 px-2 text-center border-r border-gray-200">${item.price.toFixed(2)}</td>
                    <td className="py-2 px-2 text-center font-bold">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                {/* Fill empty rows for aesthetic if needed */}
                {[...Array(Math.max(0, 12 - order.items.length))].map((_, i) => (
                  <tr key={`empty-${i}`} className="h-8 border-b border-gray-50">
                    <td className="border-r border-gray-100"></td>
                    <td className="border-r border-gray-100"></td>
                    <td className="border-r border-gray-100"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-300">
                  <td colSpan={2} className="border-r border-gray-200"></td>
                  <td className="py-2 px-2 text-right font-bold uppercase text-[10px] bg-gray-50 border-r border-gray-200">Sub Total</td>
                  <td className="py-2 px-2 text-center font-bold">${order.total.toFixed(2)}</td>
                </tr>
                <tr className="border-t border-gray-300 bg-gray-100">
                  <td colSpan={2} className="border-r border-gray-200 px-4 py-2 text-[10px] italic text-gray-600">
                    Tasa BCV Referencial: <span className="font-bold">{bcvRate.toFixed(2)} Bs/$</span>
                  </td>
                  <td className="py-2 px-2 text-right font-black uppercase text-[11px] border-r border-gray-200 text-[#D8121B]">Total Bs.</td>
                  <td className="py-2 px-2 text-center font-black text-lg text-[#D8121B]">
                    {(order.total * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Footer */}
            <div className="mt-12 flex flex-col items-center">
              <div className="w-48 border-t border-black mb-2"></div>
              <p className="text-xs font-bold uppercase">Recibido</p>
            </div>

            <div className="mt-12 text-[10px] text-gray-500 space-y-1 text-center border-t pt-4">
              <p>El pago debe ser realizado a la tasa BCV del día a cancelar.</p>
              <p className="font-bold text-gray-700">ALLPROSUM 33 C.A / J-507568458</p>
              <p>Pago Movil: 0414-2920094 / CL. 20978548 / MERCANTIL</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
