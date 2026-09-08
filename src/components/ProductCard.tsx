import React from 'react';
import { ShoppingBag, Eye, Heart, Barcode } from 'lucide-react';
import { Product, Currency } from '../types';
import { formatUSD, formatNIO, usdToNio } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  currency?: Currency;
  exchangeRate?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
  currency = 'USD',
  exchangeRate = 36.8,
}) => {
  const nioPrice = usdToNio(product.price, exchangeRate);
  const nioOriginal = product.originalPrice ? usdToNio(product.originalPrice, exchangeRate) : null;
  return (
    <article
      id={`card-product-${product.id}`}
      data-category={product.category}
      className="group bg-white rounded-[1.5rem] border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1.5"
    >
      {/* Product Image Box */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-stone-100 cursor-pointer" onClick={() => onSelect(product)}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badge */}
        {product.badge && (
          <span className="absolute top-3.5 left-3.5 rounded-full px-3 py-1 bg-[#20201e]/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
            {product.badge}
          </span>
        )}

        {/* Favorite Button */}
        <button
          id={`favorite-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product);
          }}
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm text-stone-700 hover:text-[#ce5d45] flex items-center justify-center shadow-sm transition-transform active:scale-90"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-[#ce5d45] text-[#ce5d45]' : ''
            }`}
          />
        </button>

        {/* Quick View overlay trigger on desktop */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 text-[#20201e] text-xs font-bold shadow-md">
            <Eye className="w-3.5 h-3.5" />
            <span>Vista rápida</span>
          </span>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
        <div>
          <p className="text-[#ce5d45] text-[11px] font-extrabold uppercase tracking-[0.16em]">
            {product.categoryLabel}
          </p>

          <h3
            onClick={() => onSelect(product)}
            className="display-font mt-2 text-xl font-bold text-[#20201e] hover:text-[#ce5d45] transition-colors line-clamp-2 cursor-pointer"
          >
            {product.name}
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Size / Variant hint pills */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-stone-400 font-medium">Tallas:</span>
              {product.sizes.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-[#20201e]">
                {currency === 'USD' ? formatUSD(product.price) : formatNIO(nioPrice)}
              </span>
              <span className="text-xs font-bold text-[#ce5d45]">
                {currency === 'USD' ? formatNIO(nioPrice) : formatUSD(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-stone-400 line-through">
                  {currency === 'USD'
                    ? formatUSD(product.originalPrice)
                    : formatNIO(nioOriginal || 0)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-stone-500 font-medium">
                En stock • {product.stock ?? 10} disp.
              </span>
              {product.barcode && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                  <Barcode className="w-2.5 h-2.5" />
                  <span>{product.barcode.slice(-6)}</span>
                </span>
              )}
            </div>
          </div>

          <button
            id={`add-cart-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[#20201e] text-white hover:bg-[#ce5d45] active:scale-95 transition-all text-xs font-bold shadow-sm shrink-0"
            title="Añadir al carrito"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Añadir</span>
          </button>
        </div>
      </div>
    </article>
  );
};
