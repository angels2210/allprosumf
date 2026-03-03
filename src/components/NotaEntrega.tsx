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
    const notaNum = order.id ? `NE${String(order.id).padStart(5, '0')}` : 'BORRADOR';
    const fechaStr = new Date(order.created_at || new Date()).toLocaleDateString('es-VE');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    const venceStr = dueDate.toLocaleDateString('es-VE');
    const totalBs = (order.total * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const emptyRows = Math.max(0, 5 - (order.items?.length || 0));

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="Logo" style="height:60px;object-fit:contain;display:block;margin-bottom:4px;" />`
      : `<div style="font-size:20px;font-weight:900;color:#0F158F;">ALLPROSUM 33 C.A</div>`;

    const itemsHtml = (order.items || []).map((item: any) => `
      <tr>
        <td style="padding:6px 4px;text-align:center;border:1px solid #d1d5db;">${item.quantity}</td>
        <td style="padding:6px 8px;text-align:center;border:1px solid #d1d5db;text-transform:uppercase;">${item.product_name}</td>
        <td style="padding:6px 4px;text-align:center;border:1px solid #d1d5db;">$${Number(item.price).toFixed(2)}</td>
        <td style="padding:6px 4px;text-align:center;border:1px solid #d1d5db;font-weight:bold;">$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
      </tr>
    `).join('');

    const emptyRowsHtml = Array(emptyRows).fill(`
      <tr style="height:28px;">
        <td style="border:1px solid #e5e7eb;"></td>
        <td style="border:1px solid #e5e7eb;"></td>
        <td style="border:1px solid #e5e7eb;"></td>
        <td style="border:1px solid #e5e7eb;"></td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Nota de Entrega - ${notaNum}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: white; padding: 16px; }
    @page { size: Letter portrait; margin: 10mm 14mm; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
    <div>
      ${logoHtml}
      <div style="font-size:9px;color:#6b7280;font-weight:bold;text-transform:uppercase;">Tu Mejor Aliado Comercial</div>
      <div style="font-size:11px;font-weight:bold;margin-top:4px;">J-507568458</div>
    </div>
    <div style="text-align:right;font-size:11px;line-height:1.8;">
      <div><b>Fecha:</b> ${fechaStr}</div>
      <div><b>Vence:</b> ${venceStr}</div>
      <div><b>Nota:</b> ${notaNum}</div>
    </div>
  </div>

  <table style="margin-bottom:12px;border:1px solid #d1d5db;font-size:10px;">
    <tr>
      <td style="padding:5px 8px;border:1px solid #d1d5db;width:50%;">
        <div style="font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:bold;">Razón Social / Comercio</div>
        <div style="font-weight:bold;">${order.business_name || order.customer_name || '-'}</div>
      </td>
      <td style="padding:5px 8px;border:1px solid #d1d5db;width:50%;">
        <div style="font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:bold;">RIF / Cédula</div>
        <div style="font-weight:bold;">${order.customer_id_type || ''}${order.customer_id_number || '-'}</div>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="padding:5px 8px;border:1px solid #d1d5db;">
        <div style="font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:bold;">Dirección de Entrega</div>
        <div>${order.address || '-'}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:5px 8px;border:1px solid #d1d5db;">
        <div style="font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:bold;">Atención a</div>
        <div style="font-weight:bold;">${order.customer_name || '-'}</div>
      </td>
      <td style="padding:5px 8px;border:1px solid #d1d5db;">
        <div style="font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:bold;">Teléfono Contacto</div>
        <div style="font-weight:bold;">${order.customer_phone || '-'}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:5px 8px;border:1px solid #d1d5db;">
        <div style="font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:bold;">Condición de Pago</div>
        <div style="font-weight:900;color:#D8121B;text-transform:uppercase;">${(order.payment_method || '').replace('_', ' ')}</div>
      </td>
      <td style="padding:5px 8px;border:1px solid #d1d5db;">
        <div style="font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:bold;">Vendedor</div>
        <div style="font-weight:bold;">${order.seller_name_code || '-'}</div>
      </td>
    </tr>
  </table>

  <div style="text-align:center;font-weight:bold;background:#f3f4f6;padding:5px;text-transform:uppercase;letter-spacing:3px;font-size:11px;margin-bottom:8px;border:1px solid #e5e7eb;">
    Nota de Entrega
  </div>

  <table style="font-size:11px;">
    <thead>
      <tr style="background:#f9fafb;">
        <th style="padding:6px 4px;text-align:center;border:1px solid #d1d5db;font-size:9px;text-transform:uppercase;width:80px;">Unidades</th>
        <th style="padding:6px 8px;text-align:center;border:1px solid #d1d5db;font-size:9px;text-transform:uppercase;">Descripción</th>
        <th style="padding:6px 4px;text-align:center;border:1px solid #d1d5db;font-size:9px;text-transform:uppercase;width:100px;">Precio Unit.</th>
        <th style="padding:6px 4px;text-align:center;border:1px solid #d1d5db;font-size:9px;text-transform:uppercase;width:100px;">Total USD</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
      ${emptyRowsHtml}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="border:1px solid #d1d5db;padding:5px 8px;"></td>
        <td style="border:1px solid #d1d5db;padding:5px 4px;text-align:right;font-weight:bold;font-size:9px;text-transform:uppercase;background:#f9fafb;">Sub Total</td>
        <td style="border:1px solid #d1d5db;padding:5px 4px;text-align:center;font-weight:bold;">$${Number(order.total).toFixed(2)}</td>
      </tr>
      <tr style="background:#f3f4f6;">
        <td colspan="2" style="border:1px solid #d1d5db;padding:5px 8px;font-size:9px;font-style:italic;color:#6b7280;">
          Tasa BCV Referencial: <b>${bcvRate.toFixed(2)} Bs/$</b>
        </td>
        <td style="border:1px solid #d1d5db;padding:5px 4px;text-align:right;font-weight:900;font-size:10px;text-transform:uppercase;color:#D8121B;">Total Bs.</td>
        <td style="border:1px solid #d1d5db;padding:5px 4px;text-align:center;font-weight:900;font-size:14px;color:#D8121B;">${totalBs}</td>
      </tr>
    </tfoot>
  </table>

  <div style="margin-top:32px;text-align:center;">
    <div style="width:180px;border-top:1px solid #111;margin:0 auto 4px auto;"></div>
    <div style="font-size:10px;font-weight:bold;text-transform:uppercase;">Recibido</div>
  </div>

  <div style="margin-top:16px;border-top:1px solid #e5e7eb;padding-top:8px;text-align:center;font-size:9px;color:#6b7280;line-height:1.8;">
    <div>El pago debe ser realizado a la tasa BCV del día a cancelar.</div>
    <div style="font-weight:bold;color:#374151;">ALLPROSUM 33 C.A / J-507568458</div>
    <div>Pago Móvil: 0414-2920094 / CL. 20978548 / MERCANTIL</div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=850,height=750');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
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
