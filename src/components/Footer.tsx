import React, { useRef } from 'react';
import { Phone, Heart, ArrowUp, Package, MessageCircle, BookOpen, ExternalLink } from 'lucide-react';
import { TikTokIcon } from './TikTokIcon';
import { OFFICIAL_LINKS } from '../data/socialLinks';

interface FooterProps {
  onOpenWhatsAppConfig?: () => void;
  whatsAppNumber: string;
  onOpenOrders?: () => void;
  ordersCount?: number;
  onOpenAdmin?: () => void;
  tiktokUrl?: string;
  whatsAppCatalogUrl?: string;
  linkBioUrl?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenWhatsAppConfig,
  whatsAppNumber,
  onOpenOrders,
  ordersCount = 0,
  onOpenAdmin,
  tiktokUrl = OFFICIAL_LINKS.tiktok,
  whatsAppCatalogUrl = OFFICIAL_LINKS.whatsAppCatalogUrl,
  linkBioUrl = OFFICIAL_LINKS.linkBioUrl,
}) => {
  const footerTapCount = useRef(0);
  const footerTapTimer = useRef<NodeJS.Timeout | null>(null);

  const handleFooterTap = () => {
    if (!onOpenAdmin) return;
    footerTapCount.current += 1;
    if (footerTapTimer.current) clearTimeout(footerTapTimer.current);
    if (footerTapCount.current >= 5) {
      footerTapCount.current = 0;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([60, 40, 80]);
        } catch {}
      }
      onOpenAdmin();
      return;
    }
    footerTapTimer.current = setTimeout(() => {
      footerTapCount.current = 0;
    }, 2500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '') || OFFICIAL_LINKS.whatsAppPhone;
  const directWhatsAppUrl = `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodeURIComponent(
    '¡Hola VariedadesCS! Me gustaría consultar sobre sus productos disponibles.'
  )}&type=phone_number&app_absent=0&wame_ctl=1`;

  return (
    <footer id="store-footer" className="w-full mt-12 border-t border-stone-300/80 bg-[#f1e9dd]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between pb-8 border-b border-stone-300/60">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#fba0c7] border border-pink-300/60 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src="/logo.jpg"
                  alt="Logo VariedadesCS"
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                id="footer-brand"
                className="display-font text-2xl font-bold text-[#20201e]"
              >
                Variedades<span className="text-[#ce5d45]">CS</span>
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-2 max-w-sm">
              Tu tienda online de confianza en moda femenina, lencería delicada, fragancias exclusivas y accesorios que complementan tu estilo en Nicaragua.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm font-semibold text-stone-700">
            <a href="#inicio" className="hover:text-[#ce5d45] transition-colors">
              Inicio
            </a>
            <a href="#catalogo" className="hover:text-[#ce5d45] transition-colors">
              Catálogo
            </a>
            <a href="#como-comprar" className="hover:text-[#ce5d45] transition-colors">
              Cómo comprar
            </a>
            <a href="#contacto" className="hover:text-[#ce5d45] transition-colors">
              Contacto
            </a>
            {onOpenOrders && (
              <button
                onClick={onOpenOrders}
                className="hover:text-[#ce5d45] transition-colors font-bold inline-flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5 text-[#d89c35]" />
                <span>Pedidos ({ordersCount})</span>
              </button>
            )}
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#128C7E] hover:underline font-bold inline-flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp: +{cleanPhone}</span>
            </a>
          </div>

          {/* Scroll to top */}
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full border border-stone-300 bg-white hover:bg-stone-50 flex items-center justify-center text-stone-700 shadow-xs transition-transform hover:-translate-y-0.5"
            aria-label="Volver arriba"
            title="Volver arriba"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Social Media & Official Channels Section */}
        <div className="py-6 border-b border-stone-300/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Redes Sociales y Canales Oficiales:
            </span>
            <span className="text-[11px] text-stone-500">
              Conéctate y sigue nuestras novedades diarias
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* TikTok */}
            <a
              id="footer-tiktok-link"
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/90 text-[#20201e] shadow-2xs hover:shadow-xs transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <TikTokIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold block truncate group-hover:text-[#ce5d45] transition-colors">
                  TikTok Oficial
                </span>
                <span className="text-[11px] text-stone-500 block truncate">
                  @variedadescs_
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0" />
            </a>

            {/* WhatsApp Chat */}
            <a
              id="footer-whatsapp-chat-link"
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/90 text-[#20201e] shadow-2xs hover:shadow-xs transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-4 h-4 fill-white" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold block truncate group-hover:text-[#ce5d45] transition-colors">
                  WhatsApp Directo
                </span>
                <span className="text-[11px] text-stone-500 block truncate">
                  +505 8506-2737
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0" />
            </a>

            {/* WhatsApp Catalog */}
            <a
              id="footer-whatsapp-catalog-link"
              href={whatsAppCatalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/90 text-[#20201e] shadow-2xs hover:shadow-xs transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#128C7E] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold block truncate group-hover:text-[#ce5d45] transition-colors">
                  Catálogo WhatsApp
                </span>
                <span className="text-[11px] text-stone-500 block truncate">
                  wa.me/c/50585062737
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0" />
            </a>

            {/* Linkbio / All links */}
            <a
              id="footer-linkbio-link"
              href={linkBioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/90 text-[#20201e] shadow-2xs hover:shadow-xs transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#ce5d45] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold block truncate group-hover:text-[#ce5d45] transition-colors">
                  Todos los Enlaces
                </span>
                <span className="text-[11px] text-stone-500 block truncate">
                  ln.ki/VariedadesCS
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0" />
            </a>
          </div>
        </div>

        {/* Bottom copyright row with secret owner tap fallback */}
        <div className="pt-6 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-stone-500">
          <span
            id="footer-text"
            onClick={handleFooterTap}
            className="cursor-pointer select-none"
            title="VariedadesCS"
          >
            © 2026 VariedadesCS. Todos los derechos reservados. Moda, belleza y estilo a tu alcance en Nicaragua.
          </span>
          <span className="flex items-center gap-1">
            Hecho con <Heart className="w-3 h-3 text-[#ce5d45] fill-[#ce5d45]" /> para consentirte
          </span>
        </div>
      </div>
    </footer>
  );
};
