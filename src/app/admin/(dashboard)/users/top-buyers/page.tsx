'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { Trophy } from 'lucide-react';

interface TopBuyer {
  rank: number;
  id: string;
  name: string;
  email: string;
  phone: string;
  pointBalance: number;
  orderCount: number;
  totalAmount: number;
}

export default function TopBuyersPage() {
  const [buyers, setBuyers] = useState<TopBuyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/admin/users/top-buyers', { params: { limit: 30 } })
      .then(({ data }) => setBuyers(data))
      .finally(() => setLoading(false));
  }, []);

  const rankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-300';
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600 text-sm">← 회원 관리</Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          구매액 상위 회원
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-center px-4 py-3 text-gray-500 font-medium w-12">순위</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">회원</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">주문 수</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">총 구매액</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">와이즈 잔액</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">상세</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">불러오는 중...</td></tr>
            ) : buyers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">데이터가 없습니다</td></tr>
            ) : (
              buyers.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">
                    <span className={`text-lg font-bold ${rankColor(b.rank)}`}>{b.rank}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{b.orderCount.toLocaleString()}건</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    ₩{b.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                    {b.pointBalance.toLocaleString()}W
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/admin/users/${b.id}`} className="text-blue-600 hover:underline text-xs">
                      보기
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
