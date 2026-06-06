'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { X, CreditCard } from 'lucide-react';

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

interface SiteConfig {
  bankName?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
}

interface BankModalProps {
  order: Order;
  cfg: SiteConfig;
  onClose: () => void;
}

function BankAccountModal({ order, cfg, onClose }: BankModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">무통장 입금 계좌 안내</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-yellow-50 border border-yellow-200 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">은행</span>
            <span className="font-semibold text-gray-900">{cfg.bankName || '미설정'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">계좌번호</span>
            <span className="font-mono font-semibold text-gray-900 text-base">{cfg.bankAccount || '미설정'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">예금주</span>
            <span className="font-semibold text-gray-900">{cfg.bankAccountHolder || '미설정'}</span>
          </div>
          <div className="border-t border-yellow-200 pt-2.5 flex items-center justify-between text-sm">
            <span className="text-gray-500">입금 금액</span>
            <span className="font-bold text-blue-600 text-base">{formatPrice(order.finalAmount)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          주문번호 <span className="font-mono font-medium text-gray-600">{order.orderNumber}</span> 를 입금자명에 함께 기재해 주시면 더욱 빠르게 처리됩니다.
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [bankModalOrder, setBankModalOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders');
      return data;
    },
  });

  const { data: siteCfg = {} } = useQuery<SiteConfig>({
    queryKey: ['site-settings-bank'],
    queryFn: async () => {
      const { data } = await api.get('/site-settings');
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const filtered = activeTab === 'ALL'
    ? orders
    : orders.filter((o) => o.status === activeTab);

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
            const isBankPending = order.status === 'PENDING' && order.paymentMethod === 'BANK_TRANSFER';
            return (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-white">
                <Link
                  href={`/my/orders/${order.id}`}
                  className="block p-4 hover:bg-gray-50 rounded-xl"
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

                {/* 무통장 입금 대기 중인 경우 계좌 보기 버튼 */}
                {isBankPending && (
                  <div className="px-4 pb-4 -mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBankModalOrder(order);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 transition-colors"
                    >
                      <CreditCard size={14} />
                      무통장 입금 계좌 보기
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 계좌 안내 모달 */}
      {bankModalOrder && (
        <BankAccountModal
          order={bankModalOrder}
          cfg={siteCfg}
          onClose={() => setBankModalOrder(null)}
        />
      )}
    </div>
  );
}
