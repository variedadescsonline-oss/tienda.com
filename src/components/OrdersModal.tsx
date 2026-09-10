import React, { useState } from 'react';
import { X, Package, Clock, CheckCircle2, AlertCircle, MessageCircle, RefreshCw, Check } from 'lucide-react';
import { FirestoreOrder } from '../types';
import { updateOrderStatus, confirmOrderSale } from '../services/storeService';
import { DEFAULT_EXCHANGE_RATE } from '../utils/currency';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: FirestoreOrder[];
  loading?: boolean;
  exchangeRate?: number;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  loading = false,
  exchangeRate = DEFAULT_EXCHANGE_RATE,
}) => {
  const [filter, setFilter] = useState<'all' | 'nuevo' | 'en_proceso' | 'completado'>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmingSaleId, setConfirmingSaleId] = useState<string | null>(null);
  const [confirmedNotice, setConfirmedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const matchesSearch =
      o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer.phone && o.customer.phone.includes(search));
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (orderId: string, newStatus: FirestoreOrder['status']) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.error('Error updating order status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmSale = async (order: FirestoreOrder) => {
    try {
      setConfirmingSaleId(order.id);
      await confirmOrderSale(order, exchangeRate);
      setConfirmedNotice(`¡Venta #${order.orderCode} confirmada exitosamente! Se descontó el inventario.`);
      setTimeout(() => setConfirmedNotice(null), 4000);
    } catch (e) {
      console.error('Error confirming sale:', e);
      alert('Error al confirmar la venta. Inténtalo de nuevo.');
    } finally {
      setConfirmingSaleId(null);
    }
  };

  const getStatusBadge = (status: FirestoreOrder['status']) => {
    switch (status) {
      case 'nuevo':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Nuevo</span>
          </span>
        );
      case 'en_proceso':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>En Proceso</span>
          </span>
        );
      case 'completado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completado</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      id="orders-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="orders-modal-panel"
        className="relative w-full max-w-4xl bg-[#f7f1e8] rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#20201e] text-white flex items-center justify-center shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="display-font text-xl sm:text-2xl font-bold text-[#20201e]">
                  Pedidos en Firebase
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                  Firestore Activo
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Registro en tiempo real de todos los pedidos recibidos por la web
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
            aria-label="Cerrar ventana de pedidos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and search bar */}
        <div className="p-4 bg-white/60 border-b border-stone-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'nuevo', 'en_proceso', 'completado'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filter === st
                    ? 'bg-[#20201e] text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {st === 'all'
                  ? `Todos (${orders.length})`
                  : st === 'nuevo'
                  ? `Nuevos (${orders.filter((o) => o.status === 'nuevo').length})`
                  : st === 'en_proceso'
                  ? `En proceso (${orders.filter((o) => o.status === 'en_proceso').length})`
                  : `Completados (${orders.filter((o) => o.status === 'completado').length})`}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por código, cliente o tlf..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#20201e]"
            />
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {confirmedNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{confirmedNotice}</span>
              </div>
              <button
                onClick={() => setConfirmedNotice(null)}
                className="text-stone-400 hover:text-stone-700 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-[#ce5d45] mx-auto mb-2" />
              <p className="text-xs text-stone-500">Cargando pedidos desde Firebase Firestore...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8">
              <Package className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="display-font text-lg font-bold text-[#20201e]">
                No hay pedidos registrados todavía
              </h3>
              <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                Cada vez que un cliente agregue productos al carrito y envíe su pedido por WhatsApp,
                se guardará automáticamente aquí en Firebase con su código y datos.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const cleanCustomerPhone = (order.customer.phone || '').replace(/[^0-9]/g, '');
              const customerWhatsAppUrl = cleanCustomerPhone
                ? `https://wa.me/${cleanCustomerPhone}?text=${encodeURIComponent(
                    `¡Hola ${order.customer.name}! Te escribimos de VariedadesCS respecto a tu pedido #${order.orderCode}.`
                  )}`
                : null;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm bg-stone-100 px-2.5 py-1 rounded-lg text-[#20201e]">
                        {order.orderCode}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Cambiar estado:</span>
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as FirestoreOrder['status'])
                        }
                        className="text-xs font-semibold py-1 px-2.5 rounded-lg bg-stone-50 border border-stone-300 focus:outline-none"
                      >
                        <option value="nuevo">Nuevo</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-600 bg-stone-50/70 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Cliente
                      </span>
                      <strong className="text-stone-800 text-xs sm:text-sm">
                        {order.customer.name || 'Cliente sin nombre'}
                      </strong>
                      {order.customer.phone && (
                        <p className="text-stone-600 mt-0.5">{order.customer.phone}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Ubicación & Entrega
                      </span>
                      <p className="text-stone-800 font-medium">
                        {order.customer.city || 'Ciudad por confirmar'}
                      </p>
                      {order.customer.address && (
                        <p className="text-stone-500 truncate" title={order.customer.address}>
                          {order.customer.address}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Pago & Total
                      </span>
                      <p className="font-bold text-[#20201e] text-sm">
                        ${order.total.toFixed(2)}{' '}
                        <span className="text-[11px] font-normal text-stone-500">
                          ({order.customer.paymentMethod || 'Transferencia'})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Items snapshot */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                      Artículos ({order.items.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50 border border-stone-100 text-xs"
                        >
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-10 h-10 rounded-lg object-cover bg-stone-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-stone-800 truncate">{item.productName}</p>
                            <p className="text-stone-500 text-[11px]">
                              {item.quantity}x • ${item.price.toFixed(2)}
                              {item.selectedSize && ` • Talla ${item.selectedSize}`}
                              {item.selectedColor && ` • ${item.selectedColor}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Confirm Sale and WhatsApp Contact */}
                  <div className="pt-2.5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      {order.status !== 'completado' ? (
                        <button
                          type="button"
                          disabled={confirmingSaleId === order.id}
                          onClick={() => handleConfirmSale(order)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#ce5d45] hover:bg-[#b54c35] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                        >
                          {confirmingSaleId === order.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Confirmando venta e inventario...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Confirmar Venta Realizada</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Venta Confirmada (Inventario Descontado)</span>
                        </div>
                      )}
                    </div>

                    {customerWhatsAppUrl && (
                      <a
                        href={customerWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-bold shadow-xs hover:brightness-105 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>Contactar por WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sincronización en vivo con Firebase Firestore
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#20201e] text-white font-bold hover:bg-[#ce5d45] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
