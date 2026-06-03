'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, FileText, ChevronLeft, Plus, Minus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}`);
      return data;
    },
  });

  const primaryImage = product?.images?.find((i) => i.isPrimary) ?? product?.images?.[0];
  const price = product?.effectivePrice ?? product?.price ?? 0;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addItem(product!.id, qty, {
        name: product!.name,
        slug: product!.slug,
        price,
        imageUrl: primaryImage?.url,
      });
      router.push('/cart');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push(`/login?redirect=/products/${product!.slug}`);
      return;
    }
    setBuyingNow(true);
    try {
      await addItem(product!.id, qty, {
        name: product!.name,
        slug: product!.slug,
        price,
        imageUrl: primaryImage?.url,
      });
      router.push('/checkout');
    } finally {
      setBuyingNow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-32 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="aspect-square rounded-xl bg-gray-200" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-gray-200" />
              <div className="h-6 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="py-20 text-center text-gray-500">상품을 찾을 수 없습니다.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/products" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
        <ChevronLeft className="h-4 w-4" /> 상품 목록
      </Link>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
          {primaryImage ? (
            <Image src={primaryImage.url} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">이미지 없음</div>
          )}
        </div>

        <div>
          {product.manufacturer && <p className="mb-1 text-sm text-gray-400">{product.manufacturer}</p>}
          <h1 className="mb-2 text-2xl font-bold text-gray-900">{product.name}</h1>
          {product.sku && <p className="mb-2 text-sm text-gray-400">SKU: {product.sku}</p>}
          {product.casNumber && <p className="mb-2 text-sm text-gray-400">CAS: {product.casNumber}</p>}
          {product.specifications && (
            <p className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">{product.specifications}</p>
          )}

          <div className="mb-6 border-t border-b border-gray-100 py-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-3xl font-bold text-gray-900">{formatPrice(price)}</p>
              {product.taxType === 'TAX_EXEMPT' && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">면세</span>
              )}
              {product.taxType === 'ZERO_RATE' && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">영세율</span>
              )}
            </div>
            {product.unit && <p className="text-sm text-gray-400">/ {product.unit}</p>}
            {product.countryOfOrigin && (
              <p className="mt-1 text-sm text-gray-400">원산지: {product.countryOfOrigin}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              재고: {product.stockQuantity > 0 ? `${product.stockQuantity}개 남음` : '품절'}
            </p>
          </div>

          {!product.isOnSale ? (
            <div className="mb-6 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-500 text-center">
              현재 판매 중단된 상품입니다.
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-3">
              <div className="flex items-center rounded-md border border-gray-300">
                <button
                  onClick={() => setQty((q) => Math.max(product.minOrderQty, q - 1))}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.maxOrderQty ?? product.stockQuantity, q + 1))}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-400">
                최소 {product.minOrderQty}개
                {product.maxOrderQty && ` / 최대 ${product.maxOrderQty}개`}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              disabled={product.stockQuantity === 0 || !product.isOnSale}
              loading={adding}
              variant="outline"
              className="flex-1"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              장바구니 담기
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={product.stockQuantity === 0 || !product.isOnSale}
              loading={buyingNow}
              className="flex-1"
            >
              바로 구매
            </Button>
          </div>

          {!user && (
            <p className="mt-3 text-center text-xs text-gray-400">
              구매하려면{' '}
              <Link href="/register" className="text-blue-600 underline">회원가입</Link>
              {' '}또는{' '}
              <Link href="/login" className="text-blue-600 underline">로그인</Link>
              이 필요합니다.
            </p>
          )}

          {product.sdsFileUrl && (
            <a
              href={product.sdsFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <FileText className="h-4 w-4" /> SDS 자료 다운로드
            </a>
          )}
        </div>
      </div>

      {product.description && (
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">상품 설명</h2>
          <div
            className="rich-content rounded-xl border border-gray-200 bg-white p-6 text-gray-700 text-sm"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}
    </div>
  );
}
