export type CategoryId = 'all' | 'ropa' | 'lenceria' | 'perfumes' | 'bolsos' | 'gorras';

export type Currency = 'USD' | 'NIO';

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  categoryLabel: string;
  price: number; // Stored in USD as primary base
  originalPrice?: number;
  barcode?: string;
  stock?: number;
  image: string;
  badge?: string;
  description: string;
  details: string[];
  sizes?: string[];
  colors?: string[];
  inStock: boolean;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface CustomerOrderInfo {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  paymentMethod: 'Transferencia' | 'Efectivo' | 'Pago Móvil' | 'Por coordinar';
}

export interface FirestoreOrder {
  id: string;
  orderCode: string;
  customer: CustomerOrderInfo;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
    image: string;
    barcode?: string;
  }>;
  total: number; // in USD
  totalNIO?: number; // in Córdobas
  exchangeRate?: number;
  status: 'nuevo' | 'en_proceso' | 'completado' | 'cancelado';
  createdAt: any;
}

export interface SaleItem {
  productId: string;
  name: string;
  priceUSD: number;
  priceNIO: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  barcode?: string;
  image?: string;
}

export interface Sale {
  id: string;
  saleCode: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  totalUSD: number;
  totalNIO: number;
  exchangeRate: number;
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Pago Móvil';
  paymentCurrency: 'USD' | 'NIO' | 'MIXTO';
  amountPaidUSD?: number;
  amountPaidNIO?: number;
  changeGivenUSD?: number;
  changeGivenNIO?: number;
  notes?: string;
  date: string;
  createdAt: any;
}

export type ExpenseCategory =
  | 'Mercancía / Stock'
  | 'Alquiler'
  | 'Transporte / Envíos'
  | 'Servicios'
  | 'Empaques'
  | 'Publicidad'
  | 'Personal'
  | 'Otro';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: 'USD' | 'NIO';
  amountUSD: number;
  amountNIO: number;
  date: string;
  notes?: string;
  createdAt: any;
}

export interface StoreSettings {
  whatsAppNumber: string;
  exchangeRate: number; // e.g. 36.8 NIO per USD
  adminPin?: string;
  adminEmail?: string;
  announcement?: string;
  tiktokUrl?: string;
  whatsAppCatalogUrl?: string;
  linkBioUrl?: string;
}
