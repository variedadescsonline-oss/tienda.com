import React from 'react';
import { Home, Sparkles, Scan, Heart, ShoppingBag } from 'lucide-react';

interface BottomTabBarProps {
  activeTab?: 'home' | 'catalog' | 'scan' | 'favorites' | 'cart';
  cartCount: number;
  favoritesCount: number;
  onScrollToTop: () => void;
  onScrollToCatalog: () => void;
  onOpenScanner: () => void;
  onOpenFavorites: () => void;
  onOpenCart: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  cartCount,
  favoritesCount,
  onScrollToTop,
  onScrollToCatalog,
  onOpenScanner,
  onOpenFavorites,
  onOpenCart,
}) => {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {}
    }
  };

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Barra de navegación móvil"
      className="fixed sm:absolute bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/90 px-3 py-2 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] select-none"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Inicio */}
        <button
          id="tab-home"
          type="button"
          onClick={() => {
            triggerHaptic();
            onScrollToTop();
          }}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-600 hover:text-[#ce5d45] active:scale-95 transition-all group"
        >
          <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold tracking-tight mt-1">Inicio</span>
        </button>

        {/* Catálogo */}
        <button
          id="tab-catalog"
          type="button"
          onClick={() => {
            triggerHaptic();
            onScrollToCatalog();
          }}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-600 hover:text-[#ce5d45] active:scale-95 transition-all group"
        >
          <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold tracking-tight mt-1">Catálogo</span>
        </button>

        {/* Floating Scan Button (Center Action) */}
        <div className="flex-1 flex items-center justify-center -mt-5">
          <button
            id="tab-scanner-btn"
            type="button"
            onClick={() => {
              triggerHaptic();
              onOpenScanner();
            }}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#20201e] to-[#ce5d45] text-white shadow-xl hover:shadow-2xl flex flex-col items-center justify-center border-4 border-white active:scale-90 transition-transform ring-2 ring-[#ce5d45]/30 group"
            title="Escanear código de barra con la cámara del teléfono"
          >
            <Scan className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {/* Favoritos */}
        <button
          id="tab-favorites"
          type="button"
          onClick={() => {
            triggerHaptic();
            onOpenFavorites();
          }}
          className="relative flex flex-col items-center justify-center flex-1 py-1 text-stone-600 hover:text-[#ce5d45] active:scale-95 transition-all group"
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${favoritesCount > 0 ? 'fill-[#ce5d45] text-[#ce5d45]' : ''} group-hover:scale-110 transition-transform`} />
            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#ce5d45] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {favoritesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-1">Deseos</span>
        </button>

        {/* Carrito */}
        <button
          id="tab-cart"
          type="button"
          onClick={() => {
            triggerHaptic();
            onOpenCart();
          }}
          className="relative flex flex-col items-center justify-center flex-1 py-1 text-stone-600 hover:text-[#ce5d45] active:scale-95 transition-all group"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#ce5d45] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-1">Carrito</span>
        </button>
      </div>
    </nav>
  );
};
