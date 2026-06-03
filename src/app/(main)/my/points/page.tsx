'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PointLedger } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { formatWise, formatDateTime } from '@/lib/utils';

const typeLabels: Record<string, string> = {
  EARN: '와이즈 적립',
  USE: '와이즈 사용',
  EXPIRE: '와이즈 소멸',
  ADMIN_EARN: '관리자 지급',
  ADMIN_DEDUCT: '관리자 차감',
  POINT_ORDER_USE: '와이즈몰 사용',
  REFUND_RESTORE: '환불 복구',
};

export default function PointsPage() {
  const { user } = useAuthStore();

  const { data: history = [], isLoading } = useQuery<PointLedger[]>({
    queryKey: ['point-history'],
    queryFn: async () => {
      const { data } = await api.get('/points/history');
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex justify-between items-center">
        <span className="text-sm font-medium text-blue-700">보유 와이즈</span>
        <span className="text-xl font-bold text-blue-600">{formatWise(user?.pointBalance ?? 0)}</span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-400">로딩 중...</div>
      ) : history.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-400">
          와이즈 내역이 없습니다.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {history.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {typeLabels[item.type] ?? item.type}
                </p>
                {item.reason && <p className="text-xs text-gray-400">{item.reason}</p>}
                <p className="text-xs text-gray-400">{formatDateTime(item.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${item.amount > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                  {item.amount > 0 ? '+' : ''}{formatWise(item.amount)}
                </p>
                <p className="text-xs text-gray-400">잔액: {formatWise(item.balanceAfter)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
