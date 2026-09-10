import React, { useState } from 'react';
import { ShoppingBag, Eye, Heart, Star, Check, Sparkles } from 'lucide-react';
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
  const [justAdded, setJustAdded] = useState(false);
  const nioPrice = usdToNio(product.price, exchangeRate);
  const nioOriginal = product.originalPrice ? usdToNio(product.originalPrice, exchangeRate) : null;

  // Calculate discount percentage if original price is higher
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  // Deterministic star rating and review count based on product ID for SHEIN/Amazon social proof
  const ratingScore = 4.8 + ((product.id.charCodeAt(product.id.length - 1) % 3) * 0.1);
  const reviewCount = 28 + (product.id.charCodeAt(0) * 2) % 180;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article
      id={`card-product-${product.id}`}
      data-category={product.category}
      onClick={() => onSelect(product)}
      className="group bg-white rounded-xl sm:rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer select-none hover:-translate-y-1"
    >
      {/* Product Image Box - SHEIN & Amazon Tall 3:4 Aspect Ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100/90">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges Stack (SHEIN Red Discount Tag + Amazon Tag) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {discountPercent && discountPercent > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#fa3e3e] text-white text-[10px] sm:text-[11px] font-black tracking-tight shadow-xs">
              -{discountPercent}%
            </span>
          )}

          {product.badge ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#191918]/90 backdrop-blur-xs text-amber-300 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide shadow-xs">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>{product.badge}</span>
            </span>
          ) : product.featured ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 text-[9px] sm:text-[10px] font-black uppercase tracking-wide shadow-xs">
              MÁS VENDIDO
            </span>
          ) : null}
        </div>

        {/* Favorite Wishlist Button */}
        <button
          id={`favorite-btn-${product.id}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product);
          }}
          className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-xs text-stone-700 hover:text-[#fa3e3e] flex items-center justify-center shadow-xs transition-transform active:scale-85"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              isFavorite ? 'fill-[#fa3e3e] text-[#fa3e3e]' : ''
            }`}
          />
        </button>

        {/* Quick Add To Bag Floating Action Button (SHEIN / Amazon 1-Click Buy) */}
        <button
          id={`quick-add-${product.id}`}
          type="button"
          onClick={handleQuickAdd}
          className={`absolute bottom-2.5 right-2.5 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
            justAdded
              ? 'bg-emerald-600 text-white scale-110 ring-2 ring-emerald-300'
              : 'bg-[#191918]/90 hover:bg-[#ce5d45] text-white'
          }`}
          title="Añadir a la bolsa"
          aria-label="Añadir a la bolsa"
        >
          {justAdded ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : (
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>

        {/* Subtle quick view label on hover for desktop */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-[#20201e] text-[11px] font-bold shadow-md">
            <Eye className="w-3 h-3" />
            <span>Ver detalles</span>
          </span>
        </div>
      </div>

      {/* Card Info Content - SHEIN / Amazon Compact & High-Converting */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          {/* Category & Verified Origin */}
          <div className="flex items-center justify-between gap-1 text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
            <span className="truncate">{product.categoryLabel}</span>
            <span className="shrink-0 text-emerald-700 font-bold text-[9px] bg-emerald-50 px-1 rounded">
              Nicaragua
            </span>
          </div>

          {/* Product Title */}
          <h3
            className="mt-1 text-xs sm:text-[13px] font-semibold text-stone-900 group-hover:text-[#ce5d45] transition-colors line-clamp-2 leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Amazon / SHEIN Star Rating & Social Proof */}
          <div className="mt-1.5 flex items-center gap-1 text-[11px]">
            <div className="flex items-center text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-bold text-stone-800 text-[11px]">{ratingScore.toFixed(1)}</span>
            <span className="text-[10px] text-stone-400">({reviewCount})</span>
            <span className="text-[10px] text-stone-400 hidden sm:inline">• {reviewCount * 2}+ vendidos</span>
          </div>

          {/* Size Pills (if available) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1 flex-wrap">
              {product.sizes.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-stone-100 text-stone-600 border border-stone-200"
                >
                  {s}
                </span>
              ))}
              {product.sizes.length > 4 && (
                <span className="text-[9px] text-stone-400 font-semibold">
                  +{product.sizes.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* SHEIN / Amazon Pricing Block */}
        <div className="mt-2 pt-2 border-t border-stone-100">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {/* Primary Price */}
            <span className="text-sm sm:text-base font-black text-stone-950">
              {currency === 'USD' ? formatUSD(product.price) : formatNIO(nioPrice)}
            </span>

            {/* Secondary Currency (NIO / USD) */}
            <span className="text-[11px] sm:text-xs font-bold text-[#ce5d45]">
              {currency === 'USD' ? formatNIO(nioPrice) : formatUSD(product.price)}
            </span>

            {/* Crossed-out original price */}
            {product.originalPrice && (
              <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                {currency === 'USD'
                  ? formatUSD(product.originalPrice)
                  : formatNIO(nioOriginal || 0)}
              </span>
            )}
          </div>

          {/* Delivery & Stock Urgency Label */}
          <div className="mt-1 flex items-center justify-between text-[10px]">
            {product.stock !== undefined && product.stock <= 3 && product.stock > 0 ? (
              <span className="text-amber-600 font-bold">
                ⚡ ¡Solo quedan {product.stock}!
              </span>
            ) : (
              <span className="text-stone-500 font-medium truncate">
                🚚 Envío disponible
              </span>
            )}
            <span className="text-emerald-700 font-bold">
              En stock
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
