import { useState, useEffect } from 'react';
import { MessageCircle, ShoppingBag, Check, Barcode, Plus, X } from 'lucide-react';
import {
  Product,
  CartItem,
  FirestoreOrder,
  Currency,
  Sale,
  Expense,
  StoreSettings,
} from './types';
import { PRODUCTS as STATIC_PRODUCTS } from './data/products';
import {
  subscribeToProducts,
  subscribeToStoreSettings,
  updateStoreSettingsInFirestore,
  subscribeToOrders,
  subscribeToSales,
  subscribeToExpenses,
} from './services/storeService';
import { DEFAULT_EXCHANGE_RATE } from './utils/currency';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CatalogSection } from './components/CatalogSection';
import { HowToBuy } from './components/HowToBuy';
import { ContactBanner } from './components/ContactBanner';
import { Footer } from './components/Footer';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { WhatsAppConfigModal } from './components/WhatsAppConfigModal';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { PhoneAppShell } from './components/PhoneAppShell';
import { BottomTabBar } from './components/BottomTabBar';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const CART_STORAGE_KEY = 'variedadescs_cart';
const FAVORITES_STORAGE_KEY = 'variedadescs_favorites';
const PHONE_STORAGE_KEY = 'variedadescs_whatsapp_phone';
const CURRENCY_STORAGE_KEY = 'variedadescs_currency';
const DEFAULT_PHONE = '584120000000';

export default function App() {
  // Live Firestore state
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS);
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    whatsAppNumber: DEFAULT_PHONE,
    exchangeRate: DEFAULT_EXCHANGE_RATE,
    adminPin: '1234',
  });

  // Currency selection state: 'USD' or 'NIO' (Córdobas)
  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      return saved === 'NIO' ? 'NIO' : 'USD';
    } catch {
      return 'USD';
    }
  });

  // Persistence state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [whatsAppNumber, setWhatsAppNumber] = useState<string>(() => {
    return localStorage.getItem(PHONE_STORAGE_KEY) || DEFAULT_PHONE;
  });

  // UI state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isWhatsAppConfigOpen, setIsWhatsAppConfigOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isDesktopStandalone, setIsDesktopStandalone] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isPinned = localStorage.getItem('variedadescs_desktop_admin_only') === 'true';
      return (
        isPinned ||
        params.get('admin') === 'true' ||
        params.get('pos') === 'true' ||
        window.location.hash === '#admin'
      );
    } catch {
      return false;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileScannerOpen, setIsMobileScannerOpen] = useState(false);
  const [unregisteredBarcodeScanned, setUnregisteredBarcodeScanned] = useState<string | null>(null);
  const [adminInitialBarcode, setAdminInitialBarcode] = useState<string | null>(null);

  // Automatically activate Admin on PC if configured or standalone requested
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user && isDesktopStandalone) {
        setIsAdminPanelOpen(true);
        setIsAdminLoginOpen(false);
      } else if (!user && isDesktopStandalone) {
        setIsAdminLoginOpen(true);
      }
    });
    return () => unsubAuth();
  }, [isDesktopStandalone]);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubProducts = subscribeToProducts((loadedProducts) => {
      if (loadedProducts && loadedProducts.length > 0) {
        setProducts(loadedProducts);
      }
    });

    const unsubSettings = subscribeToStoreSettings((settings) => {
      if (settings) {
        setStoreSettings(settings);
        if (settings.whatsAppNumber) {
          setWhatsAppNumber(settings.whatsAppNumber);
        }
      }
    });

    const unsubOrders = subscribeToOrders((ordersList) => {
      setOrders(ordersList);
      setIsOrdersLoading(false);
    });

    const unsubSales = subscribeToSales((salesList) => {
      setSales(salesList);
    });

    const unsubExpenses = subscribeToExpenses((expensesList) => {
      setExpenses(expensesList);
    });

    return () => {
      unsubProducts();
      unsubSettings();
      unsubOrders();
      unsubSales();
      unsubExpenses();
    };
  }, []);

  // Hidden Admin access shortcuts:
  // 1. Keyboard shortcuts: Ctrl+Alt+A, Ctrl+Shift+A, Alt+P
  // 2. URL parameter: ?admin=true or hash #admin
  // 3. Secret 5-taps on the brand logo in the top navbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlAltA = (e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'a';
      const isCtrlShiftA = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a';
      const isAltP = e.altKey && e.key.toLowerCase() === 'p';

      if (isCtrlAltA || isCtrlShiftA || isAltP) {
        e.preventDefault();
        setIsAdminLoginOpen(true);
      }
    };

    const checkUrlForAdmin = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const isPinned = localStorage.getItem('variedadescs_desktop_admin_only') === 'true';
        const hasAdminParam =
          params.get('admin') === 'true' ||
          params.has('admin') ||
          params.get('pos') === 'true' ||
          window.location.hash === '#admin';

        if (isPinned || hasAdminParam) {
          setIsDesktopStandalone(true);
          setIsAdminLoginOpen(true);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkUrlForAdmin();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', checkUrlForAdmin);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', checkUrlForAdmin);
    };
  }, []);

  // Toggle currency between USD and NIO
  const handleToggleCurrency = () => {
    setCurrency((prev) => {
      const next = prev === 'USD' ? 'NIO' : 'USD';
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, next);
      } catch (e) {
        console.error(e);
      }
      showToast(
        next === 'NIO'
          ? `Precios mostrados en Córdobas (C$) • Tasa: 1$ = C$${(storeSettings.exchangeRate || DEFAULT_EXCHANGE_RATE).toFixed(2)}`
          : 'Precios mostrados en Dólares ($ USD)'
      );
      return next;
    });
  };

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    quantity = 1,
    size?: string,
    color?: string
  ) => {
    const chosenSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined);
    const chosenColor = color || (product.colors && product.colors.length > 0 ? product.colors[0] : undefined);

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.product.id === product.id &&
          i.selectedSize === chosenSize &&
          i.selectedColor === chosenColor
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity,
          selectedSize: chosenSize,
          selectedColor: chosenColor,
        },
      ];
    });

    showToast(`¡"${product.name}" añadido al carrito!`);
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Favorites operations
  const handleToggleFavorite = (product: Product) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast('Eliminado de tus favoritos');
        return prev.filter((p) => p.id !== product.id);
      } else {
        showToast('Guardado en tus favoritos ❤️');
        return [...prev, product];
      }
    });
  };

  const handleSavePhone = async (phone: string) => {
    setWhatsAppNumber(phone);
    localStorage.setItem(PHONE_STORAGE_KEY, phone);
    try {
      await updateStoreSettingsInFirestore({ whatsAppNumber: phone });
    } catch (e) {
      console.warn('Could not sync phone to Firestore:', e);
    }
    showToast('Número de WhatsApp sincronizado en Firebase');
  };

  const handleOrderSaved = (orderCode: string) => {
    showToast(`¡Pedido #${orderCode} registrado en Firebase!`);
  };

  const totalCartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '');
  const floatingWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    '¡Hola VariedadesCS! Me gustaría información sobre sus productos disponibles.'
  )}`;

  const scrollToCatalog = () => {
    const el = document.getElementById('catalogo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    const el = document.getElementById('inicio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMobileScan = (scannedCode: string) => {
    setIsMobileScannerOpen(false);
    const clean = scannedCode.trim();
    if (!clean) return;

    // Look for product in catalog
    const cleanLower = clean.toLowerCase();
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === cleanLower) ||
        p.id.toLowerCase() === cleanLower ||
        p.name.toLowerCase().includes(cleanLower)
    );

    if (found) {
      setSelectedProduct(found);
      setUnregisteredBarcodeScanned(null);
      showToast(`¡Producto encontrado: ${found.name}!`);
    } else {
      setUnregisteredBarcodeScanned(clean);
      setSearchQuery(clean);
      scrollToCatalog();
      showToast(`Código escaneado: ${clean}`);
    }
  };

  return (
    <PhoneAppShell>
      <div id="__page-root" className="min-h-full paper-grain flex flex-col font-sans text-[#20201e] pb-24 relative">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#20201e] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-full shadow-2xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <Navbar
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          favorites={favorites}
          onOpenFavorites={() => setIsFavoritesOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          whatsAppNumber={whatsAppNumber}
          onOpenWhatsAppConfig={() => setIsWhatsAppConfigOpen(true)}
          ordersCount={orders.length}
          onOpenOrders={() => setIsOrdersOpen(true)}
          currency={currency}
          onToggleCurrency={handleToggleCurrency}
          exchangeRate={storeSettings.exchangeRate || DEFAULT_EXCHANGE_RATE}
          onOpenAdmin={() => setIsAdminLoginOpen(true)}
        />

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero */}
          <Hero
            whatsAppNumber={whatsAppNumber}
            onExploreCatalog={scrollToCatalog}
          />

          {/* Product Catalog */}
          <CatalogSection
            products={products}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={handleAddToCart}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            whatsAppNumber={whatsAppNumber}
            currency={currency}
            exchangeRate={storeSettings.exchangeRate || DEFAULT_EXCHANGE_RATE}
          />

          {/* How to Buy */}
          <HowToBuy />

          {/* Contact Banner */}
          <ContactBanner whatsAppNumber={whatsAppNumber} />
        </main>

        {/* Footer */}
        <Footer
          onOpenWhatsAppConfig={() => setIsWhatsAppConfigOpen(true)}
          whatsAppNumber={whatsAppNumber}
          ordersCount={orders.length}
          onOpenOrders={() => setIsOrdersOpen(true)}
          onOpenAdmin={() => setIsAdminLoginOpen(true)}
        />

        {/* Floating WhatsApp Chat (positioned above bottom tab bar) */}
        <div className="fixed bottom-20 right-4 z-30">
          <a
            id="floating-whatsapp-btn"
            href={floatingWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] text-white shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none ring-2 ring-white/50"
            title="Atención directa por WhatsApp"
          >
            <MessageCircle className="w-6 h-6 fill-white" />
          </a>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <BottomTabBar
          cartCount={totalCartCount}
          favoritesCount={favorites.length}
          onScrollToTop={scrollToTop}
          onScrollToCatalog={scrollToCatalog}
          onOpenScanner={() => setIsMobileScannerOpen(true)}
          onOpenFavorites={() => setIsFavoritesOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
        />

        {/* Quick Camera Barcode Scanner for Customers / Mobile */}
        {isMobileScannerOpen && (
          <BarcodeScannerModal
            isOpen={isMobileScannerOpen}
            onClose={() => setIsMobileScannerOpen(false)}
            onScan={handleMobileScan}
            title="Escanear Producto"
            description="Apunta la cámara del teléfono a la etiqueta de la prenda o caja para ver detalles y precio"
          />
        )}

        {/* Modals & Drawers */}
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          isFavorite={Boolean(selectedProduct && favorites.some((f) => f.id === selectedProduct.id))}
          onToggleFavorite={handleToggleFavorite}
          whatsAppNumber={whatsAppNumber}
          currency={currency}
          exchangeRate={storeSettings.exchangeRate || DEFAULT_EXCHANGE_RATE}
        />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          whatsAppNumber={whatsAppNumber}
          onOrderSaved={handleOrderSaved}
          currency={currency}
          exchangeRate={storeSettings.exchangeRate || DEFAULT_EXCHANGE_RATE}
        />

        <FavoritesDrawer
          isOpen={isFavoritesOpen}
          onClose={() => setIsFavoritesOpen(false)}
          favorites={favorites}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onAddToCart={handleAddToCart}
          onRemoveFavorite={handleToggleFavorite}
        />

        <WhatsAppConfigModal
          isOpen={isWhatsAppConfigOpen}
          onClose={() => setIsWhatsAppConfigOpen(false)}
          currentNumber={whatsAppNumber}
          onSaveNumber={handleSavePhone}
        />

        <CustomerOrdersModal
          isOpen={isOrdersOpen}
          onClose={() => setIsOrdersOpen(false)}
          allOrders={orders}
          whatsAppNumber={whatsAppNumber}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        />

        {/* Hidden Admin Login Modal */}
        {isAdminLoginOpen && (
          <AdminLoginModal
            isOpen={isAdminLoginOpen}
            onClose={() => setIsAdminLoginOpen(false)}
            adminEmail={storeSettings.adminEmail || 'variedadescs.online@gmail.com'}
            expectedPin={storeSettings.adminPin || '1234'}
            onSuccess={() => {
              setIsAdminLoginOpen(false);
              setIsAdminPanelOpen(true);
            }}
          />
        )}

        {/* Hidden Admin Management Control Panel */}
        {isAdminPanelOpen && (
          <AdminPanelModal
            isOpen={isAdminPanelOpen}
            onClose={() => {
              setIsAdminPanelOpen(false);
              setAdminInitialBarcode(null);
            }}
            products={products}
            sales={sales}
            expenses={expenses}
            settings={storeSettings}
            initialBarcodeForProduct={adminInitialBarcode}
            onClearInitialBarcode={() => setAdminInitialBarcode(null)}
            orders={orders}
            isStandalone={isDesktopStandalone}
            onExitStandalone={() => {
              setIsDesktopStandalone(false);
              setIsAdminPanelOpen(false);
              try {
                localStorage.setItem('variedadescs_desktop_admin_only', 'false');
              } catch {}
            }}
            onUpdateSettings={(newSettings) => {
              setStoreSettings((prev) => ({ ...prev, ...newSettings }));
            }}
          />
        )}

        {/* Floating action card when an unknown factory barcode is scanned */}
        {unregisteredBarcodeScanned && (
          <div className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-40 bg-[#20201e] text-white p-4 rounded-2xl shadow-2xl border border-stone-700 animate-in fade-in slide-in-from-bottom">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ce5d45] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Barcode className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-200">Etiqueta de fábrica detectada</p>
                  <p className="font-mono text-sm text-[#d89c35] font-black tracking-wider">
                    {unregisteredBarcodeScanned}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnregisteredBarcodeScanned(null)}
                className="text-stone-400 hover:text-white p-1"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-stone-300 mt-2">
              Este código de producto aún no está registrado. ¿Deseas darlo de alta usando este mismo código de su etiqueta?
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  setAdminInitialBarcode(unregisteredBarcodeScanned);
                  setUnregisteredBarcodeScanned(null);
                  setIsAdminLoginOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#ce5d45] hover:bg-[#b54c35] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Producto con este Código</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </PhoneAppShell>
  );
}
