import React from 'react';
import { ShoppingCart, MessageCircle, PackageCheck } from 'lucide-react';

export const HowToBuy: React.FC = () => {
  return (
    <section id="como-comprar" className="w-full py-16 sm:py-20 bg-stone-100/60 border-y border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="max-w-xl">
          <p
            id="how-eyebrow"
            className="text-[#ce5d45] text-xs font-bold uppercase tracking-[0.18em]"
          >
            Sencillo y Seguro
          </p>
          <h2
            id="how-title"
            className="display-font mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#20201e] tracking-tight"
          >
            ¿Cómo hacer tu pedido?
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
            Comprar en VariedadesCS es directo, sin registros engorrosos y con confirmación humana inmediata.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <article
            id="step-one"
            className="bg-white rounded-3xl p-7 sm:p-8 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span
                id="step-one-number"
                className="w-10 h-10 rounded-full bg-[#20201e] text-[#f7f1e8] text-sm font-bold flex items-center justify-center display-font"
              >
                01
              </span>
              <ShoppingCart className="w-6 h-6 text-[#d89c35]" />
            </div>
            <h3
              id="step-one-title"
              className="display-font mt-8 text-2xl font-bold text-[#20201e]"
            >
              Elige tus favoritos
            </h3>
            <p
              id="step-one-text"
              className="mt-3 text-sm text-stone-600 leading-relaxed"
            >
              Navega por nuestro catálogo de ropa, lencería, perfumes y accesorios. Selecciona tus tallas o variantes y agrégalos a tu carrito.
            </p>
          </article>

          {/* Step 2 */}
          <article
            id="step-two"
            className="bg-white rounded-3xl p-7 sm:p-8 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span
                id="step-two-number"
                className="w-10 h-10 rounded-full bg-[#20201e] text-[#f7f1e8] text-sm font-bold flex items-center justify-center display-font"
              >
                02
              </span>
              <MessageCircle className="w-6 h-6 text-[#25D366] fill-[#25D366]" />
            </div>
            <h3
              id="step-two-title"
              className="display-font mt-8 text-2xl font-bold text-[#20201e]"
            >
              Envía por WhatsApp
            </h3>
            <p
              id="step-two-text"
              className="mt-3 text-sm text-stone-600 leading-relaxed"
            >
              Haz clic en "Enviar Pedido por WhatsApp". Tu lista y datos se formatearán automáticamente para que nuestro equipo te atienda al instante.
            </p>
          </article>

          {/* Step 3 */}
          <article
            id="step-three"
            className="bg-white rounded-3xl p-7 sm:p-8 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span
                id="step-three-number"
                className="w-10 h-10 rounded-full bg-[#20201e] text-[#f7f1e8] text-sm font-bold flex items-center justify-center display-font"
              >
                03
              </span>
              <PackageCheck className="w-6 h-6 text-[#ce5d45]" />
            </div>
            <h3
              id="step-three-title"
              className="display-font mt-8 text-2xl font-bold text-[#20201e]"
            >
              Recibe en tu puerta
            </h3>
            <p
              id="step-three-text"
              className="mt-3 text-sm text-stone-600 leading-relaxed"
            >
              Coordinamos la forma de pago (transferencia, pago móvil o efectivo) y despachamos tu paquete con embalaje seguro y listo para estrenar.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
};
