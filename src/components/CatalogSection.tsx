import React, { useState, useMemo } from 'react';
import { Sparkles, ArrowUpRight, Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
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
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '');
  const customOrderUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    '¡Hola VariedadesCS! Quiero consultar por otros productos o solicitar un encargo personalizado.'
  )}`;

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
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f.id)),
    [favorites]
  );

  return (
    <section id="catalogo" className="w-full py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header & Category Filters */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4">
          <div className="max-w-xl">
            <p
              id="catalog-eyebrow"
              className="text-[#ce5d45] text-xs font-bold uppercase tracking-[0.18em]"
            >
              Lo más deseado de la temporada
            </p>
            <h2
              id="catalog-title"
              className="display-font mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#20201e]"
            >
              Nuestra Selección Exclusiva
            </h2>
            <p
              id="catalog-description"
              className="mt-3 text-stone-600 leading-relaxed text-sm sm:text-base"
            >
              Explora por categorías y encuentra prendas auténticas, lencería sutil, fragancias
              duraderas y accesorios pensados para tu confort y sofisticación diaria.
            </p>
          </div>

          {/* Filter Pills */}
          <div
            className="flex flex-wrap gap-2"
            aria-label="Filtros del catálogo"
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`filter-${cat.id}`}
                  data-filter={cat.id}
                  onClick={() => setSelectedCategory(cat.id as CategoryId)}
                  className={`rounded-full border px-4 py-2 text-xs sm:text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#20201e] ${
                    isActive
                      ? 'bg-[#20201e] text-white border-[#20201e] shadow-md scale-105'
                      : 'bg-white/80 text-stone-700 border-stone-300/80 hover:bg-stone-100 hover:border-stone-400'
                  }`}
                  type="button"
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="mt-8 pt-6 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="catalog-search-input"
              type="text"
              placeholder="Buscar por nombre o código de barra..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-full bg-white border border-stone-300 focus:outline-none focus:border-[#20201e] focus:ring-1 focus:ring-[#20201e] shadow-sm text-[#20201e]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-stone-500 font-medium">
              Mostrando <strong className="text-stone-800">{filteredProducts.length}</strong> productos
            </span>

            <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-full px-3 py-1.5 shadow-sm text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
              <select
                id="catalog-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-semibold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name">Alfabético (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div
            id="catalog-grid"
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
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

            {/* The special "card-more" from user template */}
            <article
              id="card-more"
              data-category="accesorios"
              className="bg-[#20201e] text-white rounded-[1.5rem] shadow-xl p-8 flex flex-col justify-between min-h-[365px] border border-stone-800 hover:-translate-y-1.5 transition-transform"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-[#d89c35]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p
                  id="label-more"
                  className="mt-6 text-[#d89c35] text-xs font-bold uppercase tracking-[0.14em]"
                >
                  Servicio Personalizado
                </p>
                <h3
                  id="title-more"
                  className="display-font mt-2 text-2xl sm:text-3xl font-bold text-white"
                >
                  ¿No encuentras lo que buscas?
                </h3>
                <p
                  id="description-more"
                  className="mt-3 text-sm text-stone-300 leading-relaxed"
                >
                  Traemos piezas por encargo especial, conseguimos fragancias exclusivas y renovamos
                  nuestro stock semanalmente. ¡Escríbenos con la foto de lo que deseas!
                </p>
              </div>

              <a
                id="more-contact"
                href={customOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex self-start items-center gap-2 rounded-full bg-[#f7f1e8] text-[#20201e] px-5 py-3 font-bold text-sm shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all"
              >
                <span id="more-contact-text">Preguntar por más</span>
                <ArrowUpRight className="w-4 h-4 text-[#ce5d45]" />
              </a>
            </article>
          </div>
        ) : (
          <div className="mt-12 text-center py-16 bg-white/60 border border-stone-200 rounded-3xl p-8">
            <p className="text-4xl">🔍</p>
            <h3 className="display-font text-2xl font-bold text-[#20201e] mt-3">
              No encontramos productos con ese criterio
            </h3>
            <p className="text-stone-600 text-sm mt-2 max-w-md mx-auto">
              Intenta con otra palabra clave o restablece los filtros para ver todo nuestro catálogo disponible.
            </p>
            <button
              onClick={() => {
                onSearchChange('');
                setSelectedCategory('all');
              }}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#20201e] text-white text-xs font-bold shadow-md hover:bg-[#ce5d45] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ver todos los productos</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
