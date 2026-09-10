import React, { useState, useRef } from 'react';
import { ShoppingBag, MessageCircle, Search, X, Heart, Phone, Package, ArrowRightLeft, BookOpen, ExternalLink } from 'lucide-react';
import { TikTokIcon } from './TikTokIcon';
import { OFFICIAL_LINKS } from '../data/socialLinks';
import { Product, Currency } from '../types';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  favorites: Product[];
  onOpenFavorites: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  whatsAppNumber: string;
  onOpenWhatsAppConfig?: () => void;
  ordersCount?: number;
  onOpenOrders?: () => void;
  currency?: Currency;
  onToggleCurrency?: () => void;
  exchangeRate?: number;
  onOpenAdmin?: () => void;
  tiktokUrl?: string;
  whatsAppCatalogUrl?: string;
  linkBioUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  favorites,
  onOpenFavorites,
  searchQuery,
  onSearchChange,
  whatsAppNumber,
  onOpenWhatsAppConfig,
  ordersCount = 0,
  onOpenOrders,
  currency = 'USD',
  onToggleCurrency,
  exchangeRate = 36.8,
  onOpenAdmin,
  tiktokUrl = OFFICIAL_LINKS.tiktok,
  whatsAppCatalogUrl = OFFICIAL_LINKS.whatsAppCatalogUrl,
  linkBioUrl = OFFICIAL_LINKS.linkBioUrl,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoClicksRef = useRef(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAdminAccess = () => {
    if (onOpenAdmin) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([60, 40, 80]);
        } catch {}
      }
      onOpenAdmin();
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (!onOpenAdmin) return;
    logoClicksRef.current += 1;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    if (logoClicksRef.current >= 5) {
      e.preventDefault();
      logoClicksRef.current = 0;
      triggerAdminAccess();
      return;
    }
    clickTimeoutRef.current = setTimeout(() => {
      logoClicksRef.current = 0;
    }, 2500);
  };

  const handleTouchStart = () => {
    if (!onOpenAdmin) return;
    // Secret long-press on mobile: hold logo for 2.2 seconds to open admin login
    longPressTimerRef.current = setTimeout(() => {
      triggerAdminAccess();
    }, 2200);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '');
  const consultationUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    '¡Hola VariedadesCS! Me gustaría hacer una consulta sobre sus productos.'
  )}`;

  return (
    <header
      id="store-header"
      className="w-full border-b border-stone-300/80 sticky top-0 z-40 bg-[#f7f1e8]/90 backdrop-blur-md transition-all"
    >
      {/* Top micro announcement with social shortcuts */}
      <div className="bg-[#20201e] text-[#f7f1e8] text-xs py-1.5 px-4 text-center font-medium flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline font-bold">✨ Colección 2026 Nicaragua</span>
          <a
            href={tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white text-[11px] transition-colors font-medium"
            title="Síguenos en TikTok @variedadescs_"
          >
            <TikTokIcon className="w-3 h-3" />
            <span>TikTok @variedadescs_</span>
          </a>
          <a
            href={whatsAppCatalogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#128C7E]/70 hover:bg-[#128C7E] text-white text-[11px] transition-colors font-medium"
            title="Ver catálogo oficial en WhatsApp"
          >
            <BookOpen className="w-3 h-3" />
            <span>Catálogo WhatsApp</span>
          </a>
          <a
            href={linkBioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1 text-[11px] text-stone-300 hover:text-white transition-colors"
            title="Todos nuestros enlaces oficiales"
          >
            <ExternalLink className="w-3 h-3" />
            <span>ln.ki/VariedadesCS</span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://api.whatsapp.com/send/?phone=${cleanPhone || '50585062737'}&type=phone_number&app_absent=0&wame_ctl=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#25D366] hover:text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1"
          >
            <Phone className="w-3 h-3" />
            <span>+{cleanPhone || '50585062737'}</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo with secret 5-tap or long-press owner shortcut */}
        <a
          id="store-logo-link"
          href="#inicio"
          onClick={handleLogoClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="flex items-center gap-2.5 shrink-0 group select-none cursor-pointer"
          aria-label="Ir al inicio de VariedadesCS"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-sm border border-pink-300/60 bg-[#fba0c7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <img
              src="/logo.jpg"
              alt="Logo VariedadesCS"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to text initials if image ever fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <span className="display-font text-xl sm:text-2xl font-extrabold tracking-tight text-[#20201e] block leading-none">
              Variedades<span className="text-[#ce5d45]">CS</span>
            </span>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-stone-600 font-bold block mt-0.5">
              Moda & detalles
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#20201e]"
        >
          <a
            id="nav-home"
            href="#inicio"
            className="hover:text-[#ce5d45] transition-colors py-1 focus:outline-none"
          >
            Inicio
          </a>
          <a
            id="nav-catalog"
            href="#catalogo"
            className="hover:text-[#ce5d45] transition-colors py-1 focus:outline-none"
          >
            Catálogo
          </a>
          <a
            id="nav-how"
            href="#como-comprar"
            className="hover:text-[#ce5d45] transition-colors py-1 focus:outline-none"
          >
            Cómo comprar
          </a>
          <a
            id="nav-contact"
            href="#contacto"
            className="hover:text-[#ce5d45] transition-colors py-1 focus:outline-none"
          >
            Contacto
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Search Trigger */}
          <div className="relative">
            {showSearch ? (
              <div className="flex items-center bg-white border border-stone-300 rounded-full px-3 py-1.5 shadow-sm">
                <Search className="w-4 h-4 text-stone-500 mr-2 shrink-0" />
                <input
                  id="navbar-search-input"
                  type="text"
                  placeholder="Buscar prendas, perfumes..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-transparent text-sm text-[#20201e] placeholder-stone-400 focus:outline-none w-36 sm:w-48"
                  autoFocus
                />
                <button
                  id="close-search-btn"
                  onClick={() => {
                    setShowSearch(false);
                    onSearchChange('');
                  }}
                  className="text-stone-400 hover:text-stone-700 ml-1 p-0.5"
                  aria-label="Cerrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="open-search-btn"
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 rounded-full border border-stone-300/80 bg-white/70 hover:bg-white flex items-center justify-center text-[#20201e] hover:text-[#ce5d45] transition-colors"
                aria-label="Buscar en el catálogo"
                title="Buscar productos"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Currency Switcher Pill */}
          {onToggleCurrency && (
            <button
              id="currency-toggle-btn"
              onClick={onToggleCurrency}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-stone-300/80 bg-white/80 hover:bg-white text-xs font-bold text-stone-800 transition-all shadow-2xs"
              title={`Moneda activa: ${currency === 'USD' ? 'Dólares ($)' : 'Córdobas (C$)'}. Tasa: 1$ = C$${exchangeRate.toFixed(2)}. Haz clic para alternar.`}
            >
              <ArrowRightLeft className="w-3 h-3 text-[#d89c35]" />
              <span className={currency === 'USD' ? 'text-[#ce5d45] font-black' : 'text-stone-400'}>
                $
              </span>
              <span className="text-stone-300">/</span>
              <span className={currency === 'NIO' ? 'text-[#ce5d45] font-black' : 'text-stone-400'}>
                C$
              </span>
            </button>
          )}

          {/* Favorites Trigger */}
          <button
            id="favorites-button"
            onClick={onOpenFavorites}
            className="relative w-10 h-10 rounded-full border border-stone-300/80 bg-white/70 hover:bg-white flex items-center justify-center text-[#20201e] hover:text-[#ce5d45] transition-colors"
            aria-label="Ver favoritos"
            title="Mis favoritos"
          >
            <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-[#ce5d45] text-[#ce5d45]' : ''}`} />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ce5d45] text-white text-[10px] font-bold flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>

          {/* Firebase Orders Trigger */}
          {onOpenOrders && (
            <button
              id="orders-button"
              onClick={onOpenOrders}
              className="relative w-10 h-10 rounded-full border border-stone-300/80 bg-white/70 hover:bg-white flex items-center justify-center text-[#20201e] hover:text-[#ce5d45] transition-colors"
              aria-label="Ver pedidos en Firebase"
              title="Pedidos en Firebase"
            >
              <Package className="w-4 h-4" />
              {ordersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#d89c35] text-[#20201e] text-[10px] font-black flex items-center justify-center">
                  {ordersCount}
                </span>
              )}
            </button>
          )}

          {/* Shopping Cart Button */}
          <button
            id="cart-button"
            onClick={onOpenCart}
            className="relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-[#20201e] text-white hover:bg-[#ce5d45] transition-colors font-bold text-sm shadow-md"
            aria-label="Ver carrito de compras"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Carrito</span>
            <span className="w-5 h-5 rounded-full bg-[#d89c35] text-[#20201e] text-xs font-black flex items-center justify-center">
              {cartCount}
            </span>
          </button>

          {/* WhatsApp direct consult button */}
          <a
            id="header-contact"
            href={consultationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-bold shadow-sm hover:brightness-105 transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span id="header-contact-text">Consultar</span>
          </a>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-full border border-stone-300/80 bg-white/70 flex flex-col items-center justify-center gap-1 text-[#20201e]"
            aria-label="Menú móvil"
          >
            <span className={`w-4 h-0.5 bg-current transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`w-4 h-0.5 bg-current transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-4 h-0.5 bg-current transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#f7f1e8] px-6 py-4 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          <a
            href="#inicio"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-[#20201e] hover:text-[#ce5d45]"
          >
            Inicio
          </a>
          <a
            href="#catalogo"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-[#20201e] hover:text-[#ce5d45]"
          >
            Catálogo completo
          </a>
          <a
            href="#como-comprar"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-[#20201e] hover:text-[#ce5d45]"
          >
            ¿Cómo comprar?
          </a>
          <a
            href="#contacto"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-[#20201e] hover:text-[#ce5d45]"
          >
            Contacto & Ubicación
          </a>
          {onOpenOrders && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOrders();
              }}
              className="w-full text-left py-2 text-base font-semibold text-[#20201e] hover:text-[#ce5d45] flex items-center justify-between"
            >
              <span>Pedidos en Firebase</span>
              <span className="px-2 py-0.5 rounded-full bg-[#20201e] text-white text-xs font-bold">
                {ordersCount}
              </span>
            </button>
          )}

          {/* Social Channels & Official Links inside Mobile Menu */}
          <div className="pt-3 pb-1 border-t border-stone-300 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
              Redes y Canales Oficiales:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl bg-black text-white text-xs font-bold shadow-xs hover:brightness-110"
              >
                <TikTokIcon className="w-3.5 h-3.5" />
                <span className="truncate">TikTok</span>
              </a>

              <a
                href={whatsAppCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl bg-[#128C7E] text-white text-xs font-bold shadow-xs hover:brightness-110"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate">Catálogo WA</span>
              </a>

              <a
                href={`https://api.whatsapp.com/send/?phone=${cleanPhone || '50585062737'}&type=phone_number&app_absent=0&wame_ctl=1`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl bg-[#25D366] text-white text-xs font-bold shadow-xs hover:brightness-110"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span className="truncate">WhatsApp</span>
              </a>

              <a
                href={linkBioUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl bg-[#ce5d45] text-white text-xs font-bold shadow-xs hover:brightness-110"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="truncate">Enlaces (ln.ki)</span>
              </a>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-300 flex items-center justify-between">
            <a
              href={`https://api.whatsapp.com/send/?phone=${cleanPhone || '50585062737'}&type=phone_number&app_absent=0&wame_ctl=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#128C7E] font-bold flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Atención: +{cleanPhone || '50585062737'}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
