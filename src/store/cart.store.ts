import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
}

export interface ProductInfo {
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
}

const GUEST_CART_KEY = 'labwise_guest_cart';

function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function isLoggedIn(): boolean {
  return !!useAuthStore.getState().accessToken;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, productInfo?: ProductInfo) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,

  fetchCart: async () => {
    if (!isLoggedIn()) {
      set({ items: loadGuestCart() });
      return;
    }
    set({ loading: true });
    try {
      const { data } = await api.get('/cart');
      const mapped: CartItem[] = (data as any[]).map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name ?? '',
        productSlug: item.product?.slug ?? '',
        unitPrice: Number(item.product?.effectivePrice ?? item.product?.price ?? 0),
        quantity: item.quantity,
        imageUrl:
          item.product?.images?.find((img: any) => img.isPrimary)?.url ??
          item.product?.images?.[0]?.url,
      }));
      set({ items: mapped });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (productId, quantity, productInfo?) => {
    if (!isLoggedIn()) {
      const current = loadGuestCart();
      const existing = current.find((i) => i.productId === productId);
      let next: CartItem[];
      if (existing) {
        next = current.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      } else {
        const newItem: CartItem = {
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          productId,
          productName: productInfo?.name ?? '',
          productSlug: productInfo?.slug ?? '',
          unitPrice: productInfo?.price ?? 0,
          quantity,
          imageUrl: productInfo?.imageUrl,
        };
        next = [...current, newItem];
      }
      saveGuestCart(next);
      set({ items: next });
      return;
    }
    await api.post('/cart', { productId, quantity });
    await get().fetchCart();
  },

  updateItem: async (itemId, quantity) => {
    if (!isLoggedIn()) {
      const next = loadGuestCart().map((i) => (i.id === itemId ? { ...i, quantity } : i));
      saveGuestCart(next);
      set({ items: next });
      return;
    }
    await api.put(`/cart/${itemId}`, { quantity });
    await get().fetchCart();
  },

  removeItem: async (itemId) => {
    if (!isLoggedIn()) {
      const next = loadGuestCart().filter((i) => i.id !== itemId);
      saveGuestCart(next);
      set({ items: next });
      return;
    }
    await api.delete(`/cart/${itemId}`);
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
  },

  clearCart: async () => {
    if (!isLoggedIn()) {
      localStorage.removeItem(GUEST_CART_KEY);
      set({ items: [] });
      return;
    }
    await api.delete('/cart');
    set({ items: [] });
  },

  mergeGuestCart: async () => {
    const guestItems = loadGuestCart();
    if (!guestItems.length) return;
    for (const item of guestItems) {
      try {
        await api.post('/cart', { productId: item.productId, quantity: item.quantity });
      } catch {}
    }
    localStorage.removeItem(GUEST_CART_KEY);
    await get().fetchCart();
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalAmount: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
}));
