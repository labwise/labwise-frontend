'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Ticket } from 'lucide-react';

interface MyCoupon {
  id: string;
  couponId: string;
  usedAt: string | null;
  createdAt: string;
  coupon: {
    id: string; name: string; type: 'FIXED' | 'PERCENT' | 'FREE_SHIPPING';
    discountAmount?: number; discountRate?: number; maxDiscountAmount?: number;
    minOrderAmount: number; isActive: boolean;
    validFrom?: string | null; validTo?: string | null;
  };
}

function benefitLabel(c: MyCoupon['coupon']) {
  if (c.type === 'FIXED') return `${c.discountAmount?.toLocaleString()}원 할인`;
  if (c.type === 'PERCENT') return `${c.discountRate}% 할인${c.maxDiscountAmount ? ` (최대 ${c.maxDiscountAmount.toLocaleString()}원)` : ''}`;
  return '무료배송';
}

function isExpired(c: MyCoupon['coupon']) {
  if (!c.validTo) return false;
  return Date.now() > new Date(c.validTo).getTime();
}

export default function MyCouponsPage() {
  const [coupons, setCoupons] = useState<MyCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get('/coupons/my').then(({ data }) => setCoupons(data)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleRedeem() {
    if (!code.trim()) return;
    setRedeeming(true);
    setError('');
    setMessage('');
    try {
      await api.post('/coupons/redeem', { code: code.trim() });
      setMessage('쿠폰이 등록되었습니다.');
      setCode('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? '쿠폰 등록에 실패했습니다.');
    } finally {
      setRedeeming(false);
    }
  }

  const usable = coupons.filter((c) => !c.usedAt && c.coupon.isActive && !isExpired(c.coupon));
  const inactive = coupons.filter((c) => c.usedAt || !c.coupon.isActive || isExpired(c.coupon));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-gray-900">쿠폰 코드 등록</h2>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="쿠폰 코드 입력"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {redeeming ? '등록 중...' : '등록'}
          </button>
        </div>
        {message && <p className="mt-2 text-xs text-green-600">{message}</p>}
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-900">사용 가능한 쿠폰 ({usable.length})</h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : usable.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">사용 가능한 쿠폰이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {usable.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                <Ticket className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{c.coupon.name}</p>
                  <p className="text-xs text-gray-500">
                    {benefitLabel(c.coupon)}
                    {c.coupon.minOrderAmount > 0 && ` · ${c.coupon.minOrderAmount.toLocaleString()}원 이상 사용 가능`}
                    {c.coupon.validTo && ` · ~${new Date(c.coupon.validTo).toLocaleDateString('ko-KR')}까지`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {inactive.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-500">사용 완료 / 만료된 쿠폰</h2>
          <div className="space-y-2">
            {inactive.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 opacity-60">
                <Ticket className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div className="text-sm">
                  <p className="font-medium text-gray-700">{c.coupon.name}</p>
                  <p className="text-xs text-gray-400">
                    {benefitLabel(c.coupon)}
                    {c.usedAt ? ` · ${new Date(c.usedAt).toLocaleDateString('ko-KR')} 사용됨` : isExpired(c.coupon) ? ' · 기간 만료' : ' · 비활성'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
