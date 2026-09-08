import React from 'react';
import { MessageCircle, ExternalLink, BookOpen, Share2 } from 'lucide-react';
import { TikTokIcon } from './TikTokIcon';
import { OFFICIAL_LINKS } from '../data/socialLinks';

interface SocialLinksRowProps {
  tiktokUrl?: string;
  whatsAppCatalogUrl?: string;
  linkBioUrl?: string;
  whatsAppNumber?: string;
  variant?: 'light' | 'dark' | 'pills';
  className?: string;
}

export const SocialLinksRow: React.FC<SocialLinksRowProps> = ({
  tiktokUrl = OFFICIAL_LINKS.tiktok,
  whatsAppCatalogUrl = OFFICIAL_LINKS.whatsAppCatalogUrl,
  linkBioUrl = OFFICIAL_LINKS.linkBioUrl,
  whatsAppNumber = OFFICIAL_LINKS.whatsAppPhone,
  variant = 'light',
  className = '',
}) => {
  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '') || OFFICIAL_LINKS.whatsAppPhone;
  const directWhatsAppUrl = `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodeURIComponent(
    '¡Hola VariedadesCS! Me gustaría información sobre sus productos disponibles.'
  )}&type=phone_number&app_absent=0&wame_ctl=1`;

  const links = [
    {
      id: 'social-tiktok',
      name: 'TikTok',
      handle: '@variedadescs_',
      label: 'Síguenos en TikTok',
      url: tiktokUrl,
      icon: <TikTokIcon className="w-4 h-4" />,
      colorClass: 'hover:bg-black hover:text-white',
      badgeClass: 'bg-black text-white',
    },
    {
      id: 'social-whatsapp-chat',
      name: 'WhatsApp Directo',
      handle: '+505 8506-2737',
      label: 'Escribir por WhatsApp',
      url: directWhatsAppUrl,
      icon: <MessageCircle className="w-4 h-4 fill-current" />,
      colorClass: 'hover:bg-[#25D366] hover:text-white',
      badgeClass: 'bg-[#25D366] text-white',
    },
    {
      id: 'social-whatsapp-catalog',
      name: 'Catálogo WhatsApp',
      handle: 'wa.me/c/50585062737',
      label: 'Ver Catálogo en WhatsApp',
      url: whatsAppCatalogUrl,
      icon: <BookOpen className="w-4 h-4" />,
      colorClass: 'hover:bg-[#128C7E] hover:text-white',
      badgeClass: 'bg-[#128C7E] text-white',
    },
    {
      id: 'social-linkbio',
      name: 'Enlaces Oficiales',
      handle: 'ln.ki/VariedadesCS',
      label: 'Todos nuestros enlaces',
      url: linkBioUrl,
      icon: <ExternalLink className="w-4 h-4" />,
      colorClass: 'hover:bg-[#ce5d45] hover:text-white',
      badgeClass: 'bg-[#ce5d45] text-white',
    },
  ];

  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {links.map((item) => (
          <a
            key={item.id}
            id={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-stone-300 bg-white/90 hover:bg-white text-stone-800 text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 group"
            title={item.label}
          >
            <span className="text-[#ce5d45] group-hover:scale-110 transition-transform">
              {item.icon}
            </span>
            <span>{item.name}</span>
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'dark') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
        {links.map((item) => (
          <a
            key={item.id}
            id={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all hover:-translate-y-0.5 group shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl ${item.badgeClass} flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold block truncate text-white">
                {item.name}
              </span>
              <span className="text-[11px] text-stone-300 block truncate font-mono">
                {item.handle}
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-white shrink-0 transition-colors" />
          </a>
        ))}
      </div>
    );
  }

  // Default light cards
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 ${className}`}>
      {links.map((item) => (
        <a
          key={item.id}
          id={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/90 text-[#20201e] transition-all hover:-translate-y-0.5 hover:shadow-md group"
        >
          <div className={`w-10 h-10 rounded-xl ${item.badgeClass} flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
            {item.icon}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold block truncate text-[#20201e] group-hover:text-[#ce5d45] transition-colors">
              {item.name}
            </span>
            <span className="text-[11px] text-stone-500 block truncate font-medium">
              {item.handle}
            </span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0 transition-colors" />
        </a>
      ))}
    </div>
  );
};
