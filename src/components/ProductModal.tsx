import React, { useState } from 'react';
import { X, ShoppingBag, MessageCircle, Check, Heart, ShieldCheck, Truck, Barcode } from 'lucide-react';
import { Product, Currency } from '../types';
import { formatUSD, formatNIO, usdToNio } from '../utils/currency';
import { BarcodeRenderer } from './BarcodeRenderer';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, size?: string, color?: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  whatsAppNumber: string;
  currency?: Currency;
  exchangeRate?: number;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
  whatsAppNumber,
  currency = 'USD',
  exchangeRate = 36.8,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [justAdded, setJustAdded] = useState(false);

  React.useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
      setJustAdded(false);
    }
  }, [product]);

  if (!product) return null;

  const nioPrice = usdToNio(product.price, exchangeRate);
  const nioOriginal = product.originalPrice ? usdToNio(product.originalPrice, exchangeRate) : null;
  const totalUSD = product.price * quantity;
  const totalNIO = usdToNio(totalUSD, exchangeRate);

  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '');
  const productWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `¡Hola VariedadesCS! Me interesa el producto "${product.name}" ($${product.price.toFixed(
      2
    )} / C$ ${nioPrice.toFixed(0)})${selectedSize ? ` en talla ${selectedSize}` : ''}${
      selectedColor ? ` en color ${selectedColor}` : ''
    }. ¿Tienen disponibilidad inmediata?`
  )}`;

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedSize, selectedColor);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1800);
  };

  return (
    <div
      id="product-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="product-modal-container"
        className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-stone-700 hover:text-black flex items-center justify-center shadow-md transition-transform active:scale-95"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Column */}
        <div className="relative md:w-1/2 h-72 md:h-auto bg-stone-100 shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />
          {product.badge && (
            <span className="absolute top-4 left-4 rounded-full px-3 py-1 bg-[#20201e]/90 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
              {product.badge}
            </span>
          )}
          <button
            onClick={() => onToggleFavorite(product)}
            className="absolute bottom-4 left-4 w-9 h-9 rounded-full bg-white/90 text-stone-700 hover:text-[#ce5d45] flex items-center justify-center shadow-sm"
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-[#ce5d45] text-[#ce5d45]' : ''}`}
            />
          </button>
        </div>

        {/* Product Details Column */}
        <div className="p-6 sm:p-8 md:w-1/2 flex flex-col justify-between overflow-y-auto">
          <div>
            <span className="text-[#ce5d45] text-xs font-bold uppercase tracking-[0.16em]">
              {product.categoryLabel}
            </span>
            <h2 className="display-font text-2xl sm:text-3xl font-bold text-[#20201e] mt-1">
              {product.name}
            </h2>

            {/* Price Row */}
            <div className="mt-3 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-black text-[#20201e]">
                {currency === 'USD' ? formatUSD(product.price) : formatNIO(nioPrice)}
              </span>
              <span className="text-base font-bold text-[#ce5d45]">
                {currency === 'USD' ? formatNIO(nioPrice) : formatUSD(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-stone-400 line-through">
                  {currency === 'USD'
                    ? formatUSD(product.originalPrice)
                    : formatNIO(nioOriginal || 0)}
                </span>
              )}
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                En stock ({product.stock ?? 10} disp.)
              </span>
            </div>

            {/* Barcode Tag Preview inside modal */}
            {product.barcode && (
              <div className="mt-4 p-2.5 rounded-2xl bg-stone-50 border border-stone-200">
                <BarcodeRenderer
                  value={product.barcode}
                  productName={product.name}
                  priceUSD={product.price}
                  exchangeRate={exchangeRate}
                  height={32}
                  width={1.2}
                  showPrintButton={true}
                />
              </div>
            )}

            <p className="mt-4 text-sm text-stone-600 leading-relaxed">
              {product.description}
            </p>

            {/* Bullet Details */}
            {product.details && product.details.length > 0 && (
              <div className="mt-4 space-y-1.5 border-t border-stone-100 pt-3">
                {product.details.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-stone-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d89c35]" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-5">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Seleccionar Talla:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        selectedSize === size
                          ? 'bg-[#20201e] text-white border-[#20201e] shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Color / Variante:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        selectedColor === color
                          ? 'bg-[#20201e] text-white border-[#20201e] shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mt-5 flex items-center gap-4">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Cantidad:
              </label>
              <div className="inline-flex items-center border border-stone-300 rounded-full bg-stone-50 px-2 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-full bg-white text-stone-800 font-bold hover:bg-stone-200 flex items-center justify-center text-sm shadow-xs"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm text-[#20201e]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded-full bg-white text-stone-800 font-bold hover:bg-stone-200 flex items-center justify-center text-sm shadow-xs"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-stone-200/80 space-y-2.5">
            <button
              id="modal-add-to-cart-btn"
              onClick={handleAdd}
              disabled={justAdded}
              className={`w-full py-3.5 px-6 rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#20201e] text-white hover:bg-[#ce5d45]'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Añadido al Carrito!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    Añadir al Carrito • {formatUSD(totalUSD)} (C$ {totalNIO.toFixed(0)})
                  </span>
                </>
              )}
            </button>

            <a
              id="modal-ask-whatsapp-btn"
              href={productWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 rounded-full font-bold text-xs sm:text-sm text-[#20201e] border border-stone-300 hover:bg-stone-100 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
              <span>Consultar este producto por WhatsApp</span>
            </a>

            <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-[#d89c35]" /> Envíos asegurados
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#d89c35]" /> Calidad revisada
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
