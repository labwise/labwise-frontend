'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { formatPrice, formatDateTime } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING:   { label: '결제 대기', color: 'text-yellow-600 bg-yellow-50' },
  PAID:      { label: '결제 완료', color: 'text-blue-600 bg-blue-50' },
  PREPARING: { label: '배송 준비', color: 'text-indigo-600 bg-indigo-50' },
  SHIPPED:   { label: '배송 중',   color: 'text-purple-600 bg-purple-50' },
  DELIVERED: { label: '배송 완료', color: 'text-teal-600 bg-teal-50' },
  CONFIRMED: { label: '완료',      color: 'text-green-600 bg-green-50' },
  CANCELLED: { label: '취소',      color: 'text-red-600 bg-red-50' },
  REFUNDED:  { label: '환불',      color: 'text-gray-600 bg-gray-50' },
};

const TABS = [
  { key: 'ALL',       label: '전체' },
  { key: 'PENDING',   label: '결제 대기' },
  { key: 'PAID',      label: '결제 완료' },
  { key: 'PREPARING', label: '배송 준비' },
  { key: 'SHIPPED',   label: '배송 중' },
  { key: 'DELIVERED', label: '배송 완료' },
  { key: 'CONFIRMED', label: '완료' },
  { key: 'CANCELLED', label: '취소' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders');
      return data;
    },
  });

  const filtered = activeTab === 'ALL'
    ? orders
    : orders.filter((o) => o.status === activeTab);

  // 탭별 카운트
  const counts = TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === 'ALL'
      ? orders.length
      : orders.filter((o) => o.status === tab.key).length;
    return acc;
  }, {});

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">로딩 중...</div>;
  }

  return (
    <div>
      {/* 상태별 탭 */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex min-w-max gap-1 rounded-xl bg-gray-100 p-1">
          {TABS.map((tab) => {
            const cnt = counts[tab.key] ?? 0;
            const isActive = activeTab === tab.key;
            // 건수 0인 탭은 전체가 아니면 숨김
            if (tab.key !== 'ALL' && cnt === 0) return null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {cnt > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 주문 목록 */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-400">
          {activeTab === 'ALL' ? '주문 내역이 없습니다.' : `${statusLabels[activeTab]?.label ?? activeTab} 상태의 주문이 없습니다.`}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
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
      )}
    </div>
  );
}
