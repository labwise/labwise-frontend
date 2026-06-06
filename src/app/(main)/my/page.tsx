'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { formatWise, formatPrice } from '@/lib/utils';
import { User, Mail, Star, Heart } from 'lucide-react';

export default function MyPage() {
  const { user, updateUser } = useAuthStore();

  // 마이페이지 진입 시 항상 최신 사용자 정보 갱신
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      updateUser({
        pointBalance: data.pointBalance ?? 0,
        donationTotal: data.donationTotal ?? 0,
        hasPointmallAccess: data.pointmallAccess ?? data.hasPointmallAccess,
        name: data.name,
        email: data.email,
      });
    }).catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-900">내 정보</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 w-16">이름</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 w-16">이메일</span>
            <span>{user.email}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-blue-900">보유 와이즈</h2>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatWise(user.pointBalance)}</p>
        </div>
        <p className="mt-2 text-sm text-blue-500">와이즈는 주문 시 할인에 사용할 수 있습니다</p>
      </div>

      <div className="rounded-xl border border-green-100 bg-green-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold text-green-900">내 기부 기여금</h2>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatPrice(user.donationTotal ?? 0)}</p>
        </div>
        <p className="mt-2 text-sm text-green-500">구매 금액의 1.5%가 어린이·봉사단체에 기부됩니다</p>
      </div>
    </div>
  );
}
