'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { formatPrice, formatDateTime } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '결제 대기', color: 'text-yellow-600 bg-yellow-50' },
  PAID: { label: '결제 완료', color: 'text-blue-600 bg-blue-50' },
  PREPARING: { label: '상품 준비', color: 'text-indigo-600 bg-indigo-50' },
  SHIPPED: { label: '배송 중', color: 'text-purple-600 bg-purple-50' },
  DELIVERED: { label: '배송 완료', color: 'text-green-600 bg-green-50' },
  CANCELLED: { label: '취소', color: 'text-red-600 bg-red-50' },
  REFUNDED: { label: '환불', color: 'text-gray-600 bg-gray-50' },
};

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders');
      return data;
    },
  });

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">로딩 중...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-400">
        주문 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const st = statusLabels[order.status] ?? { label: order.status, color: 'text-gray-600 bg-gray-50' };
        return (
          <Link
            key={order.id}
            href={`/my/orders/${order.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(order.createdAt)}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>
                {st.label}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
              <p className="text-sm text-gray-500">
                {order.items?.[0]?.productName}
                {(order.items?.length ?? 0) > 1 && ` 외 ${order.items.length - 1}건`}
              </p>
              <p className="font-semibold text-gray-900">{formatPrice(order.finalAmount)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
