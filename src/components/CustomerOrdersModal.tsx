import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Clock,
  CheckCircle2,
  RefreshCw,
  MessageCircle,
  Search,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { FirestoreOrder } from '../types';
import { formatNIO } from '../utils/currency';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  allOrders: FirestoreOrder[];
  whatsAppNumber: string;
  onOpenAdminLogin?: () => void;
}

interface LocalClientOrder {
  orderCode: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
    image?: string;
    barcode?: string;
  }>;
  total: number;
  totalNIO?: number;
  date: string;
  customer?: {
    name?: string;
    phone?: string;
    city?: string;
    address?: string;
    paymentMethod?: string;
  };
  status?: string;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
  allOrders,
  whatsAppNumber,
  onOpenAdminLogin,
}) => {
  const [localOrders, setLocalOrders] = useState<LocalClientOrder[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [activeTab, setActiveTab] = useState<'my_orders' | 'track'>('my_orders');

  const cleanPhone = whatsAppNumber.replace(/\D/g, '') || '50585062737';

  // Load orders stored in this device
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('variedadescs_client_orders');
        if (stored) {
          setLocalOrders(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Could not read local client orders:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Resolve status for an order code using live Firestore data first, then fallback to local
  const getLiveOrderData = (code: string) => {
    const live = allOrders.find(
      (o) => o.orderCode.toLowerCase() === code.toLowerCase() || o.id === code
    );
    return live || null;
  };

  const searchedLiveOrder = searchCode.trim()
    ? allOrders.find(
        (o) =>
          o.orderCode.toLowerCase() === searchCode.trim().toLowerCase() ||
          o.id.toLowerCase() === searchCode.trim().toLowerCase()
      )
    : null;

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'completado':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Venta Confirmada & Lista</span>
          </span>
        );
      case 'en_proceso':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>En Preparación</span>
          </span>
        );
      case 'nuevo':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Recibido • Pendiente</span>
          </span>
        );
    }
  };

  const handleWhatsAppInquiry = (orderCode: string, customerName?: string) => {
    const msg = `¡Hola VariedadesCS! 👋 Quisiera consultar el estado de mi compra *#${orderCode}* a nombre de ${customerName || 'mi persona'}. ¿Podrían confirmarme los detalles de entrega? ¡Muchas gracias!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="customer-orders-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="customer-orders-panel"
        className="relative w-full max-w-lg bg-[#f7f1e8] rounded-3xl shadow-2xl border border-stone-300 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ce5d45] text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="display-font text-xl font-bold text-[#20201e]">
                Mis Compras & Pedidos
              </h2>
              <p className="text-[11px] text-stone-500">
                Consulta y rastrea el estado de tus compras en VariedadesCS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
            aria-label="Cerrar modal de pedidos"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: Mis Compras / Rastrear con Código */}
        <div className="flex border-b border-stone-200 bg-stone-100/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('my_orders')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my_orders'
                ? 'bg-white text-[#20201e] shadow-xs'
                : 'text-stone-600 hover:text-[#20201e]'
            }`}
          >
            Mis Compras Recientes {localOrders.length > 0 && `(${localOrders.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'track'
                ? 'bg-white text-[#20201e] shadow-xs'
                : 'text-stone-600 hover:text-[#20201e]'
            }`}
          >
            Rastrear con Código
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'track' ? (
            /* Track by code view */
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <label className="block text-xs font-bold text-stone-700">
                  Ingresa tu número o código de pedido (ej: VCS-4819):
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      placeholder="Ej: VCS-1234"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-mono font-bold uppercase focus:outline-none focus:border-[#ce5d45]"
                    />
                  </div>
                </div>
              </div>

              {searchedLiveOrder ? (
                <div className="bg-white p-4 rounded-2xl border border-stone-300 shadow-md space-y-3 animate-in fade-in">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Código de Pedido
                      </span>
                      <p className="font-mono text-base font-black text-[#20201e]">
                        #{searchedLiveOrder.orderCode}
                      </p>
                    </div>
                    <div>{renderStatusBadge(searchedLiveOrder.status)}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                    <p className="text-stone-700">
                      <strong>Cliente:</strong> {searchedLiveOrder.customer.name}
                    </p>
                    {searchedLiveOrder.customer.city && (
                      <p className="text-stone-600">
                        <strong>Ciudad:</strong> {searchedLiveOrder.customer.city}
                      </p>
                    )}
                    <p className="text-stone-700 font-bold text-sm text-[#ce5d45] pt-1">
                      Total: ${searchedLiveOrder.total.toFixed(2)}{' '}
                      {searchedLiveOrder.totalNIO && (
                        <span className="text-xs text-stone-500 font-normal">
                          / {formatNIO(searchedLiveOrder.totalNIO)}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Items preview */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Prendas & Artículos ({searchedLiveOrder.items.length}):
                    </span>
                    <div className="divide-y divide-stone-100">
                      {searchedLiveOrder.items.map((it, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {it.image && (
                              <img
                                src={it.image}
                                alt={it.name}
                                className="w-8 h-8 rounded-lg object-cover border border-stone-200"
                              />
                            )}
                            <div>
                              <p className="font-bold text-stone-800 leading-tight">{it.name}</p>
                              <p className="text-[10px] text-stone-500">
                                {it.selectedSize && `Talla ${it.selectedSize} • `}Cant: {it.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold font-mono text-stone-700">
                            ${(it.price * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleWhatsAppInquiry(searchedLiveOrder.orderCode, searchedLiveOrder.customer.name)
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Consultar entrega por WhatsApp</span>
                  </button>
                </div>
              ) : searchCode.trim() ? (
                <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center space-y-2">
                  <Package className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs font-bold text-stone-700">
                    No encontramos el pedido "{searchCode}"
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Verifica que el código esté bien escrito o escríbenos a WhatsApp para ayudarte.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            /* My Orders List View */
            <div className="space-y-3">
              {localOrders.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#ce5d45] flex items-center justify-center mx-auto border border-amber-200">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#20201e]">Aún no tienes compras guardadas</h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Cuando realices un pedido por el carrito de WhatsApp, quedará guardado automáticamente aquí para que puedas ver su estado.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-[#20201e] hover:bg-[#ce5d45] text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                localOrders.map((order, idx) => {
                  const live = getLiveOrderData(order.orderCode);
                  const status = live?.status || order.status || 'nuevo';
                  const dateFormatted = order.date
                    ? new Date(order.date).toLocaleDateString('es-NI', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Reciente';

                  return (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-black text-[#20201e]">
                              #{order.orderCode}
                            </span>
                            <span className="text-[10px] text-stone-400 font-medium">
                              • {dateFormatted}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            {order.items?.length || 0} producto(s)
                          </p>
                        </div>
                        <div>{renderStatusBadge(status)}</div>
                      </div>

                      {/* Items thumbnails */}
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {order.items?.map((it, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="w-12 h-12 rounded-xl border border-stone-200 bg-stone-50 overflow-hidden shrink-0 relative"
                            title={`${it.name} (x${it.quantity})`}
                          >
                            {it.image ? (
                              <img
                                src={it.image}
                                alt={it.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px]">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            {it.quantity > 1 && (
                              <span className="absolute bottom-0 right-0 bg-[#20201e] text-white text-[9px] font-black px-1 rounded-tl-md">
                                x{it.quantity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Total & WhatsApp Button */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold block uppercase">
                            Total Pagado / Acordado:
                          </span>
                          <span className="text-sm font-bold font-mono text-[#ce5d45]">
                            ${order.total.toFixed(2)}{' '}
                            {order.totalNIO && (
                              <span className="text-xs text-stone-500 font-normal">
                                / {formatNIO(order.totalNIO)}
                              </span>
                            )}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleWhatsAppInquiry(order.orderCode, order.customer?.name)
                          }
                          className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-[#25D366] hover:text-white text-[#20201e] text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366] group-hover:text-white" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-white border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <p className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tus compras están respaldadas y sincronizadas con VariedadesCS</span>
          </p>
          {onOpenAdminLogin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminLogin();
              }}
              className="text-stone-400 hover:text-stone-700 underline text-[10px]"
            >
              Acceso Administrador
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
