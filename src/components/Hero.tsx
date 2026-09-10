import React from 'react';
import { ArrowDownRight, MessageCircle, Sparkles, ShieldCheck, Truck, BookOpen } from 'lucide-react';
import { TikTokIcon } from './TikTokIcon';
import { OFFICIAL_LINKS } from '../data/socialLinks';

interface HeroProps {
  whatsAppNumber: string;
  onExploreCatalog: () => void;
  tiktokUrl?: string;
  whatsAppCatalogUrl?: string;
}

export const Hero: React.FC<HeroProps> = ({
  whatsAppNumber,
  onExploreCatalog,
  tiktokUrl = OFFICIAL_LINKS.tiktok,
  whatsAppCatalogUrl = OFFICIAL_LINKS.whatsAppCatalogUrl,
}) => {
  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '') || OFFICIAL_LINKS.whatsAppPhone;
  const whatsAppDirectOrderUrl = `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodeURIComponent(
    '¡Hola VariedadesCS! Vengo desde su página web y me gustaría conocer su catálogo disponible y promociones activas.'
  )}&type=phone_number&app_absent=0&wame_ctl=1`;

  return (
    <section id="inicio" className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 sm:py-8">
        <div className="relative min-h-[560px] sm:min-h-[600px] overflow-hidden rounded-[2rem] shadow-2xl flex items-end bg-[#20201e]">
          {/* Background Image with warm overlay */}
          <img
            id="hero-image"
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85"
            alt="VariedadesCS Moda y Accesorios"
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-75"
          />

          {/* Sophisticated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#20201e]/95 via-[#20201e]/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#20201e]/85 via-transparent to-transparent pointer-events-none" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl p-6 sm:p-12 lg:p-14 text-white">
            <div className="flex items-center gap-2.5 mb-4 flex-wrap">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#fba0c7] border border-pink-200/80 shadow-md shrink-0">
                <img src="/logo.jpg" alt="VariedadesCS" className="w-full h-full object-cover" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 bg-[#ce5d45] text-white text-xs font-bold uppercase tracking-[0.18em] shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span id="hero-eyebrow">VariedadesCS • Moda & Detalles</span>
              </div>
            </div>

            <h1
              id="hero-title"
              className="display-font text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.04] tracking-tight text-white drop-shadow-sm"
            >
              Moda, elegancia y detalles que inspiran
            </h1>

            <p
              id="hero-description"
              className="mt-4 sm:mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-stone-200"
            >
              Descubre nuestra selección cuidada en prendas femeninas, lencería de tacto suave, fragancias
              cautivadoras y accesorios diseñados para destacar tu estilo personal.
            </p>

            {/* Action buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                id="hero-cta"
                onClick={onExploreCatalog}
                className="inline-flex items-center gap-2 rounded-full bg-[#f7f1e8] text-[#20201e] px-6 py-3.5 font-bold text-sm shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span id="hero-cta-text">Explorar categorías</span>
                <ArrowDownRight className="w-4 h-4 text-[#ce5d45]" />
              </button>

              <a
                id="hero-whatsapp-btn"
                href={whatsAppDirectOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white px-5 py-3.5 font-bold text-sm shadow-xl hover:brightness-105 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Escribir por WhatsApp</span>
              </a>

              <a
                id="hero-whatsapp-catalog-btn"
                href={whatsAppCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#128C7E] text-white px-5 py-3.5 font-bold text-sm shadow-xl hover:brightness-105 hover:scale-105 active:scale-95 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Catálogo en WhatsApp</span>
              </a>

              <a
                id="hero-tiktok-btn"
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-black/80 hover:bg-black text-white px-4 py-3.5 font-bold text-sm border border-white/20 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <TikTokIcon className="w-4 h-4" />
                <span>TikTok</span>
              </a>
            </div>

            {/* Micro badges below hero */}
            <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-3 gap-2 sm:gap-4 text-xs text-stone-200">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#d89c35] shrink-0" />
                <span className="font-medium">Envíos a todo el país</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#d89c35] shrink-0" />
                <span className="font-medium">Calidad garantizada</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <span className="font-medium">Atención inmediata</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
