import React from 'react';
import { MessageCircle, Clock, MapPin, Sparkles, BookOpen, ExternalLink } from 'lucide-react';
import { TikTokIcon } from './TikTokIcon';
import { OFFICIAL_LINKS } from '../data/socialLinks';

interface ContactBannerProps {
  whatsAppNumber: string;
  tiktokUrl?: string;
  whatsAppCatalogUrl?: string;
  linkBioUrl?: string;
}

export const ContactBanner: React.FC<ContactBannerProps> = ({
  whatsAppNumber,
  tiktokUrl = OFFICIAL_LINKS.tiktok,
  whatsAppCatalogUrl = OFFICIAL_LINKS.whatsAppCatalogUrl,
  linkBioUrl = OFFICIAL_LINKS.linkBioUrl,
}) => {
  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '') || OFFICIAL_LINKS.whatsAppPhone;
  const orderUrl = `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodeURIComponent(
    '¡Hola VariedadesCS! Me gustaría hacer una consulta sobre disponibilidad, envíos o realizar un pedido.'
  )}&type=phone_number&app_absent=0&wame_ctl=1`;

  return (
    <section id="contacto" className="w-full py-12 sm:py-16">
      <div className="max-w-7xl mx-4 sm:mx-auto px-2">
        <div
          id="contact-banner"
          className="bg-[#20201e] text-white rounded-[2rem] px-6 py-12 sm:p-14 text-center shadow-2xl relative overflow-hidden border border-stone-800"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ce5d45]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#d89c35]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <p
              id="contact-eyebrow"
              className="text-[#d89c35] text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Atención Personalizada 24/7 • Nicaragua</span>
            </p>

            <h2
              id="contact-title"
              className="display-font mx-auto mt-4 max-w-2xl text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
            >
              ¿Lista para estrenar o necesitas asesoría de tallas y aromas?
            </h2>

            <p
              id="contact-text"
              className="mx-auto mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-stone-300"
            >
              Escríbenos directamente por WhatsApp, explora nuestro catálogo oficial o síguenos en TikTok para conocer las últimas prendas y tendencias de <strong className="text-white">VariedadesCS</strong>.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
              <a
                id="contact-whatsapp-chat-button"
                href={orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#25D366] text-white px-7 py-4 font-bold text-sm sm:text-base shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-white"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span id="contact-button-text">Escribir por WhatsApp (+505 8506-2737)</span>
              </a>

              <a
                id="contact-whatsapp-catalog-button"
                href={whatsAppCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#128C7E] hover:bg-[#0e7064] text-white px-6 py-4 font-bold text-sm sm:text-base shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-white"
              >
                <BookOpen className="w-5 h-5" />
                <span>Ver Catálogo en WhatsApp</span>
              </a>

              <a
                id="contact-tiktok-button"
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-black hover:bg-stone-900 border border-stone-700 text-white px-6 py-4 font-bold text-sm sm:text-base shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-white"
              >
                <TikTokIcon className="w-5 h-5" />
                <span>TikTok @variedadescs_</span>
              </a>

              <a
                id="contact-linkbio-button"
                href={linkBioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-4 font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Todos los Enlaces (ln.ki)</span>
              </a>
            </div>

            {/* Micro store info */}
            <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d89c35]" />
                <span>Horario: Lunes a Sábado de 8:00 AM a 8:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ce5d45]" />
                <span>Nicaragua: Envíos nacionales y entregas seguras</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

