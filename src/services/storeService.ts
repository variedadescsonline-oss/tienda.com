import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Product,
  CartItem,
  CustomerOrderInfo,
  FirestoreOrder,
  StoreSettings,
  Sale,
  Expense,
} from '../types';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import { DEFAULT_EXCHANGE_RATE, usdToNio } from '../utils/currency';
import { OFFICIAL_LINKS } from '../data/socialLinks';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const SALES_COLLECTION = 'sales';
const EXPENSES_COLLECTION = 'expenses';
const SETTINGS_COLLECTION = 'store_settings';
const CUSTOM_REQUESTS_COLLECTION = 'custom_requests';

// Helper to generate a unique barcode
export function generateBarcode(): string {
  // 12 digit code starting with 743 (Nicaragua GS1 prefix / boutique code)
  const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
  return `743${randomSuffix}`;
}

// Seed initial products to Firestore if empty, assigning barcodes
export async function seedProductsIfEmpty(): Promise<void> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);
    if (snapshot.empty) {
      console.log('Seeding initial products to Firestore...');
      for (let i = 0; i < DEFAULT_PRODUCTS.length; i++) {
        const product = DEFAULT_PRODUCTS[i];
        const barcode = product.barcode || `743${100000000 + (i + 1) * 111}`;
        await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), {
          ...product,
          barcode,
          stock: product.stock ?? 15,
          createdAt: serverTimestamp(),
        });
      }
      console.log('Seeding completed.');
    }
  } catch (error) {
    console.warn('Could not seed products or offline fallback active:', error);
  }
}

// Subscribe to products in real-time
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: Error) => void
) {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(
    productsRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedProductsIfEmpty();
        const mapped = DEFAULT_PRODUCTS.map((p, idx) => ({
          ...p,
          barcode: p.barcode || `743${100000000 + (idx + 1) * 111}`,
          stock: p.stock ?? 15,
        }));
        onUpdate(mapped);
      } else {
        const loaded: Product[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            name: data.name || '',
            category: data.category || 'all',
            categoryLabel: data.categoryLabel || '',
            price: Number(data.price) || 0,
            originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
            barcode: data.barcode || generateBarcode(),
            stock: data.stock !== undefined ? Number(data.stock) : 10,
            image: data.image || '',
            badge: data.badge || '',
            description: data.description || '',
            details: Array.isArray(data.details) ? data.details : [],
            sizes: Array.isArray(data.sizes) ? data.sizes : [],
            colors: Array.isArray(data.colors) ? data.colors : [],
            inStock: data.inStock ?? true,
            featured: data.featured ?? false,
          });
        });
        onUpdate(loaded);
      }
    },
    (err) => {
      console.warn('Firestore products listener error, using fallback:', err);
      onUpdate(DEFAULT_PRODUCTS);
      if (onError) onError(err);
    }
  );
}

// Create or update a product in Firestore
export async function saveProductToFirestore(
  productData: Omit<Product, 'id'>,
  productId?: string
): Promise<string> {
  const finalBarcode = productData.barcode?.trim() || generateBarcode();
  const cleanData = {
    ...productData,
    barcode: finalBarcode,
    price: Number(productData.price) || 0,
    originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
    stock: Number(productData.stock) || 0,
    updatedAt: serverTimestamp(),
  };

  if (productId) {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await setDoc(docRef, cleanData, { merge: true });
    return productId;
  } else {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...cleanData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
}

// Delete product from Firestore
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
}

// Subscribe to Store Settings (WhatsApp number, exchange rate, PIN, social links, etc.)
export function subscribeToStoreSettings(
  onUpdate: (settings: StoreSettings) => void
) {
  const settingsDoc = doc(db, SETTINGS_COLLECTION, 'general');
  return onSnapshot(
    settingsDoc,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rawPhone = data.whatsAppNumber;
        // If it was the dummy placeholder, update to official Nicaragua number
        const effectivePhone =
          rawPhone && rawPhone !== '584120000000'
            ? rawPhone
            : OFFICIAL_LINKS.whatsAppPhone;

        onUpdate({
          whatsAppNumber: effectivePhone,
          exchangeRate: Number(data.exchangeRate) || DEFAULT_EXCHANGE_RATE,
          adminPin: data.adminPin || '1234',
          announcement: data.announcement || '',
          tiktokUrl: data.tiktokUrl || OFFICIAL_LINKS.tiktok,
          whatsAppCatalogUrl: data.whatsAppCatalogUrl || OFFICIAL_LINKS.whatsAppCatalogUrl,
          linkBioUrl: data.linkBioUrl || OFFICIAL_LINKS.linkBioUrl,
        });
      } else {
        // Default initial settings with official links
        onUpdate({
          whatsAppNumber: OFFICIAL_LINKS.whatsAppPhone,
          exchangeRate: DEFAULT_EXCHANGE_RATE,
          adminPin: '1234',
          tiktokUrl: OFFICIAL_LINKS.tiktok,
          whatsAppCatalogUrl: OFFICIAL_LINKS.whatsAppCatalogUrl,
          linkBioUrl: OFFICIAL_LINKS.linkBioUrl,
        });
      }
    },
    (err) => {
      console.warn('Firestore settings listener error:', err);
    }
  );
}

// Update Store settings in Firestore
export async function updateStoreSettingsInFirestore(
  settings: Partial<StoreSettings>
): Promise<void> {
  const settingsDoc = doc(db, SETTINGS_COLLECTION, 'general');
  await setDoc(
    settingsDoc,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Save an order to Firestore
export async function saveOrderToFirestore(
  items: CartItem[],
  customerInfo: CustomerOrderInfo,
  totalUSD: number,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): Promise<{ id: string; orderCode: string }> {
  const orderNumber = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `VCS-${orderNumber}`;
  const totalNIO = usdToNio(totalUSD, exchangeRate);

  const orderData = {
    orderCode,
    customer: customerInfo,
    items: items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      selectedSize: item.selectedSize || null,
      selectedColor: item.selectedColor || null,
      image: item.product.image,
      barcode: item.product.barcode || null,
    })),
    total: totalUSD,
    totalNIO,
    exchangeRate,
    status: 'nuevo',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderData);
  return { id: docRef.id, orderCode };
}

// Subscribe to orders
export function subscribeToOrders(
  onUpdate: (orders: FirestoreOrder[]) => void
) {
  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const ordersList: FirestoreOrder[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        ordersList.push({
          id: docSnap.id,
          orderCode: d.orderCode || `VCS-${docSnap.id.slice(0, 4).toUpperCase()}`,
          customer: d.customer || {
            name: '',
            phone: '',
            city: '',
            address: '',
            notes: '',
            paymentMethod: 'Transferencia',
          },
          items: d.items || [],
          total: Number(d.total) || 0,
          totalNIO: d.totalNIO ? Number(d.totalNIO) : undefined,
          exchangeRate: d.exchangeRate ? Number(d.exchangeRate) : undefined,
          status: d.status || 'nuevo',
          createdAt: d.createdAt,
        });
      });
      onUpdate(ordersList);
    },
    (err) => {
      console.warn('Firestore orders listener error:', err);
    }
  );
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  newStatus: FirestoreOrder['status']
): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, {
    status: newStatus,
  });
}

// Record a Direct POS Sale
export async function recordSaleInFirestore(
  saleData: Omit<Sale, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, SALES_COLLECTION), {
    ...saleData,
    createdAt: serverTimestamp(),
  });

  // Automatically deduct stock for sold items
  for (const item of saleData.items) {
    if (item.productId && item.quantity > 0) {
      try {
        const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        await updateDoc(productRef, {
          stock: increment(-item.quantity),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Could not update stock for sold item:', e);
      }
    }
  }

  return docRef.id;
}

// Subscribe to Sales
export function subscribeToSales(
  onUpdate: (sales: Sale[]) => void
) {
  const salesQuery = query(
    collection(db, SALES_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    salesQuery,
    (snapshot) => {
      const list: Sale[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          saleCode: d.saleCode || `VTA-${docSnap.id.slice(0, 4).toUpperCase()}`,
          customerName: d.customerName || 'Cliente mostrador',
          items: d.items || [],
          totalUSD: Number(d.totalUSD) || 0,
          totalNIO: Number(d.totalNIO) || 0,
          exchangeRate: Number(d.exchangeRate) || DEFAULT_EXCHANGE_RATE,
          paymentMethod: d.paymentMethod || 'Efectivo',
          paymentCurrency: d.paymentCurrency || 'NIO',
          amountPaidUSD: d.amountPaidUSD ? Number(d.amountPaidUSD) : undefined,
          amountPaidNIO: d.amountPaidNIO ? Number(d.amountPaidNIO) : undefined,
          changeGivenUSD: d.changeGivenUSD ? Number(d.changeGivenUSD) : undefined,
          changeGivenNIO: d.changeGivenNIO ? Number(d.changeGivenNIO) : undefined,
          notes: d.notes || '',
          date: d.date || new Date().toISOString().split('T')[0],
          createdAt: d.createdAt,
        });
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Firestore sales listener error:', err);
    }
  );
}

// Delete a sale
export async function deleteSaleFromFirestore(saleId: string): Promise<void> {
  await deleteDoc(doc(db, SALES_COLLECTION, saleId));
}

// Record an Expense
export async function recordExpenseInFirestore(
  expenseData: Omit<Expense, 'id' | 'createdAt'>,
  expenseId?: string
): Promise<string> {
  const cleanData = {
    ...expenseData,
    amount: Number(expenseData.amount) || 0,
    amountUSD: Number(expenseData.amountUSD) || 0,
    amountNIO: Number(expenseData.amountNIO) || 0,
    updatedAt: serverTimestamp(),
  };

  if (expenseId) {
    await setDoc(doc(db, EXPENSES_COLLECTION, expenseId), cleanData, { merge: true });
    return expenseId;
  } else {
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), {
      ...cleanData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
}

// Subscribe to Expenses
export function subscribeToExpenses(
  onUpdate: (expenses: Expense[]) => void
) {
  const expensesQuery = query(
    collection(db, EXPENSES_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    expensesQuery,
    (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          title: d.title || 'Gasto no especificado',
          category: d.category || 'Otro',
          amount: Number(d.amount) || 0,
          currency: d.currency || 'NIO',
          amountUSD: Number(d.amountUSD) || 0,
          amountNIO: Number(d.amountNIO) || 0,
          date: d.date || new Date().toISOString().split('T')[0],
          notes: d.notes || '',
          createdAt: d.createdAt,
        });
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Firestore expenses listener error:', err);
    }
  );
}

// Delete an expense
export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, EXPENSES_COLLECTION, expenseId));
}

// Submit custom request
export async function submitCustomRequest(data: {
  customerName: string;
  customerContact: string;
  description: string;
  itemType?: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, CUSTOM_REQUESTS_COLLECTION), {
    ...data,
    status: 'nuevo',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
