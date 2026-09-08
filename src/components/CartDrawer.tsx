import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, MessageCircle, Copy, Check, ArrowRight, Truck, CheckCircle2 } from 'lucide-react';
import { CartItem, CustomerOrderInfo, Currency } from '../types';
import { saveOrderToFirestore } from '../services/storeService';
import { formatUSD, formatNIO, usdToNio } from '../utils/currency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  whatsAppNumber: string;
  onOrderSaved?: (orderCode: string) => void;
  currency?: Currency;
  exchangeRate?: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  whatsAppNumber,
  onOrderSaved,
  currency = 'USD',
  exchangeRate = 36.8,
}) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerOrderInfo>({
    name: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
    paymentMethod: 'Transferencia',
  });
  const [copied, setCopied] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOrderCode, setLastOrderCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalNIO = usdToNio(totalAmount, exchangeRate);

  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '');

  // Format WhatsApp message
  const generateWhatsAppMessage = (orderCode?: string) => {
    let msg = `*¡Hola VariedadesCS! Me gustaría realizar el siguiente pedido`;
    if (orderCode) {
      msg += ` (#${orderCode})`;
    }
    msg += `:*\n\n`;

    if (orderCode) {
      msg += `🔖 *CÓDIGO DE PEDIDO:* #${orderCode}\n\n`;
    }

    msg += `🛍️ *PRODUCTOS SELECCIONADOS:*\n`;

    items.forEach((item, idx) => {
      const sizeStr = item.selectedSize ? ` [Talla: ${item.selectedSize}]` : '';
      const colorStr = item.selectedColor ? ` [Color: ${item.selectedColor}]` : '';
      const itemSubtotalUSD = (item.product.price * item.quantity).toFixed(2);
      const itemSubtotalNIO = usdToNio(item.product.price * item.quantity, exchangeRate).toFixed(0);
      msg += `${idx + 1}. *${item.quantity}x* ${item.product.name}${sizeStr}${colorStr}\n   Precio: $${item.product.price.toFixed(2)} (C$ ${usdToNio(item.product.price, exchangeRate).toFixed(0)}) c/u → *$${itemSubtotalUSD} USD / C$ ${itemSubtotalNIO}*\n`;
    });

    msg += `\n💵 *TOTAL DEL PEDIDO: $${totalAmount.toFixed(2)} USD (C$ ${totalNIO.toFixed(2)} Córdobas)*\n`;
    msg += `📊 _Tasa de cambio aplicada: 1 USD = C$ ${exchangeRate.toFixed(2)}_\n\n`;

    if (customerInfo.name || customerInfo.city || customerInfo.address) {
      msg += `📋 *DATOS DE ENTREGA:*\n`;
      if (customerInfo.name) msg += `👤 *Cliente:* ${customerInfo.name}\n`;
      if (customerInfo.phone) msg += `📱 *Teléfono:* ${customerInfo.phone}\n`;
      if (customerInfo.city) msg += `🏙️ *Ciudad:* ${customerInfo.city}\n`;
      if (customerInfo.address) msg += `📍 *Dirección:* ${customerInfo.address}\n`;
      if (customerInfo.paymentMethod) msg += `💳 *Método de pago preferido:* ${customerInfo.paymentMethod}\n`;
      if (customerInfo.notes) msg += `📝 *Nota adicional:* ${customerInfo.notes}\n`;
      msg += `\n`;
    }

    msg += `¿Podrían confirmarme disponibilidad para proceder con el pago y envío? ¡Muchas gracias!`;
    return msg;
  };

  const handleSendWhatsApp = async () => {
    if (items.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    let assignedCode = '';
    try {
      // Save order record to Firebase Firestore
      const res = await saveOrderToFirestore(items, customerInfo, totalAmount);
      assignedCode = res.orderCode;
      setLastOrderCode(assignedCode);
      if (onOrderSaved) {
        onOrderSaved(assignedCode);
      }
    } catch (err) {
      console.warn('Could not save to Firestore, continuing with direct WhatsApp:', err);
    } finally {
      setIsSubmitting(false);
    }

    const text = generateWhatsAppMessage(assignedCode || undefined);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = () => {
    const text = generateWhatsAppMessage(lastOrderCode || undefined);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="cart-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end transition-opacity"
      onClick={onClose}
    >
      <div
        id="cart-drawer-panel"
        className="relative w-full max-w-md sm:max-w-lg bg-[#f7f1e8] h-full shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#20201e] text-white flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="display-font text-xl sm:text-2xl font-bold text-[#20201e]">
                Tu Carrito
              </h2>
              <span className="text-xs text-stone-500 font-medium">
                {items.length} {items.length === 1 ? 'producto' : 'productos'} añadidos
              </span>
            </div>
          </div>

          <button
            id="close-cart-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-stone-200 flex items-center justify-center text-stone-400 mb-4">
                <ShoppingBag className="w-10 h-10 stroke-1" />
              </div>
              <h3 className="display-font text-2xl font-bold text-[#20201e]">
                Tu carrito está vacío
              </h3>
              <p className="text-sm text-stone-600 mt-2 max-w-xs mx-auto">
                Explora nuestras colecciones y añade las prendas o accesorios que más te gusten.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-3 rounded-full bg-[#20201e] text-white font-bold text-sm shadow-md hover:bg-[#ce5d45] transition-colors inline-flex items-center gap-2"
              >
                <span>Ver catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Product list */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${index}`}
                    className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3.5"
                  >
                    {/* Thumbnail */}
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-20 rounded-xl object-cover bg-stone-100 shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[#20201e] truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                        {item.selectedSize && <span>Talla: <strong>{item.selectedSize}</strong></span>}
                        {item.selectedColor && <span>Color: <strong>{item.selectedColor}</strong></span>}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-black text-[#20201e]">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-[11px] font-bold text-[#ce5d45] block">
                            C$ {usdToNio(item.product.price * item.quantity, exchangeRate).toFixed(0)}
                          </span>
                        </div>

                        {/* Quantity adjust buttons */}
                        <div className="flex items-center border border-stone-300 rounded-full bg-stone-50 px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                            className="w-6 h-6 rounded-full text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold text-xs"
                            title="Disminuir"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-[#20201e]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                            className="w-6 h-6 rounded-full text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold text-xs"
                            title="Aumentar"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-stone-400 hover:text-red-600 p-1.5 transition-colors self-start"
                      title="Eliminar del carrito"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Clear Cart link */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={onClearCart}
                  className="text-xs text-stone-500 hover:text-red-600 underline font-medium"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Delivery Data Accordion / Form */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowCheckoutForm(!showCheckoutForm)}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-700"
                >
                  <span>¿Deseas agregar tus datos de entrega?</span>
                  <span className="text-[#ce5d45]">{showCheckoutForm ? 'Ocultar' : 'Agregar'}</span>
                </button>

                {showCheckoutForm && (
                  <div className="mt-3 space-y-2.5 pt-2 border-t border-stone-100 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Tu Nombre Completo:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: María Pérez"
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, name: e.target.value })
                        }
                        className="w-full text-xs p-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#20201e]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Ciudad / Municipio:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Valencia, Caracas..."
                          value={customerInfo.city}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, city: e.target.value })
                          }
                          className="w-full text-xs p-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#20201e]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Método de Pago:
                        </label>
                        <select
                          value={customerInfo.paymentMethod}
                          onChange={(e) =>
                            setCustomerInfo({
                              ...customerInfo,
                              paymentMethod: e.target.value as any,
                            })
                          }
                          className="w-full text-xs p-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#20201e]"
                        >
                          <option value="Transferencia">Transferencia</option>
                          <option value="Pago Móvil">Pago Móvil</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Por coordinar">Por coordinar</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Dirección o Punto de referencia:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Urb. Las Acacias, Calle 2 casa 14"
                        value={customerInfo.address}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, address: e.target.value })
                        }
                        className="w-full text-xs p-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#20201e]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Notas especiales (Opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Es para un regalo de cumpleaños..."
                        value={customerInfo.notes}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, notes: e.target.value })
                        }
                        className="w-full text-xs p-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#20201e]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer / Checkout */}
        {items.length > 0 && (
          <div className="p-5 sm:p-6 bg-white border-t border-stone-200 space-y-3.5 shadow-lg">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} ítems):</span>
                <span className="font-bold text-stone-800">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-stone-500">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#d89c35]" /> Envío nacional / local:
                </span>
                <span className="text-emerald-700 font-semibold">A coordinar por WhatsApp</span>
              </div>
              <div className="flex justify-between items-baseline text-base font-black text-[#20201e] pt-2 border-t border-stone-100">
                <span>Total estimado:</span>
                <div className="text-right">
                  <span className="text-xl font-black text-[#20201e]">{formatUSD(totalAmount)}</span>
                  <span className="text-xs font-bold text-[#ce5d45] block">
                    {formatNIO(totalNIO)}
                  </span>
                </div>
              </div>
            </div>

            {lastOrderCode && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pedido #{lastOrderCode} guardado en Firebase
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  Firestore
                </span>
              </div>
            )}

            {/* Send WhatsApp Order Button */}
            <button
              id="send-whatsapp-order-btn"
              onClick={handleSendWhatsApp}
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-full bg-[#25D366] text-white font-bold text-sm shadow-xl hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2.5 disabled:opacity-75"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>{isSubmitting ? 'Guardando en Firebase...' : 'Enviar Pedido por WhatsApp'}</span>
            </button>

            {/* Copy order button */}
            <button
              id="copy-order-btn"
              onClick={handleCopyMessage}
              className="w-full py-2.5 px-4 rounded-full border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">¡Texto de pedido copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span>Copiar resumen de la compra</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
