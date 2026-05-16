'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';

const STATUS_LABELS: Record<string, string> = {
  PENDING: '신청', PROCESSING: '처리중', SHIPPED: '발송', DELIVERED: '완료', CANCELLED: '취소',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700', PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700', DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
};
const STATUS_FLOW = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

interface PointOrder {
  id: string; status: string; createdAt: string;
  totalPoints: number; shippingAddress: { recipientName: string; address: string };
  user: { name: string; email: string };
  items: { quantity: number; pointProduct: { name: string } }[];
}

export default function PointMallOrdersPage() {
  const [orders, setOrders] = useState<PointOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  function load() {
    setLoading(true);
    adminApi.get('/admin/point-mall/orders', {
      params: { limit: 50, status: statusFilter || undefined },
    })
      .then(({ data }) => setOrders(data.items ?? data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      await adminApi.put(`/admin/point-mall/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">와이즈몰 주문</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">전체 상태</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">회원</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">상품</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">와이즈</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">배송지</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">상태 변경</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">신청일</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">불러오는 중...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">주문이 없습니다</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{o.user?.name}</p>
                    <p className="text-xs text-gray-400">{o.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.items?.map((item) => (
                      <p key={item.pointProduct?.name}>{item.pointProduct?.name} × {item.quantity}</p>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">
                    {(o.totalPoints ?? 0).toLocaleString()}P
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <p>{o.shippingAddress?.recipientName}</p>
                    <p className="truncate max-w-[160px]">{o.shippingAddress?.address}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      disabled={updating === o.id}
                      className={`border rounded-lg px-2 py-1 text-xs focus:outline-none ${STATUS_COLORS[o.status] ?? ''} border-transparent`}
                    >
                      {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(o.createdAt).toLocaleDateString('ko-KR')}
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
