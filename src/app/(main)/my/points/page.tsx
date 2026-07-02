'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PointLedger } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { useInstitutionStore } from '@/store/institution.store';
import { formatWise, formatDateTime } from '@/lib/utils';
import { Building2, User } from 'lucide-react';

const personalTypeLabels: Record<string, string> = {
  EARN: '와이즈 적립',
  USE: '와이즈 사용',
  EXPIRE: '와이즈 소멸',
  ADMIN_EARN: '관리자 지급',
  ADMIN_DEDUCT: '관리자 차감',
  POINT_ORDER_USE: '와이즈몰 사용',
  REFUND_RESTORE: '환불 복구',
};

const institutionTypeLabels: Record<string, string> = {
  earn: '적립',
  use: '사용',
  admin_earn: '관리자 지급',
  admin_deduct: '관리자 차감',
};

interface InstitutionLedger {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reason?: string;
  createdAt: string;
}

export default function PointsPage() {
  const { user } = useAuthStore();
  const { mode, institution } = useInstitutionStore();
  const isInstitution = mode === 'institution';

  const { data: personalHistory = [], isLoading: personalLoading } = useQuery<PointLedger[]>({
    queryKey: ['point-history'],
    queryFn: async () => {
      const { data } = await api.get('/points/history');
      return data;
    },
    enabled: !isInstitution,
  });

  const { data: institutionData, isLoading: institutionLoading } = useQuery<{ balance: number; ledger: InstitutionLedger[] }>({
    queryKey: ['institution-point-history'],
    queryFn: async () => {
      const { data } = await api.get('/institution/points');
      return data;
    },
    enabled: isInstitution,
  });
  const institutionHistory = institutionData?.ledger ?? [];
  const institutionBalance = institutionData?.balance ?? institution?.pointBalance ?? 0;

  const isLoading = isInstitution ? institutionLoading : personalLoading;

  if (isInstitution) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
            <Building2 className="h-4 w-4" />
            {institution?.name} 기관 와이즈
          </div>
          <span className="text-xl font-bold text-indigo-600">{formatWise(institutionBalance)}</span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-400">로딩 중...</div>
        ) : institutionHistory.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-400">
            기관 와이즈 내역이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {institutionHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {institutionTypeLabels[item.type] ?? item.type}
                  </p>
                  {item.reason && <p className="text-xs text-gray-400">{item.reason}</p>}
                  <p className="text-xs text-gray-400">{formatDateTime(item.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${item.amount > 0 ? 'text-indigo-600' : 'text-red-500'}`}>
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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
          <User className="h-4 w-4" />
          개인 보유 와이즈
        </div>
        <span className="text-xl font-bold text-blue-600">{formatWise(user?.pointBalance ?? 0)}</span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-400">로딩 중...</div>
      ) : personalHistory.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-400">
          와이즈 내역이 없습니다.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {personalHistory.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {personalTypeLabels[item.type] ?? item.type}
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
