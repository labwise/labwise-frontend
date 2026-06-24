import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Product } from '@/types';

interface FavoriteItem {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

interface FavoriteState {
  items: FavoriteItem[];
  ids: Set<string>;
  loaded: boolean;
  fetch: () => Promise<void>;
  toggle: (productId: string) => Promise<boolean>;
  isFavorited: (productId: string) => boolean;
  reset: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  items: [],
  ids: new Set(),
  loaded: false,

  fetch: async () => {
    try {
      const { data } = await api.get<FavoriteItem[]>('/favorites');
      set({
        items: data,
        ids: new Set(data.map((f) => f.productId)),
        loaded: true,
      });
    } catch {
      // 비로그인 시 무시
    }
  },

  toggle: async (productId: string) => {
    const { data } = await api.post<{ favorited: boolean }>(`/favorites/${productId}`);
    set((state) => {
      const next = new Set(state.ids);
      if (data.favorited) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      const nextItems = data.favorited
        ? state.items
        : state.items.filter((i) => i.productId !== productId);
      return { ids: next, items: nextItems };
    });
    if (data.favorited) {
      get().fetch();
    }
    return data.favorited;
  },

  isFavorited: (productId: string) => get().ids.has(productId),

  reset: () => set({ items: [], ids: new Set(), loaded: false }),
}));
