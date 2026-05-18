'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { Users, ShoppingCart, DollarSign, Package, ChevronRight } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  byStatus?: {
    PENDING: number;
    PAID: number;
    PREPARING: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELLED: number;
    REFUNDED: number;
  };
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

const ORDER_STATUS_ROWS: {
  status: keyof NonNullable<Stats['byStatus']>;
  label: string;
  badge: string;
  action?: string;
}[] = [
  { status: 'PENDING', label: '입금전', badge: 'bg-yellow-100 text-yellow-700', action: '확인필요' },
  { status: 'PAID', label: '입금확인', badge: 'bg-blue-100 text-blue-700', action: '배송준비' },
  { status: 'PREPARING', label: '배송준비중', badge: 'bg-indigo-100 text-indigo-700' },
  { status: 'SHIPPED', label: '배송중', badge: 'bg-purple-100 text-purple-700' },
  { status: 'DELIVERED', label: '배송완료', badge: 'bg-green-100 text-green-700' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400">불러오는 중...</p>;
  if (!stats) return <p className="text-sm text-red-500">데이터를 불러올 수 없습니다.</p>;

  const actionNeeded = (stats.byStatus?.PENDING ?? 0) + (stats.byStatus?.PAID ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">대시보드</h1>

      {/* 주요 지표 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="전체 회원"
          value={(stats.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="전체 주문"
          value={(stats.totalOrders ?? 0).toLocaleString()}
          icon={ShoppingCart}
          color="bg-indigo-500"
        />
        <StatCard
          label="누적 매출"
          value={`${(stats.totalRevenue ?? 0).toLocaleString()}원`}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard
          label="등록 상품"
          value={(stats.totalProducts ?? 0).toLocaleString()}
          icon={Package}
          color="bg-violet-500"
        />
      </div>

      {/* 주문 현황 */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">주문 현황</h2>
            {actionNeeded > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                처리필요 {actionNeeded}건
              </span>
            )}
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-0.5 text-sm text-blue-600 hover:text-blue-700"
          >
            전체보기
            <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-5 divide-x divide-gray-100">
          {ORDER_STATUS_ROWS.map(({ status, label, badge, action }) => {
            const count = stats.byStatus?.[status] ?? 0;
            return (
              <Link
                key={status}
                href={`/admin/orders?status=${status}`}
                className="flex flex-col items-center gap-1 px-4 py-5 transition-colors hover:bg-gray-50"
              >
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
                  {label}
                </span>
                <span className={`text-2xl font-bold ${count > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                  {count}
                </span>
                {action && count > 0 && (
                  <span className="text-xs font-medium text-red-500">{action}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
