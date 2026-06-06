'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatPrice } from '@/lib/utils';

export default function EstimateFormPage() {
  const router = useRouter();
  const { items, fetchCart } = useCartStore();
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCart(); }, []);

  const grandTotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  async function handleSubmit() {
    if (!buyerCompany.trim()) return alert('상호명을 입력해주세요.');
    setLoading(true);
    try {
      const { data } = await api.post('/estimates', {
        buyerCompany: buyerCompany.trim(),
        buyerContact: buyerContact.trim() || undefined,
        buyerPhone: buyerPhone.trim() || undefined,
        items: items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.unitPrice * i.quantity,
        })),
        totalAmount: grandTotal,
      });
      router.push(`/print/estimate/${data.id}`);
    } catch {
      alert('견적서 발행에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-gray-900">견적서 발행</h2>
        <p className="mb-6 text-sm text-gray-500">
          공급받는자 정보를 입력하세요
          {items.length > 0 && ` (${items.length}개 품목 · ${formatPrice(grandTotal)})`}
        </p>

        {items.length === 0 ? (
          <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
            장바구니가 비어있습니다. 상품을 담은 후 다시 시도해주세요.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                상호명 <span className="text-red-500">*</span>
              </label>
              <input
                value={buyerCompany}
                onChange={(e) => setBuyerCompany(e.target.value)}
                placeholder="예: (주)한국연구소"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">담당자</label>
              <input
                value={buyerContact}
                onChange={(e) => setBuyerContact(e.target.value)}
                placeholder="예: 김연구"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">연락처</label>
              <input
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="예: 02-0000-0000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? '처리 중...' : '견적서 발행'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
