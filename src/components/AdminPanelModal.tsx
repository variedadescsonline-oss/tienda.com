import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Barcode,
  Search,
  CheckCircle2,
  Printer,
  ShoppingBag,
  RefreshCw,
  Sliders,
  Calendar,
  Lock,
  ArrowRightLeft,
  Sparkles,
  Receipt,
  FileText,
  Scan,
  LogOut,
  Camera,
  MessageCircle,
  Check,
  ExternalLink,
  Clock,
  AlertTriangle,
  Eye,
  Laptop,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut, User, onAuthStateChanged } from 'firebase/auth';
import {
  Product,
  CategoryId,
  Sale,
  Expense,
  ExpenseCategory,
  StoreSettings,
  SaleItem,
  Currency,
  FirestoreOrder,
} from '../types';
import {
  saveProductToFirestore,
  deleteProductFromFirestore,
  generateBarcode,
  recordSaleInFirestore,
  deleteSaleFromFirestore,
  recordExpenseInFirestore,
  deleteExpenseFromFirestore,
  updateStoreSettingsInFirestore,
  confirmOrderSale,
  updateOrderStatus,
} from '../services/storeService';
import {
  formatUSD,
  formatNIO,
  usdToNio,
  nioToUsd,
  DEFAULT_EXCHANGE_RATE,
} from '../utils/currency';
import { BarcodeRenderer } from './BarcodeRenderer';
import { ProductImageUploader } from './ProductImageUploader';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { playScannerBeep } from '../utils/audioBeep';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  settings: StoreSettings;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => void;
  initialBarcodeForProduct?: string | null;
  onClearInitialBarcode?: () => void;
  orders?: FirestoreOrder[];
  isStandalone?: boolean;
  onExitStandalone?: () => void;
}

type TabType = 'pos' | 'orders' | 'products' | 'expenses' | 'finances' | 'settings';

const CATEGORY_OPTIONS: { id: CategoryId; label: string }[] = [
  { id: 'ropa', label: 'Ropa & Moda' },
  { id: 'lenceria', label: 'Lencería & Íntimo' },
  { id: 'perfumes', label: 'Perfumería Original' },
  { id: 'bolsos', label: 'Bolsos & Carteras' },
  { id: 'gorras', label: 'Gorras & Accesorios' },
];

const PRESET_IMAGES = [
  {
    label: 'Vestido Floral',
    url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800',
  },
  {
    label: 'Blusa Seda',
    url: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=800',
  },
  {
    label: 'Perfume Elegante',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800',
  },
  {
    label: 'Bolso Cuero',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800',
  },
  {
    label: 'Gorra Urbana',
    url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800',
  },
  {
    label: 'Lencería Encaje',
    url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=800',
  },
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  products,
  sales,
  expenses,
  settings,
  onUpdateSettings,
  initialBarcodeForProduct,
  onClearInitialBarcode,
  orders = [],
  isStandalone = false,
  onExitStandalone,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pos');
  const [exchangeRate, setExchangeRate] = useState<number>(
    settings.exchangeRate || DEFAULT_EXCHANGE_RATE
  );
  const [isDesktopAdminPinned, setIsDesktopAdminPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('variedadescs_desktop_admin_only') === 'true';
    } catch {
      return false;
    }
  });

  // Orders confirmation & management state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'nuevo' | 'completado'>('all');
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [confirmedSaleSuccess, setConfirmedSaleSuccess] = useState<string | null>(null);

  const handleConfirmOrderSale = async (order: FirestoreOrder) => {
    setConfirmingOrderId(order.id);
    try {
      await confirmOrderSale(order, exchangeRate);
      setConfirmedSaleSuccess(`¡Venta #${order.orderCode} confirmada exitosamente! Se descontó el inventario y se registró como venta realizada.`);
      setTimeout(() => setConfirmedSaleSuccess(null), 4000);
    } catch (err) {
      console.error('Error confirming order sale:', err);
      alert('Error al confirmar la venta. Inténtalo nuevamente.');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: FirestoreOrder['status']) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleNotifyCustomer = (order: FirestoreOrder) => {
    const cleanCustomerPhone = (order.customer.phone || '').replace(/\D/g, '');
    const msg = `¡Hola ${order.customer.name}! 👋 Te confirmamos desde *VariedadesCS* que tu pedido *#${order.orderCode}* ha sido verificado y confirmado con éxito. 🎉\n\nTotal: $${order.total.toFixed(2)}${order.totalNIO ? ` (C$ ${order.totalNIO.toFixed(0)})` : ''}\nEntrega en: ${order.customer.city || ''} ${order.customer.address || ''}\n\n¡Muchas gracias por tu compra! En breve te coordinamos la entrega. ✨`;
    const targetUrl = cleanCustomerPhone
      ? `https://wa.me/${cleanCustomerPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/${(settings.whatsAppNumber || '50585062737').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Sync exchange rate when settings update
  useEffect(() => {
    if (settings.exchangeRate) {
      setExchangeRate(settings.exchangeRate);
    }
  }, [settings.exchangeRate]);

  // Current Google Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  const handleSignOutAdmin = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (e) {
      console.error('Error signing out:', e);
      onClose();
    }
  };

  // Product editing / creation state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    category: CategoryId;
    categoryLabel: string;
    priceUSD: string;
    priceNIO: string;
    originalPriceUSD: string;
    stock: string;
    barcode: string;
    image: string;
    description: string;
    sizes: string;
    colors: string;
    badge: string;
    inStock: boolean;
    featured: boolean;
  }>({
    name: '',
    category: 'ropa',
    categoryLabel: 'Ropa & Moda',
    priceUSD: '',
    priceNIO: '',
    originalPriceUSD: '',
    stock: '15',
    barcode: '',
    image: PRESET_IMAGES[0].url,
    description: '',
    sizes: 'S, M, L',
    colors: 'Negro, Blanco',
    badge: 'Nuevo',
    inStock: true,
    featured: false,
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // POS State
  const [posBarcodeQuery, setPosBarcodeQuery] = useState('');
  const [posProductSearch, setPosProductSearch] = useState('');
  const [posCart, setPosCart] = useState<SaleItem[]>([]);
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<
    'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Pago Móvil'
  >('Efectivo');
  const [posPaymentCurrency, setPosPaymentCurrency] = useState<'NIO' | 'USD' | 'MIXTO'>('NIO');
  const [posAmountPaid, setPosAmountPaid] = useState<string>('');
  const [posNotes, setPosNotes] = useState('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState<Sale | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Camera Barcode Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'pos' | 'product-form' | 'product-list' | 'new-product'>('pos');
  const [scannerContinuous, setScannerContinuous] = useState(true);
  const [scannerLastFeedback, setScannerLastFeedback] = useState<{
    code: string;
    productName?: string;
    success: boolean;
  } | null>(null);
  const [scannedNotification, setScannedNotification] = useState<string | null>(null);
  const [unregisteredScannedCode, setUnregisteredScannedCode] = useState<string | null>(null);

  // Expense State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Mercancía / Stock');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState<'USD' | 'NIO'>('NIO');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Settings State
  const [tempExchangeRate, setTempExchangeRate] = useState(String(exchangeRate));
  const [tempAdminPin, setTempAdminPin] = useState(settings.adminPin || '1234');
  const [tempWhatsApp, setTempWhatsApp] = useState(settings.whatsAppNumber || '584120000000');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Product List Search & Filter
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState<string>('all');

  // POS Calculations
  const posTotalUSD = posCart.reduce((sum, it) => sum + it.priceUSD * it.quantity, 0);
  const posTotalNIO = usdToNio(posTotalUSD, exchangeRate);

  const amountPaidNum = Number(posAmountPaid) || 0;
  let posChangeNIO = 0;
  let posChangeUSD = 0;

  if (posPaymentCurrency === 'NIO') {
    posChangeNIO = Math.max(0, amountPaidNum - posTotalNIO);
    posChangeUSD = nioToUsd(posChangeNIO, exchangeRate);
  } else if (posPaymentCurrency === 'USD') {
    posChangeUSD = Math.max(0, amountPaidNum - posTotalUSD);
    posChangeNIO = usdToNio(posChangeUSD, exchangeRate);
  }

  const addPosItem = (product: Product) => {
    const existingIndex = posCart.findIndex((i) => i.productId === product.id);
    const nioPrice = usdToNio(product.price, exchangeRate);
    const currentQty = existingIndex >= 0 ? posCart[existingIndex].quantity : 0;
    const availableStock = product.stock !== undefined ? product.stock : 10;
    const remainingAfterAdd = availableStock - (currentQty + 1);

    if (availableStock <= 0) {
      playScannerBeep(false);
      setScannedNotification(`⚠️ "${product.name}" sin inventario (Stock 0). Añadido con advertencia.`);
    } else {
      playScannerBeep(true);
      setScannedNotification(
        `🛒 ${product.name} escaneado. Stock restante: ${remainingAfterAdd >= 0 ? remainingAfterAdd : 0}`
      );
    }
    setTimeout(() => setScannedNotification(null), 3500);

    if (existingIndex >= 0) {
      setPosCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setPosCart((prev) => [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          priceUSD: product.price,
          priceNIO: nioPrice,
          quantity: 1,
          selectedSize: product.sizes?.[0] || 'Única',
          selectedColor: product.colors?.[0] || 'Estándar',
          barcode: product.barcode,
          image: product.image,
        },
      ]);
    }
  };

  // Handle barcode quick scan / enter
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = posBarcodeQuery.trim();
    if (!query) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query.toLowerCase()) ||
        p.id.toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      addPosItem(matched);
      setPosBarcodeQuery('');
      setUnregisteredScannedCode(null);
    } else {
      playScannerBeep(false);
      setUnregisteredScannedCode(query);
      setScannedNotification(`Código "${query}" no registrado`);
      setTimeout(() => setScannedNotification(null), 3500);
    }
  };

  // Hardware barcode scanner gun listener (USB / Bluetooth / Keyboard Wedge) + F2/F4 Hotkeys
  useEffect(() => {
    if (!isOpen && !isStandalone) return;
    if (activeTab !== 'pos') return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Hotkey F2: open camera scanner
      if (e.key === 'F2') {
        e.preventDefault();
        setScannerTarget('pos');
        setScannerContinuous(true);
        setIsScannerOpen(true);
        return;
      }
      // Hotkey F4: reset sale
      if (e.key === 'F4') {
        e.preventDefault();
        setPosCart([]);
        setPosAmountPaid('');
        setPosNotes('');
        playScannerBeep(true);
        setScannedNotification('🧹 Venta reiniciada');
        setTimeout(() => setScannedNotification(null), 2500);
        return;
      }

      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      // When Enter is pressed and buffer has characters
      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          const scannedCode = buffer.trim();
          buffer = '';
          const matched = products.find(
            (p) =>
              (p.barcode && p.barcode.toLowerCase() === scannedCode.toLowerCase()) ||
              p.id.toLowerCase() === scannedCode.toLowerCase()
          );
          if (matched) {
            addPosItem(matched);
            setUnregisteredScannedCode(null);
          } else {
            playScannerBeep(false);
            setUnregisteredScannedCode(scannedCode);
            setScannedNotification(`Código "${scannedCode}" no registrado`);
            setTimeout(() => setScannedNotification(null), 3500);
          }
          if (!isInput) e.preventDefault();
        }
        buffer = '';
        return;
      }

      // Barcode scanner guns type within < 50ms per key
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (diff > 55 && !isInput) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, isStandalone, activeTab, products]);

  const updatePosItemQty = (index: number, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((item, idx) => {
          if (idx === index) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SaleItem[]
    );
  };

  const handleCompleteSale = async () => {
    if (posCart.length === 0 || isSubmittingSale) return;

    try {
      setIsSubmittingSale(true);
      const code = `VTA-${Math.floor(1000 + Math.random() * 9000)}`;
      const salePayload: Omit<Sale, 'id' | 'createdAt'> = {
        saleCode: code,
        customerName: posCustomerName.trim() || 'Cliente Mostrador',
        items: posCart,
        totalUSD: posTotalUSD,
        totalNIO: posTotalNIO,
        exchangeRate: exchangeRate,
        paymentMethod: posPaymentMethod,
        paymentCurrency: posPaymentCurrency,
        amountPaidUSD:
          posPaymentCurrency === 'USD' ? amountPaidNum : nioToUsd(amountPaidNum, exchangeRate),
        amountPaidNIO:
          posPaymentCurrency === 'NIO' ? amountPaidNum : usdToNio(amountPaidNum, exchangeRate),
        changeGivenUSD: posChangeUSD > 0 ? posChangeUSD : undefined,
        changeGivenNIO: posChangeNIO > 0 ? posChangeNIO : undefined,
        notes: posNotes.trim(),
        date: new Date().toISOString().split('T')[0],
      };

      await recordSaleInFirestore(salePayload);

      setLastSaleReceipt({
        ...salePayload,
        id: 'rec-' + Date.now(),
        createdAt: new Date(),
      });

      // Clear POS cart
      setPosCart([]);
      setPosCustomerName('');
      setPosAmountPaid('');
      setPosNotes('');
    } catch (err) {
      console.error('Error recording sale:', err);
      alert('Error al registrar la venta. Revisa la conexión.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Open Product Editor (optionally with scanned factory barcode pre-filled)
  const openNewProductModal = (prefilledBarcode?: string) => {
    // If a factory barcode was scanned or passed, use it; otherwise allow scanning or generating
    const codeToUse = prefilledBarcode ? prefilledBarcode.trim() : '';
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'ropa',
      categoryLabel: 'Ropa & Moda',
      priceUSD: '',
      priceNIO: '',
      originalPriceUSD: '',
      stock: '15',
      barcode: codeToUse,
      image: PRESET_IMAGES[0].url,
      description: '',
      sizes: 'S, M, L',
      colors: 'Negro, Blanco',
      badge: 'Nuevo',
      inStock: true,
      featured: false,
    });
    setIsProductModalOpen(true);
  };

  // Auto-open product registration if a factory barcode was scanned externally
  useEffect(() => {
    if (initialBarcodeForProduct && isOpen) {
      setActiveTab('products');
      openNewProductModal(initialBarcodeForProduct);
      if (onClearInitialBarcode) {
        onClearInitialBarcode();
      }
    }
  }, [initialBarcodeForProduct, isOpen]);

  // Camera Barcode Scanner handler
  const handleScannerResult = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    if (scannerTarget === 'new-product') {
      openNewProductModal(cleanCode);
      setScannedNotification(`Código de fábrica capturado: ${cleanCode}`);
      setTimeout(() => setScannedNotification(null), 3500);
      setIsScannerOpen(false);
      return;
    }

    if (scannerTarget === 'product-form') {
      setProductForm((prev) => ({ ...prev, barcode: cleanCode }));
      setScannedNotification(`Código de fábrica escaneado: ${cleanCode}`);
      setTimeout(() => setScannedNotification(null), 3500);
      setIsScannerOpen(false);
    } else if (scannerTarget === 'product-list') {
      setProdSearch(cleanCode);
      setScannedNotification(`Buscando código: ${cleanCode}`);
      setTimeout(() => setScannedNotification(null), 3500);
      setIsScannerOpen(false);
    } else if (scannerTarget === 'pos') {
      const matched = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === cleanCode.toLowerCase()) ||
          p.id.toLowerCase() === cleanCode.toLowerCase()
      );

      if (matched) {
        addPosItem(matched);
        setScannerLastFeedback({
          code: cleanCode,
          productName: matched.name,
          success: true,
        });
        setUnregisteredScannedCode(null);
        setScannedNotification(`¡Añadido al carrito: ${matched.name}!`);
        setTimeout(() => setScannedNotification(null), 3000);
      } else {
        setScannerLastFeedback({
          code: cleanCode,
          productName: 'No registrado en inventario',
          success: false,
        });
        setUnregisteredScannedCode(cleanCode);
        setScannedNotification(`Código ${cleanCode} no registrado`);
      }
    }
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      categoryLabel: product.categoryLabel,
      priceUSD: String(product.price),
      priceNIO: String(usdToNio(product.price, exchangeRate)),
      originalPriceUSD: product.originalPrice ? String(product.originalPrice) : '',
      stock: String(product.stock ?? 10),
      barcode: product.barcode || generateBarcode(),
      image: product.image,
      description: product.description,
      sizes: (product.sizes || []).join(', '),
      colors: (product.colors || []).join(', '),
      badge: product.badge || '',
      inStock: product.inStock,
      featured: product.featured || false,
    });
    setIsProductModalOpen(true);
  };

  const handlePriceUSDChange = (val: string) => {
    const num = parseFloat(val);
    setProductForm((prev) => ({
      ...prev,
      priceUSD: val,
      priceNIO: !isNaN(num) ? String(usdToNio(num, exchangeRate)) : '',
    }));
  };

  const handlePriceNIOChange = (val: string) => {
    const num = parseFloat(val);
    setProductForm((prev) => ({
      ...prev,
      priceNIO: val,
      priceUSD: !isNaN(num) ? String(nioToUsd(num, exchangeRate)) : '',
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.priceUSD || isSubmittingProduct) return;

    try {
      setIsSubmittingProduct(true);
      const usdVal = parseFloat(productForm.priceUSD) || 0;
      const originalVal = productForm.originalPriceUSD
        ? parseFloat(productForm.originalPriceUSD)
        : undefined;
      const stockVal = parseInt(productForm.stock) || 0;

      const categoryObj = CATEGORY_OPTIONS.find((c) => c.id === productForm.category);

      const payload: Omit<Product, 'id'> = {
        name: productForm.name.trim(),
        category: productForm.category,
        categoryLabel: categoryObj ? categoryObj.label : 'Moda',
        price: usdVal,
        originalPrice: originalVal,
        barcode: productForm.barcode.trim() || generateBarcode(),
        stock: stockVal,
        image: productForm.image.trim() || PRESET_IMAGES[0].url,
        badge: productForm.badge.trim() || undefined,
        description: productForm.description.trim() || 'Prenda de alta calidad de VariedadesCS.',
        details: ['Calidad garantizada', 'Material premium', 'Disponible para envío inmediato'],
        sizes: productForm.sizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        colors: productForm.colors
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        inStock: productForm.inStock,
        featured: productForm.featured,
      };

      await saveProductToFirestore(payload, editingProduct?.id);
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error al guardar el producto.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`¿Seguro que deseas eliminar "${name}" del catálogo?`)) {
      try {
        await deleteProductFromFirestore(id);
      } catch (e) {
        console.error('Error deleting product:', e);
      }
    }
  };

  // Add Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expenseTitle.trim() || isNaN(amt) || amt <= 0 || isSubmittingExpense) return;

    try {
      setIsSubmittingExpense(true);
      let amtUSD = 0;
      let amtNIO = 0;

      if (expenseCurrency === 'NIO') {
        amtNIO = amt;
        amtUSD = nioToUsd(amt, exchangeRate);
      } else {
        amtUSD = amt;
        amtNIO = usdToNio(amt, exchangeRate);
      }

      await recordExpenseInFirestore({
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: amt,
        currency: expenseCurrency,
        amountUSD: amtUSD,
        amountNIO: amtNIO,
        date: expenseDate,
        notes: expenseNotes.trim(),
      });

      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseNotes('');
    } catch (e) {
      console.error('Error recording expense:', e);
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(tempExchangeRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      alert('Ingresa una tasa de cambio válida mayor a 0');
      return;
    }

    try {
      const updated: Partial<StoreSettings> = {
        exchangeRate: rateNum,
        adminPin: tempAdminPin.trim() || '1234',
        whatsAppNumber: tempWhatsApp.trim(),
      };
      await updateStoreSettingsInFirestore(updated);
      onUpdateSettings(updated);
      setExchangeRate(rateNum);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (e) {
      console.error('Error updating settings:', e);
    }
  };

  // Filtered products in list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(prodSearch)) ||
        p.categoryLabel.toLowerCase().includes(prodSearch.toLowerCase());
      const matchesCat = prodCategoryFilter === 'all' || p.category === prodCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, prodSearch, prodCategoryFilter]);

  // Financial calculations
  const totalSalesUSD = sales.reduce((sum, s) => sum + (s.totalUSD || 0), 0);
  const totalSalesNIO = sales.reduce((sum, s) => sum + (s.totalNIO || 0), 0);
  const totalExpensesUSD = expenses.reduce((sum, e) => sum + (e.amountUSD || 0), 0);
  const totalExpensesNIO = expenses.reduce((sum, e) => sum + (e.amountNIO || 0), 0);
  const netProfitUSD = totalSalesUSD - totalExpensesUSD;
  const netProfitNIO = totalSalesNIO - totalExpensesNIO;

  if (!isOpen) return null;

  return (
    <div
      id="admin-panel-backdrop"
      className={
        isStandalone
          ? 'fixed inset-0 z-50 flex flex-col bg-[#f7f2ea] overflow-hidden'
          : 'fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in'
      }
    >
      <div
        id="admin-panel-container"
        className={
          isStandalone
            ? 'relative w-full h-full bg-[#f7f2ea] flex flex-col overflow-hidden'
            : 'relative w-full max-w-6xl bg-[#f7f2ea] rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-stone-300 flex flex-col h-[100dvh] sm:h-[95vh] max-h-[100dvh] sm:max-h-[95vh] overflow-hidden'
        }
      >
        {/* Standalone Desktop Top Status Bar */}
        {isStandalone && (
          <div className="bg-[#191918] text-stone-300 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-2.5 font-medium">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Terminal Administrador & POS
              </span>
              <span className="hidden sm:inline text-stone-500">•</span>
              <span className="hidden sm:inline text-stone-300 font-bold">Modo Computadora Activo</span>
              <span className="hidden lg:inline-flex items-center gap-1.5 text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md font-mono border border-stone-700">
                <span>[F2] Cámara Escáner</span>
                <span>•</span>
                <span>[F4] Nueva Venta</span>
                <span>•</span>
                <span>Pistola USB: Lista</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-stone-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={isDesktopAdminPinned}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsDesktopAdminPinned(checked);
                    try {
                      localStorage.setItem('variedadescs_desktop_admin_only', checked ? 'true' : 'false');
                    } catch {}
                  }}
                  className="rounded accent-[#ce5d45] w-3.5 h-3.5"
                />
                <span className="font-semibold">Fijar solo administrador en esta PC</span>
              </label>

              {onExitStandalone && (
                <button
                  type="button"
                  onClick={onExitStandalone}
                  className="px-3 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-stone-700 transition-colors shadow-2xs"
                  title="Ver cómo los clientes ven la tienda pública"
                >
                  <Eye className="w-3.5 h-3.5 text-[#d89c35]" />
                  <span>Ver Tienda de Clientes</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Navigation Bar */}
        <div className="bg-[#20201e] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#fba0c7] border border-pink-300/60 shadow-sm flex items-center justify-center shrink-0">
              <img src="/logo.jpg" alt="VariedadesCS" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="display-font text-lg sm:text-xl font-black text-white">
                  VariedadesCS • Administración
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  Tasa: 1$ = C${exchangeRate.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Control de inventario, ventas, gastos y códigos de barra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center bg-stone-800 rounded-xl px-2.5 py-1 text-xs text-stone-300 gap-2">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#d89c35]" />
              <span>
                1 USD = <strong className="text-white">C$ {exchangeRate.toFixed(2)}</strong>
              </span>
            </div>

            {currentUser && (
              <div
                id="admin-current-user-pill"
                className="flex items-center gap-2 bg-stone-800/90 hover:bg-stone-800 border border-stone-700/60 rounded-full py-1 pl-1.5 pr-2.5 text-xs text-stone-200"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Admin'}
                    className="w-5 h-5 rounded-full object-cover border border-emerald-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:inline text-[11px] font-medium truncate max-w-[130px]" title={currentUser.email || ''}>
                  {currentUser.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOutAdmin}
                  className="hover:text-red-400 text-stone-400 transition-colors p-0.5"
                  title="Cerrar sesión de Google"
                  aria-label="Cerrar sesión de Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={isStandalone && onExitStandalone ? onExitStandalone : onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
              title={isStandalone ? 'Salir a la tienda de clientes' : 'Cerrar panel'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation buttons */}
        <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'pos', label: 'Punto de Venta (POS)', icon: ShoppingBag, badge: posCart.length },
            {
              id: 'orders',
              label: 'Pedidos & Ventas Online',
              icon: Package,
              badge: orders.filter((o) => o.status === 'nuevo').length,
            },
            { id: 'products', label: 'Productos & Códigos', icon: Barcode, badge: products.length },
            { id: 'expenses', label: 'Gastos', icon: TrendingDown, badge: expenses.length },
            { id: 'finances', label: 'Balance & Finanzas', icon: DollarSign },
            { id: 'settings', label: 'Monedas & WhatsApp', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#20201e] text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#d89c35]' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-[#ce5d45] text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ======================= TAB: PUNTO DE VENTA (POS) ======================= */}
          {activeTab === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Product Selection & Barcode input */}
              <div className="lg:col-span-7 space-y-4">
                {/* Barcode scanner hot bar */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs font-bold text-stone-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Scan className="w-4 h-4 text-[#ce5d45]" />
                      <span>Lector de Código de Barra / Terminal POS</span>
                    </div>
                    {scannedNotification && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full animate-pulse">
                        {scannedNotification}
                      </span>
                    )}
                  </div>
                  <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Barcode className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        placeholder="Escanea con cámara o escribe código..."
                        value={posBarcodeQuery}
                        onChange={(e) => setPosBarcodeQuery(e.target.value)}
                        className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:bg-white focus:outline-none focus:border-[#20201e]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-[#20201e] text-white text-xs font-bold hover:bg-[#ce5d45] transition-colors"
                    >
                      Añadir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('pos');
                        setScannerContinuous(true);
                        setIsScannerOpen(true);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-[#ce5d45] hover:bg-[#b54c35] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                      title="Abrir escáner con la cámara del teléfono o laptop"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="hidden sm:inline">Escanear con Cámara</span>
                      <span className="sm:hidden">Cámara</span>
                    </button>
                  </form>

                  {/* Unregistered Barcode Notice */}
                  {unregisteredScannedCode && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-amber-900 font-medium">
                        El código <strong className="font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded">{unregisteredScannedCode}</strong> no está en inventario.
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            openNewProductModal(unregisteredScannedCode);
                            setUnregisteredScannedCode(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#20201e] hover:bg-[#ce5d45] text-white font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Registrar Producto con este Código</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnregisteredScannedCode(null)}
                          className="px-2 py-1.5 text-stone-500 hover:text-stone-800 font-bold"
                        >
                          Ignorar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Catalog Grid for POS */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col h-[520px]">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-bold text-sm text-[#20201e]">Seleccionar Producto</h3>
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={posProductSearch}
                      onChange={(e) => setPosProductSearch(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none w-48"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 pr-1">
                    {products
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(posProductSearch.toLowerCase()) ||
                          (p.barcode && p.barcode.includes(posProductSearch))
                      )
                      .map((product) => {
                        const nioVal = usdToNio(product.price, exchangeRate);
                        return (
                          <div
                            key={product.id}
                            onClick={() => addPosItem(product)}
                            className="p-2.5 rounded-xl border border-stone-200 hover:border-[#20201e] bg-stone-50/70 hover:bg-white cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
                          >
                            <div className="flex gap-2 items-start">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover bg-stone-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-stone-800 line-clamp-1 group-hover:text-[#ce5d45]">
                                  {product.name}
                                </p>
                                {product.stock !== undefined && product.stock <= 0 ? (
                                  <span className="text-[10px] text-red-600 font-bold block">
                                    Agotado (0 disp.)
                                  </span>
                                ) : product.stock !== undefined && product.stock <= 3 ? (
                                  <span className="text-[10px] text-amber-600 font-bold block">
                                    Poco stock ({product.stock} disp.)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-700 font-medium block">
                                    Stock: {product.stock ?? 10} disp.
                                  </span>
                                )}
                                {product.barcode && (
                                  <span className="text-[9px] font-mono text-stone-400 block truncate">
                                    {product.barcode}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between">
                              <span className="text-xs font-black text-[#20201e]">
                                ${product.price.toFixed(2)}
                              </span>
                              <span className="text-[11px] font-bold text-[#ce5d45]">
                                C$ {nioVal.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Right Column: POS Cart & Checkout */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#ce5d45]" />
                      <h3 className="font-bold text-sm text-[#20201e]">Detalle de la Venta</h3>
                    </div>
                    {posCart.length > 0 && (
                      <button
                        onClick={() => setPosCart([])}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        Vaciar
                      </button>
                    )}
                  </div>

                  {/* Cart Item rows */}
                  <div className="py-3 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {posCart.length === 0 ? (
                      <div className="text-center py-10 text-stone-400 text-xs">
                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>No hay productos en esta venta.</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Escanea un código de barra o selecciona del catálogo.
                        </p>
                      </div>
                    ) : (
                      posCart.map((item, idx) => {
                        const origProd = products.find((p) => p.id === item.productId);
                        const remainingStock = origProd && origProd.stock !== undefined ? origProd.stock - item.quantity : null;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-bold text-stone-800 truncate">{item.name}</p>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-stone-500">
                                  ${item.priceUSD.toFixed(2)} / C$ {item.priceNIO.toFixed(2)}
                                </span>
                                {remainingStock !== null && (
                                  <span className={remainingStock < 0 ? 'text-red-600 font-bold' : 'text-stone-500 font-medium'}>
                                    • Quedan: {remainingStock >= 0 ? remainingStock : 0}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-white border border-stone-300 rounded-lg">
                                <button
                                  onClick={() => updatePosItemQty(idx, -1)}
                                  className="px-2 py-0.5 text-stone-600 font-bold hover:bg-stone-100 rounded-l-lg"
                                >
                                  -
                                </button>
                                <span className="px-2 text-xs font-bold">{item.quantity}</span>
                                <button
                                  onClick={() => updatePosItemQty(idx, 1)}
                                  className="px-2 py-0.5 text-stone-600 font-bold hover:bg-stone-100 rounded-r-lg"
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-mono font-bold text-stone-900 w-16 text-right">
                                ${(item.priceUSD * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dual Totals Banner */}
                  <div className="mt-3 p-3.5 bg-[#20201e] text-white rounded-2xl space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-stone-300">
                      <span>Total en Dólares:</span>
                      <strong className="text-lg font-black text-white">
                        {formatUSD(posTotalUSD)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-amber-300">
                      <span>Total en Córdobas (C$):</span>
                      <strong className="text-xl font-black text-[#d89c35]">
                        {formatNIO(posTotalNIO)}
                      </strong>
                    </div>
                    <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-800 text-right">
                      Tasa de cambio: 1 USD = C$ {exchangeRate.toFixed(2)}
                    </div>
                  </div>

                  {/* Customer info & payment method */}
                  <div className="mt-4 space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                        Nombre del Cliente (Opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. María Sánchez / Mostrador"
                        value={posCustomerName}
                        onChange={(e) => setPosCustomerName(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:border-[#20201e]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                          Moneda de Pago:
                        </label>
                        <select
                          value={posPaymentCurrency}
                          onChange={(e) =>
                            setPosPaymentCurrency(e.target.value as 'NIO' | 'USD' | 'MIXTO')
                          }
                          className="w-full text-xs px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-bold focus:outline-none"
                        >
                          <option value="NIO">Córdobas (C$)</option>
                          <option value="USD">Dólares ($)</option>
                          <option value="MIXTO">Mixto</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                          Método de Pago:
                        </label>
                        <select
                          value={posPaymentMethod}
                          onChange={(e) => setPosPaymentMethod(e.target.value as any)}
                          className="w-full text-xs px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-bold focus:outline-none"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Tarjeta">Tarjeta POS</option>
                          <option value="Pago Móvil">Billetera / Móvil</option>
                        </select>
                      </div>
                    </div>

                    {/* Change calculator */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                        Monto recibido del cliente ({posPaymentCurrency}):
                      </label>
                      <input
                        type="number"
                        placeholder={
                          posPaymentCurrency === 'NIO'
                            ? `Ej. ${Math.ceil(posTotalNIO)}`
                            : `Ej. ${Math.ceil(posTotalUSD)}`
                        }
                        value={posAmountPaid}
                        onChange={(e) => setPosAmountPaid(e.target.value)}
                        className="w-full text-xs sm:text-sm font-bold px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none"
                      />
                    </div>

                    {/* Computed Change */}
                    {amountPaidNum > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-emerald-900">
                          <span>Vuelto / Cambio en C$:</span>
                          <span className="text-sm">{formatNIO(posChangeNIO)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-800 text-[11px]">
                          <span>Vuelto equivalente en $:</span>
                          <span>{formatUSD(posChangeUSD)}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={posCart.length === 0 || isSubmittingSale}
                      onClick={handleCompleteSale}
                      className="w-full py-3.5 rounded-2xl bg-[#ce5d45] hover:bg-[#b54c35] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmittingSale ? 'Guardando Venta...' : 'Registrar Venta'}</span>
                    </button>
                  </div>
                </div>

                {/* Receipt Modal / Popover */}
                {lastSaleReceipt && (
                  <div className="p-4 rounded-2xl bg-white border-2 border-emerald-400 shadow-md space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ¡Venta #{lastSaleReceipt.saleCode} Registrada!
                      </span>
                      <button
                        onClick={() => setLastSaleReceipt(null)}
                        className="text-stone-400 hover:text-stone-700 text-xs font-bold"
                      >
                        Cerrar
                      </button>
                    </div>
                    <p className="text-xs text-stone-600">
                      Total: <strong>{formatUSD(lastSaleReceipt.totalUSD)}</strong> /{' '}
                      <strong>{formatNIO(lastSaleReceipt.totalNIO)}</strong>
                    </p>
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          const receiptWindow = window.open('', '_blank', 'width=400,height=600');
                          if (receiptWindow) {
                            receiptWindow.document.write(`
                              <html>
                                <head><title>Comprobante ${lastSaleReceipt.saleCode}</title></head>
                                <body style="font-family: monospace; padding: 20px; text-align: center;">
                                  <h2>VARIEDADESCS</h2>
                                  <p>Comprobante de Venta: ${lastSaleReceipt.saleCode}</p>
                                  <p>Cliente: ${lastSaleReceipt.customerName}</p>
                                  <p>Fecha: ${lastSaleReceipt.date}</p>
                                  <hr/>
                                  ${lastSaleReceipt.items
                                    .map(
                                      (it) =>
                                        `<div style="display:flex; justify-content:space-between;"><span>${it.quantity}x ${it.name}</span><span>$${(it.priceUSD * it.quantity).toFixed(2)}</span></div>`
                                    )
                                    .join('')}
                                  <hr/>
                                  <h3>TOTAL: $${lastSaleReceipt.totalUSD.toFixed(2)} / C$ ${lastSaleReceipt.totalNIO.toFixed(2)}</h3>
                                  <p>¡Gracias por tu compra!</p>
                                </body>
                              </html>
                            `);
                            receiptWindow.document.close();
                            receiptWindow.print();
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-800 text-xs font-bold hover:bg-stone-200 flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Imprimir Ticket</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= TAB: PEDIDOS & CONFIRMACIÓN DE VENTAS ======================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Top Banner / Notification */}
              {confirmedSaleSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 font-bold text-xs flex items-center justify-between shadow-md animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{confirmedSaleSuccess}</span>
                  </div>
                  <button
                    onClick={() => setConfirmedSaleSuccess(null)}
                    className="text-stone-500 hover:text-stone-800 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Header & Filter Controls */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Buscar por código (#VCS-...), cliente, ciudad o teléfono..."
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#20201e]"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      orderStatusFilter === 'all'
                        ? 'bg-[#20201e] text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Todos ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('nuevo')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                      orderStatusFilter === 'nuevo'
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Por Confirmar ({orders.filter((o) => o.status === 'nuevo').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('completado')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                      orderStatusFilter === 'completado'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ventas Confirmadas ({orders.filter((o) => o.status === 'completado').length})</span>
                  </button>
                </div>
              </div>

              {/* Orders List */}
              {(() => {
                const filtered = orders.filter((o) => {
                  const q = orderSearch.toLowerCase().trim();
                  const matchesQuery =
                    !q ||
                    o.orderCode.toLowerCase().includes(q) ||
                    (o.customer.name || '').toLowerCase().includes(q) ||
                    (o.customer.phone || '').includes(q) ||
                    (o.customer.city || '').toLowerCase().includes(q) ||
                    o.items.some((it) => it.name.toLowerCase().includes(q));

                  const matchesStatus =
                    orderStatusFilter === 'all' || o.status === orderStatusFilter;

                  return matchesQuery && matchesStatus;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#ce5d45] flex items-center justify-center mx-auto border border-amber-200">
                        <Package className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-[#20201e]">No hay pedidos en esta vista</h3>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        {orderSearch
                          ? `No encontramos resultados para "${orderSearch}".`
                          : 'Cuando los clientes hagan pedidos por el carrito o WhatsApp, aparecerán aquí para que confirmes la venta.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filtered.map((order) => {
                      const isCompleted = order.status === 'completado';
                      const isConfirming = confirmingOrderId === order.id;
                      const dateStr = order.createdAt?.toDate
                        ? order.createdAt.toDate().toLocaleString('es-NI')
                        : 'Fecha reciente';

                      return (
                        <div
                          key={order.id}
                          className={`bg-white rounded-2xl border transition-all shadow-xs p-4 sm:p-5 space-y-4 ${
                            isCompleted
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : 'border-stone-200 hover:border-[#20201e]'
                          }`}
                        >
                          {/* Order Header */}
                          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-stone-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-base sm:text-lg font-black text-[#20201e]">
                                  #{order.orderCode}
                                </span>
                                {isCompleted ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Venta Confirmada</span>
                                  </span>
                                ) : order.status === 'en_proceso' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
                                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                    <span>En Preparación</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Pendiente de Confirmar</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-400">{dateStr}</span>
                            </div>

                            {/* Total Pill */}
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                                Total del Pedido:
                              </span>
                              <span className="font-mono text-lg font-black text-[#ce5d45]">
                                ${order.total.toFixed(2)}{' '}
                                <span className="text-xs text-stone-600 font-bold">
                                  / C${' '}
                                  {(order.totalNIO || order.total * exchangeRate).toFixed(0)}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Customer info card */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-stone-50 p-3 rounded-xl text-xs border border-stone-200">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-stone-400 block">
                                Cliente
                              </span>
                              <p className="font-bold text-stone-800">
                                {order.customer.name || 'Sin nombre'}
                              </p>
                              {order.customer.phone && (
                                <p className="text-stone-600 font-mono">
                                  +{order.customer.phone}
                                </p>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-stone-400 block">
                                Entrega / Destino
                              </span>
                              <p className="text-stone-800">
                                {order.customer.city || 'No especificada'}
                              </p>
                              {order.customer.address && (
                                <p className="text-stone-500 truncate" title={order.customer.address}>
                                  {order.customer.address}
                                </p>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-stone-400 block">
                                Pago / Notas
                              </span>
                              <p className="text-stone-700 font-medium">
                                {order.customer.paymentMethod || 'Transferencia'}
                              </p>
                              {order.customer.notes && (
                                <p className="text-stone-500 italic truncate" title={order.customer.notes}>
                                  "{order.customer.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Products Table */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                              Prendas y Artículos a Despachar ({order.items.length}):
                            </span>
                            <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 overflow-hidden bg-white">
                              {order.items.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 flex items-center justify-between text-xs hover:bg-stone-50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {it.image && (
                                      <img
                                        src={it.image}
                                        alt={it.name}
                                        className="w-10 h-10 rounded-lg object-cover border border-stone-200 bg-stone-100"
                                      />
                                    )}
                                    <div>
                                      <p className="font-bold text-stone-800">{it.name}</p>
                                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                                        {it.selectedSize && <span>Talla: <strong>{it.selectedSize}</strong></span>}
                                        {it.selectedColor && <span>Color: <strong>{it.selectedColor}</strong></span>}
                                        {it.barcode && (
                                          <span className="font-mono text-stone-400 text-[10px]">
                                            Etiqueta: {it.barcode}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-stone-500 text-[11px]">
                                      {it.quantity} x ${it.price.toFixed(2)} =
                                    </span>
                                    <p className="font-mono font-bold text-stone-900">
                                      ${(it.quantity * it.price).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {/* Change status buttons */}
                              <span className="text-[11px] text-stone-400 font-bold uppercase">
                                Estado:
                              </span>
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(
                                    order.id,
                                    e.target.value as FirestoreOrder['status']
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-stone-100 border border-stone-300 text-xs font-bold text-stone-700 focus:outline-none"
                              >
                                <option value="nuevo">Pendiente</option>
                                <option value="en_proceso">En Preparación</option>
                                <option value="completado">Completado</option>
                                <option value="cancelado">Cancelado</option>
                              </select>

                              {/* WhatsApp Contact Customer */}
                              <button
                                type="button"
                                onClick={() => handleNotifyCustomer(order)}
                                className="px-3 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white border border-[#25D366]/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
                                title="Enviar mensaje de WhatsApp al cliente"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp Cliente</span>
                              </button>
                            </div>

                            {/* Main Confirm Sale Button */}
                            <div>
                              {!isCompleted ? (
                                <button
                                  type="button"
                                  disabled={isConfirming}
                                  onClick={() => handleConfirmOrderSale(order)}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ce5d45] to-[#b54c35] hover:brightness-110 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                                >
                                  {isConfirming ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Confirmando Venta e Inventario...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                      <span>✅ Confirmar Venta Realizada</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Venta Registrada e Inventario Actualizado</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ======================= TAB: PRODUCTOS & CÓDIGOS DE BARRA ======================= */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Product action bar */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar producto por nombre o código de barra..."
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#20201e]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScannerTarget('product-list');
                      setScannerContinuous(false);
                      setIsScannerOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    title="Escanear código de barra para buscar producto"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#ce5d45]" />
                    <span className="hidden sm:inline">Escanear</span>
                  </button>
                  <select
                    value={prodCategoryFilter}
                    onChange={(e) => setProdCategoryFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-semibold focus:outline-none"
                  >
                    <option value="all">Todas las Categorías</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => {
                      setScannerTarget('new-product');
                      setScannerContinuous(false);
                      setIsScannerOpen(true);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-[#ce5d45] hover:bg-[#b54c35] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    title="Escanear con la cámara del teléfono la etiqueta o caja que ya trae el producto para registrarlo"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Escanear Etiqueta de Fábrica</span>
                  </button>
                  <button
                    onClick={() => openNewProductModal()}
                    className="px-3.5 py-2.5 rounded-xl bg-[#20201e] hover:bg-stone-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Producto</span>
                  </button>
                </div>
              </div>

              {/* Products Grid with Barcodes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((p) => {
                  const nioPrice = usdToNio(p.price, exchangeRate);
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="flex gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-20 h-20 rounded-xl object-cover bg-stone-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-[#ce5d45] uppercase tracking-wider block">
                            {p.categoryLabel}
                          </span>
                          <h4 className="font-bold text-sm text-[#20201e] truncate" title={p.name}>
                            {p.name}
                          </h4>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-base font-black text-[#20201e]">
                              ${p.price.toFixed(2)}
                            </span>
                            <span className="text-xs font-bold text-[#d89c35]">
                              C$ {nioPrice.toFixed(0)}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500 block mt-0.5">
                            Stock: <strong>{p.stock ?? 10} unidades</strong>
                          </span>
                        </div>
                      </div>

                      {/* Live Barcode Renderer & Print */}
                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/80">
                        <BarcodeRenderer
                          value={p.barcode || generateBarcode()}
                          productName={p.name}
                          priceUSD={p.price}
                          exchangeRate={exchangeRate}
                          height={36}
                          width={1.4}
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-stone-400">
                          ID: {p.id.slice(0, 8)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                            title="Editar producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================= TAB: CONTROL DE GASTOS ======================= */}
          {activeTab === 'expenses' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form to record an expense */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <h3 className="font-bold text-sm text-[#20201e]">Registrar Nuevo Gasto</h3>
                </div>

                <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-600 uppercase mb-1">
                      Concepto o Descripción:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Compra lote de carteras / Envío a tienda"
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:border-[#20201e]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-600 uppercase mb-1">
                      Categoría del Gasto:
                    </label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-bold focus:outline-none"
                    >
                      <option value="Mercancía / Stock">Mercancía / Stock</option>
                      <option value="Alquiler">Alquiler de Local</option>
                      <option value="Transporte / Envíos">Transporte / Envíos</option>
                      <option value="Servicios">Servicios (Luz, Agua, Internet)</option>
                      <option value="Empaques">Empaques & Bolsas</option>
                      <option value="Publicidad">Publicidad & Redes</option>
                      <option value="Personal">Personal & Comisiones</option>
                      <option value="Otro">Otro Gasto</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-stone-600 uppercase mb-1">
                        Monto:
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 uppercase mb-1">
                        Moneda:
                      </label>
                      <select
                        value={expenseCurrency}
                        onChange={(e) => setExpenseCurrency(e.target.value as 'USD' | 'NIO')}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-bold focus:outline-none"
                      >
                        <option value="NIO">Córdobas (C$)</option>
                        <option value="USD">Dólares ($)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-600 uppercase mb-1">Fecha:</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-600 uppercase mb-1">
                      Notas / Proveedor (Opcional):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detalles adicionales..."
                      value={expenseNotes}
                      onChange={(e) => setExpenseNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingExpense}
                    className="w-full py-3 rounded-xl bg-[#20201e] hover:bg-red-700 text-white font-bold transition-colors"
                  >
                    {isSubmittingExpense ? 'Guardando...' : 'Guardar Gasto'}
                  </button>
                </form>
              </div>

              {/* Expense History List */}
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h3 className="font-bold text-sm text-[#20201e]">Historial de Gastos</h3>
                  <div className="text-xs text-stone-500">
                    Total Gastos: <strong className="text-red-700">{formatUSD(totalExpensesUSD)}</strong>{' '}
                    / <strong className="text-red-700">{formatNIO(totalExpensesNIO)}</strong>
                  </div>
                </div>

                <div className="mt-3 overflow-x-auto flex-1">
                  {expenses.length === 0 ? (
                    <div className="text-center py-12 text-stone-400 text-xs">
                      No hay gastos registrados todavía.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                          <th className="py-2">Fecha</th>
                          <th className="py-2">Concepto</th>
                          <th className="py-2">Categoría</th>
                          <th className="py-2 text-right">Monto ($)</th>
                          <th className="py-2 text-right">Monto (C$)</th>
                          <th className="py-2 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-stone-50">
                            <td className="py-2.5 text-stone-500">{exp.date}</td>
                            <td className="py-2.5 font-bold text-stone-800">
                              {exp.title}
                              {exp.notes && (
                                <span className="block text-[10px] text-stone-400 font-normal">
                                  {exp.notes}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                                {exp.category}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-bold text-stone-900">
                              ${exp.amountUSD.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-right font-bold text-[#ce5d45]">
                              C$ {exp.amountNIO.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-center">
                              <button
                                onClick={() => deleteExpenseFromFirestore(exp.id)}
                                className="p-1 text-stone-400 hover:text-red-600 rounded"
                                title="Eliminar gasto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: BALANCE & FINANZAS ======================= */}
          {activeTab === 'finances' && (
            <div className="space-y-6">
              {/* Financial Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-bold uppercase">
                    <span>Total Ventas (Ingresos)</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-[#20201e]">
                    {formatUSD(totalSalesUSD)}
                  </p>
                  <p className="text-xs font-bold text-emerald-700">
                    {formatNIO(totalSalesNIO)} Córdobas
                  </p>
                  <p className="text-[11px] text-stone-400 pt-1">
                    {sales.length} ventas registradas
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-bold uppercase">
                    <span>Total Gastos (Egresos)</span>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-black text-red-700">
                    {formatUSD(totalExpensesUSD)}
                  </p>
                  <p className="text-xs font-bold text-red-600">
                    {formatNIO(totalExpensesNIO)} Córdobas
                  </p>
                  <p className="text-[11px] text-stone-400 pt-1">
                    {expenses.length} gastos registrados
                  </p>
                </div>

                <div
                  className={`p-5 rounded-2xl border shadow-xs space-y-1 ${
                    netProfitUSD >= 0
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-red-50/70 border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-stone-700">
                    <span>Ganancia Neta (Utilidad)</span>
                    <DollarSign className="w-4 h-4 text-[#d89c35]" />
                  </div>
                  <p
                    className={`text-2xl font-black ${
                      netProfitUSD >= 0 ? 'text-emerald-800' : 'text-red-800'
                    }`}
                  >
                    {formatUSD(netProfitUSD)}
                  </p>
                  <p
                    className={`text-xs font-bold ${
                      netProfitUSD >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {formatNIO(netProfitNIO)} Córdobas
                  </p>
                  <p className="text-[11px] text-stone-500 pt-1">
                    Margen:{' '}
                    <strong>
                      {totalSalesUSD > 0
                        ? `${((netProfitUSD / totalSalesUSD) * 100).toFixed(1)}%`
                        : '0%'}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Recent Sales History */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <h3 className="font-bold text-sm text-[#20201e] mb-3">Ventas Recientes Registradas</h3>
                {sales.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">
                    No se han registrado ventas directas todavía.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                          <th className="py-2">Código</th>
                          <th className="py-2">Fecha</th>
                          <th className="py-2">Cliente</th>
                          <th className="py-2">Artículos</th>
                          <th className="py-2">Método</th>
                          <th className="py-2 text-right">Total ($)</th>
                          <th className="py-2 text-right">Total (C$)</th>
                          <th className="py-2 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {sales.map((s) => (
                          <tr key={s.id} className="hover:bg-stone-50">
                            <td className="py-2.5 font-mono font-bold text-stone-800">
                              {s.saleCode}
                            </td>
                            <td className="py-2.5 text-stone-500">{s.date}</td>
                            <td className="py-2.5 font-medium text-stone-700">
                              {s.customerName || 'Cliente mostrador'}
                            </td>
                            <td className="py-2.5 text-stone-600">{s.items.length} productos</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                                {s.paymentMethod}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-black text-stone-900">
                              ${s.totalUSD.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-right font-black text-[#ce5d45]">
                              C$ {s.totalNIO.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-center">
                              <button
                                onClick={() => deleteSaleFromFirestore(s.id)}
                                className="p-1 text-stone-400 hover:text-red-600 rounded"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= TAB: MONEDAS & AJUSTES ======================= */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-bold text-base text-[#20201e]">Ajustes de Moneda y Seguridad</h3>
                <p className="text-xs text-stone-500">
                  Configura la tasa de cambio entre Córdobas y Dólares, el PIN secreto y el número de WhatsApp.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-amber-900 text-sm">
                      Tasa de Cambio (USD a Córdobas C$)
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Define cuántos Córdobas nicaragüenses (C$) equivalen a 1 Dólar estadounidense ($).
                    Todos los precios de la tienda y del punto de venta se actualizarán automáticamente.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="font-bold text-stone-700">1 USD =</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={tempExchangeRate}
                      onChange={(e) => setTempExchangeRate(e.target.value)}
                      className="w-36 px-3 py-2 rounded-xl bg-white border border-stone-300 font-bold text-sm focus:outline-none"
                    />
                    <span className="font-bold text-stone-700">Córdobas (C$)</span>
                  </div>
                </div>

                {/* Google Admin Security Info */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <span className="font-bold text-blue-900 text-xs">
                        Cuenta de Google Autorizada
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Activo
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Solo la cuenta oficial de Google <strong className="font-mono text-blue-950">variedadescs.online@gmail.com</strong> puede iniciar sesión y acceder a este panel de administración.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    PIN Secreto de Respaldo:
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    value={tempAdminPin}
                    onChange={(e) => setTempAdminPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-mono text-sm tracking-widest focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Utiliza este PIN para desbloquear el panel escondido en cualquier momento.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Número de WhatsApp Oficial para Pedidos:
                  </label>
                  <input
                    type="text"
                    required
                    value={tempWhatsApp}
                    onChange={(e) => setTempWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-mono text-sm focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Incluye el código de país sin el signo más (+) (ejemplo: 50588888888 para Nicaragua).
                  </p>
                </div>

                {settingsSaved && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ajustes guardados y sincronizados exitosamente con Firebase Firestore.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#20201e] hover:bg-[#ce5d45] text-white font-bold text-sm transition-colors shadow-md"
                >
                  Guardar Cambios
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            VariedadesCS Admin • Conectado a Firestore
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold transition-colors"
          >
            Salir del Panel
          </button>
        </div>
      </div>

      {/* ======================= PRODUCT CREATION / EDITING SUB-MODAL ======================= */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsProductModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="display-font text-lg font-bold text-[#20201e]">
                {editingProduct ? 'Editar Producto' : 'Subir Nuevo Producto'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Nombre del Producto:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Vestido Floral Primaveral"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:border-[#20201e]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Categoría:
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as CategoryId;
                      const opt = CATEGORY_OPTIONS.find((c) => c.id === cat);
                      setProductForm({
                        ...productForm,
                        category: cat,
                        categoryLabel: opt ? opt.label : 'Moda',
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 font-bold focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Stock en Inventario (Unidades):
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Price Row (USD and Córdobas sync) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 uppercase">
                  <span>Precios en Dólares y Córdobas (Tasa: C${exchangeRate})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 uppercase mb-1">
                      Precio en Dólares ($ USD):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={productForm.priceUSD}
                      onChange={(e) => handlePriceUSDChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 font-bold text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 uppercase mb-1">
                      Equivalente en Córdobas (C$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={productForm.priceNIO}
                      onChange={(e) => handlePriceNIOChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 font-bold text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Barcode Section with Real-time generator & Camera Scan */}
              <div className="p-4 rounded-2xl bg-stone-50 border-2 border-stone-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-extrabold text-stone-800 text-xs sm:text-sm uppercase flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-[#ce5d45]" />
                    <span>Código de Barra del Producto</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('product-form');
                        setScannerContinuous(false);
                        setIsScannerOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#ce5d45] hover:bg-[#b54c35] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                      title="Escanear con la cámara el código de barra que ya trae el producto en su etiqueta o caja"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Escanear Etiqueta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm({ ...productForm, barcode: generateBarcode() })
                      }
                      className="px-2 py-1 rounded-lg text-[11px] font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                      title="Generar un código automático nuevo si el producto no trae código de fábrica"
                    >
                      + Auto-generar
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    placeholder="Escanea con la cámara o escribe el código que trae la etiqueta/caja..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-stone-300 font-mono text-sm focus:outline-none focus:border-[#20201e] shadow-2xs"
                  />
                  <Barcode className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {productForm.barcode ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Código listo: <strong>{productForm.barcode}</strong>. Podrás usar este mismo código para buscar y cobrar el producto en el POS.
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500 leading-snug">
                    💡 <strong>Tip:</strong> Usa el mismo código de barra que ya viene impreso en la prenda o caja. Solo presiona <strong>"Escanear Etiqueta"</strong> para apuntar con la cámara de tu teléfono.
                  </p>
                )}

                {/* Live barcode tag preview */}
                {productForm.barcode && (
                  <div className="pt-2">
                    <span className="text-[10px] text-stone-400 block mb-1">
                      Vista previa de etiqueta imprimible:
                    </span>
                    <BarcodeRenderer
                      value={productForm.barcode}
                      productName={productForm.name || 'Producto VariedadesCS'}
                      priceUSD={parseFloat(productForm.priceUSD) || 0}
                      exchangeRate={exchangeRate}
                      showPrintButton={true}
                    />
                  </div>
                )}
              </div>

              {/* Phone Camera & Gallery Image Uploader */}
              <ProductImageUploader
                currentImage={productForm.image}
                onImageChange={(newImg) => setProductForm({ ...productForm, image: newImg })}
                presetImages={PRESET_IMAGES}
              />

              {/* Sizes and Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Tallas (separadas por coma):
                  </label>
                  <input
                    type="text"
                    value={productForm.sizes}
                    onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                    placeholder="S, M, L, XL"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Colores (separados por coma):
                  </label>
                  <input
                    type="text"
                    value={productForm.colors}
                    onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })}
                    placeholder="Negro, Blanco, Rojo"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Descripción del Producto:
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                  placeholder="Detalles sobre tela, ajuste, estilo..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, inStock: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#ce5d45]"
                  />
                  <span className="font-bold text-stone-700">En Existencia (Stock activo)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) =>
                      setProductForm({ ...productForm, featured: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#ce5d45]"
                  />
                  <span className="font-bold text-stone-700">Destacar en Portada</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold hover:bg-stone-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-6 py-2.5 rounded-xl bg-[#20201e] hover:bg-[#ce5d45] text-white font-bold transition-colors shadow-md"
                >
                  {isSubmittingProduct ? 'Guardando en Firebase...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Barcode Scanner Modal (Camera & Gallery File) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScannerResult}
        title={
          scannerTarget === 'pos'
            ? 'Lector de Código de Barra - Terminal POS'
            : scannerTarget === 'product-form'
            ? 'Escanear Etiqueta que Trae el Producto'
            : 'Buscar Producto por Código de Barra'
        }
        subtitle={
          scannerTarget === 'pos'
            ? 'Apunta la cámara a las etiquetas de los productos para agregarlos a la venta'
            : scannerTarget === 'product-form'
            ? 'Captura el código de barra original que ya viene impreso de fábrica'
            : 'Escanea el código de barra para localizar el producto en inventario'
        }
        continuous={scannerContinuous}
        lastScannedFeedback={scannerLastFeedback}
      />
    </div>
  );
};
