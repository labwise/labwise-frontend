'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { Users, ShoppingCart, DollarSign, Clock, Package } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
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
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">불러오는 중...</p>;
  if (!stats) return <p className="text-red-500 text-sm">데이터를 불러올 수 없습니다.</p>;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">대시보드</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          label="처리 대기"
          value={(stats.pendingOrders ?? 0).toLocaleString()}
          icon={Clock}
          color="bg-amber-500"
          sub="주문 확인 필요"
        />
        <StatCard
          label="등록 상품"
          value={(stats.totalProducts ?? 0).toLocaleString()}
          icon={Package}
          color="bg-violet-500"
        />
      </div>
    </div>
  );
}
