'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, loading, fetchCart, updateItem, removeItem } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, [user]);

  const productTotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const shippingFee = productTotal >= 50000 ? 0 : 3000;
  const totalAmount = productTotal + shippingFee;

  const handleCheckout = () => {
    if (!user) {
      router.push('/register?redirect=checkout');
      return;
    }
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">장바구니</h1>

      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="mb-4 text-gray-500">장바구니가 비어있습니다.</p>
          <Link href="/products">
            <Button variant="outline">상품 보러가기</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.productSlug}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2">
                      {item.productName}
                    </Link>
                    <p className="text-sm text-gray-500">{formatPrice(item.unitPrice)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatPrice(item.unitPrice * item.quantity)}</p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="mt-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-gray-900">주문 요약</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">상품 금액</span>
                  <span>{formatPrice(productTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">배송비</span>
                  <span>{shippingFee === 0 ? '무료' : formatPrice(shippingFee)}</span>
                </div>
                {productTotal < 50000 && (
                  <p className="text-xs text-blue-600">
                    {formatPrice(50000 - productTotal)} 더 담으면 무료 배송!
                  </p>
                )}
                <div className="border-t border-gray-100 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>총 결제 금액</span>
                    <span className="text-blue-600">{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </div>

              <Button className="mt-4 w-full" onClick={handleCheckout}>
                {user ? '주문하기' : '로그인 후 주문하기'} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {!user && (
                <div className="mt-3 rounded-lg bg-blue-50 p-3 text-center text-xs text-blue-700">
                  <p className="mb-1 font-medium">구매하려면 회원가입이 필요합니다</p>
                  <div className="flex justify-center gap-3">
                    <Link href="/register?redirect=checkout" className="underline">회원가입</Link>
                    <span>·</span>
                    <Link href="/login?redirect=checkout" className="underline">로그인</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
