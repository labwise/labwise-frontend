'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';
import type { PointProduct } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { formatWise } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface PointProductsResponse {
  items: PointProduct[];
  total: number;
}

export default function PointMallPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery<PointProductsResponse>({
    queryKey: ['point-products'],
    queryFn: async () => {
      const { data } = await api.get('/point-mall/products');
      return data;
    },
    enabled: !!user?.hasPointmallAccess,
  });

  if (user === null) {
    router.push('/login');
    return null;
  }

  if (!user.hasPointmallAccess) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-10 inline-block">
          <p className="text-2xl mb-3">🔒</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">인증회원 전용 서비스입니다</h2>
          <p className="text-gray-500 text-sm mb-6">
            와이즈몰은 인증된 회원만 이용할 수 있습니다.<br />
            회원 인증 후 와이즈로 다양한 상품을 교환해보세요.
          </p>
          <button
            onClick={() => router.push('/my/verification')}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            인증 신청하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">와이즈몰</h1>
            <p className="mt-1 text-blue-100">와이즈로 상품을 교환하세요 (인증회원 전용)</p>
          </div>
          {user && (
            <div className="text-right">
              <p className="text-sm text-blue-200">보유 와이즈</p>
              <p className="text-2xl font-bold">{formatWise(user.pointBalance)}</p>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {data?.items.map((product) => {
            const primaryImage = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
            const canAfford = (user?.pointBalance ?? 0) >= product.requiredPoints;

            return (
              <div
                key={product.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100">
                  {primaryImage ? (
                    <Image src={primaryImage.url} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <Star className="h-12 w-12" />
                    </div>
                  )}
                  {product.stockQuantity === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="rounded bg-white px-2 py-1 text-xs font-semibold">품절</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="mb-1 line-clamp-2 text-sm font-medium text-gray-900">{product.name}</h3>
                  <p className="mb-auto text-xs text-gray-400">{product.category}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-blue-600">{formatWise(product.requiredPoints)}</p>
                      {product.referencePrice && (
                        <p className="text-xs text-gray-400">약 {formatPrice(product.referencePrice)}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      disabled={product.stockQuantity === 0 || !canAfford}
                      onClick={() => router.push(`/point-mall/order?productId=${product.id}`)}
                    >
                      {!user ? '로그인 필요' : !canAfford ? '와이즈 부족' : '교환하기'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
