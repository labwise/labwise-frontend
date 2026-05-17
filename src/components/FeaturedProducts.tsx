'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

export function FeaturedProducts() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await api.get('/featured-products');
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">추천 상품</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-gray-100 h-64" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">추천 상품</h2>
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            전체 보기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const primaryImage = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
            const price = product.effectivePrice ?? product.price;
            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={product.name}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300 text-4xl">
                      📦
                    </div>
                  )}
                </div>
                <p className="mb-1 text-xs text-gray-400 truncate">{product.category?.name}</p>
                <p className="mb-2 text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                  {product.name}
                </p>
                <p className="text-base font-bold text-blue-600">{formatPrice(price)}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
