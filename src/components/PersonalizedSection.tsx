'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Clock, ShoppingCart, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useFavoriteStore } from '@/store/favorite.store';
import { useCartStore } from '@/store/cart.store';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

interface RecentProduct {
  productId: string;
  productName: string;
  productSlug: string;
  unitPrice: number;
  imageUrl?: string;
  orderedAt: string;
}

type Tab = 'favorites' | 'recent';

function ProductMiniCard({ product, onCart }: { product: Product; onCart: (p: Product) => void }) {
  const { toggle, isFavorited } = useFavoriteStore();
  const favorited = isFavorited(product.id);
  const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100">
        {primaryImage ? (
          <Image src={primaryImage.url} alt={product.name} fill className="object-cover transition-transform group-hover:scale-105" sizes="200px" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-200">
            <ShoppingCart className="h-8 w-8" />
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggle(product.id); }}
          className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm hover:bg-white"
        >
          <Heart className={`h-3.5 w-3.5 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-1 line-clamp-2 text-xs font-medium text-gray-800">{product.name}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">{formatPrice(product.effectivePrice ?? product.price)}</span>
          <button
            onClick={(e) => { e.preventDefault(); onCart(product); }}
            className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}

function RecentMiniCard({ item }: { item: RecentProduct }) {
  const { addItem } = useCartStore();

  return (
    <Link
      href={`/products/${item.productSlug}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.productName} fill className="object-cover transition-transform group-hover:scale-105" sizes="200px" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-200">
            <ShoppingCart className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-1 line-clamp-2 text-xs font-medium text-gray-800">{item.productName}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">{formatPrice(item.unitPrice)}</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem(item.productId, 1, {
                name: item.productName,
                slug: item.productSlug,
                price: item.unitPrice,
                imageUrl: item.imageUrl,
              });
            }}
            className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}

export function PersonalizedSection() {
  const { user } = useAuthStore();
  const { items: favorites, fetch: fetchFavorites, loaded } = useFavoriteStore();
  const { addItem } = useCartStore();
  const [tab, setTab] = useState<Tab>('favorites');
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [recentLoaded, setRecentLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!loaded) fetchFavorites();
  }, [user, loaded, fetchFavorites]);

  useEffect(() => {
    if (!user || tab !== 'recent' || recentLoaded) return;
    api.get<RecentProduct[]>('/orders/recent-products', { params: { limit: 8 } })
      .then(({ data }) => { setRecentProducts(data); setRecentLoaded(true); })
      .catch(() => setRecentLoaded(true));
  }, [user, tab, recentLoaded]);

  if (!user) return null;

  const handleCart = async (product: Product) => {
    await addItem(product.id, product.minOrderQty ?? 1, {
      name: product.name,
      slug: product.slug,
      price: product.effectivePrice ?? product.price,
      imageUrl: product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url,
    });
  };

  const favProducts = favorites.map((f) => f.product).filter(Boolean);
  const isEmpty = tab === 'favorites' ? favProducts.length === 0 : recentProducts.length === 0;

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1 border-b border-gray-200">
            <button
              onClick={() => setTab('favorites')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === 'favorites' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Heart className="h-4 w-4" /> 즐겨찾기
              {favProducts.length > 0 && (
                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600">{favProducts.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab('recent')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === 'recent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="h-4 w-4" /> 최근 구매
            </button>
          </div>
          {tab === 'favorites' && favProducts.length > 0 && (
            <Link href="/my/favorites" className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-600">
              전체보기 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {isEmpty ? (
          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
            {tab === 'favorites'
              ? '즐겨찾기한 상품이 없습니다. 상품에서 ♡를 눌러 추가하세요.'
              : '구매 내역이 없습니다.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {tab === 'favorites'
              ? favProducts.slice(0, 6).map((p) => (
                  <ProductMiniCard key={p.id} product={p} onCart={handleCart} />
                ))
              : recentProducts.slice(0, 6).map((r) => (
                  <RecentMiniCard key={r.productId} item={r} />
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
