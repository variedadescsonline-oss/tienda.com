import React, { useState, useMemo } from 'react';
import { Sparkles, ArrowUpRight, Search, SlidersHorizontal, RefreshCw, Truck, MessageCircle, ShieldCheck } from 'lucide-react';
import { Product, CategoryId, Currency } from '../types';
import { CATEGORIES } from '../data/products';
import { ProductCard } from './ProductCard';

interface CatalogSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  favorites: Product[];
  onToggleFavorite: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  whatsAppNumber: string;
  currency?: Currency;
  exchangeRate?: number;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  favorites,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  whatsAppNumber,
  currency = 'USD',
  exchangeRate = 36.8,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount' | 'name'>('featured');

  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '');
  const customOrderUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    '¡Hola VariedadesCS! Quiero consultar por otros productos o solicitar un encargo personalizado.'
  )}`;

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        const matchesCategory =
          selectedCategory === 'all' || item.category === selectedCategory;
        const cleanQuery = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !cleanQuery ||
          item.name.toLowerCase().includes(cleanQuery) ||
          item.description.toLowerCase().includes(cleanQuery) ||
          item.categoryLabel.toLowerCase().includes(cleanQuery) ||
          (item.barcode && item.barcode.toLowerCase().includes(cleanQuery));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'discount') {
          const getDiscA = a.originalPrice && a.originalPrice > a.price ? (a.originalPrice - a.price) / a.originalPrice : 0;
          const getDiscB = b.originalPrice && b.originalPrice > b.price ? (b.originalPrice - b.price) / b.originalPrice : 0;
          return getDiscB - getDiscA;
        }
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f.id)),
    [favorites]
  );

  return (
    <section id="catalogo" className="w-full py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* SHEIN / Amazon Style Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-[#fa3e3e] text-[11px] font-black uppercase tracking-wider mb-1">
              🔥 Tendencias & Novedades
            </div>
            <h2
              id="catalog-title"
              className="display-font text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900"
            >
              Catálogo Oficial VariedadesCS
            </h2>
            <p
              id="catalog-description"
              className="mt-1 text-stone-600 text-xs sm:text-sm"
            >
              Moda femenina, lencería de lujo, fragancias y accesorios con entrega garantizada en Nicaragua.
            </p>
          </div>

          {/* Quick Perks Strip */}
          <div className="hidden lg:flex items-center gap-4 text-[11px] text-stone-500 font-semibold">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-[#ce5d45]" />
              Envíos a todo el país
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              Atención directa WhatsApp
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Original
            </span>
          </div>
        </div>

        {/* SHEIN Style Category Horizontal Scrollable Bar */}
        <div className="mt-4 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar flex items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                id={`filter-${cat.id}`}
                data-filter={cat.id}
                onClick={() => setSelectedCategory(cat.id as CategoryId)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-sm ring-2 ring-stone-900 ring-offset-1'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                }`}
                type="button"
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls Bar (Amazon Style) */}
        <div className="mt-3 pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="catalog-search-input"
              type="text"
              placeholder="Buscar prendas, perfumes, código..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-full bg-white border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 shadow-2xs text-stone-900"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
            <span className="text-stone-500 text-[11px]">
              <strong className="text-stone-900 font-bold">{filteredProducts.length}</strong> artículos
            </span>

            <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-full px-3 py-1 shadow-2xs">
              <SlidersHorizontal className="w-3 h-3 text-stone-400" />
              <select
                id="catalog-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="featured">Recomendados</option>
                <option value="discount">Mayor Descuento %</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name">Alfabético (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid - SHEIN / Amazon 2-Column Mobile & Multi-Column Desktop */}
        {filteredProducts.length > 0 ? (
          <div
            id="catalog-grid"
            className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5 lg:gap-4.5"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
                isFavorite={favoriteIds.has(product.id)}
                onToggleFavorite={onToggleFavorite}
                currency={currency}
                exchangeRate={exchangeRate}
              />
            ))}

            {/* Custom Request Tile (SHEIN / Amazon Style Promo Box) */}
            <article
              id="card-more"
              data-category="accesorios"
              className="col-span-2 sm:col-span-1 md:col-span-2 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 text-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col justify-between border border-stone-800 hover:-translate-y-0.5 transition-transform"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p
                  id="label-more"
                  className="mt-3 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider"
                >
                  Encargos Especiales
                </p>
                <h3
                  id="title-more"
                  className="display-font mt-1 text-base sm:text-xl font-bold text-white"
                >
                  ¿Buscas algo específico?
                </h3>
                <p
                  id="description-more"
                  className="mt-1.5 text-xs text-stone-300 leading-relaxed"
                >
                  Traemos piezas por encargo especial de USA y renovamos nuestro stock semanalmente. ¡Envíanos la foto por WhatsApp!
                </p>
              </div>

              <a
                id="more-contact"
                href={customOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex self-start items-center gap-1.5 rounded-full bg-[#f7f1e8] text-stone-950 px-4 py-2 font-bold text-xs shadow-md hover:bg-white active:scale-95 transition-all"
              >
                <span id="more-contact-text">Solicitar por WhatsApp</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#ce5d45]" />
              </a>
            </article>
          </div>
        ) : (
          <div className="mt-10 text-center py-12 bg-white/70 border border-stone-200 rounded-2xl p-6">
            <p className="text-3xl">🔍</p>
            <h3 className="display-font text-lg font-bold text-stone-900 mt-2">
              No encontramos productos con ese criterio
            </h3>
            <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
              Intenta con otra palabra o restablece los filtros para explorar todo nuestro catálogo.
            </p>
            <button
              onClick={() => {
                onSearchChange('');
                setSelectedCategory('all');
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-bold shadow-xs hover:bg-[#ce5d45] transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Ver todos los productos</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
