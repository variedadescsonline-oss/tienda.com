import React from 'react';
import { X, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Product[];
  onSelectProduct: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onRemoveFavorite: (p: Product) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  onSelectProduct,
  onAddToCart,
  onRemoveFavorite,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="favorites-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="favorites-drawer-panel"
        className="relative w-full max-w-md bg-[#f7f1e8] h-full shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ce5d45] text-white flex items-center justify-center">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="display-font text-xl sm:text-2xl font-bold text-[#20201e]">
                Tus Favoritos
              </h2>
              <span className="text-xs text-stone-500 font-medium">
                {favorites.length} {favorites.length === 1 ? 'guardado' : 'guardados'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center"
            aria-label="Cerrar favoritos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {favorites.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-stone-200 flex items-center justify-center text-stone-400 mb-3">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="display-font text-xl font-bold text-[#20201e]">
                No tienes favoritos aún
              </h3>
              <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto">
                Toca el corazón en cualquier prenda o accesorio para guardarlo aquí y revisarlo más tarde.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 rounded-full bg-[#20201e] text-white font-bold text-xs shadow-md hover:bg-[#ce5d45] transition-colors inline-flex items-center gap-2"
              >
                <span>Explorar tienda</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            favorites.map((product) => (
              <div
                key={product.id}
                className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3.5"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  onClick={() => {
                    onClose();
                    onSelectProduct(product);
                  }}
                  className="w-16 h-20 rounded-xl object-cover bg-stone-100 shrink-0 cursor-pointer"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[#ce5d45] font-bold uppercase tracking-wider block">
                    {product.categoryLabel}
                  </span>
                  <h4
                    onClick={() => {
                      onClose();
                      onSelectProduct(product);
                    }}
                    className="font-bold text-xs sm:text-sm text-[#20201e] hover:text-[#ce5d45] cursor-pointer truncate"
                  >
                    {product.name}
                  </h4>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-sm font-black text-[#20201e]">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[11px] text-stone-400 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => onAddToCart(product)}
                      className="px-3 py-1 rounded-full bg-[#20201e] hover:bg-[#ce5d45] text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Añadir</span>
                    </button>
                    <button
                      onClick={() => onRemoveFavorite(product)}
                      className="text-[11px] text-stone-400 hover:text-red-600 underline font-medium"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
