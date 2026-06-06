'use client';

import { useEffect, useState, useCallback } from 'react';
import adminApi from '@/lib/admin-api';
import { Search, Truck, X, Calendar, ChevronDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  finalAmount: number;
  paymentMethod: string;
  trackingNumber?: string;
  trackingCompany?: string;
  cancelReason?: string;
  shippingAddress: { recipientName: string; phone: string; addressLine1: string; city: string; zipCode: string };
  memo?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  user: { id: string; name: string; email: string };
  items: OrderItem[];
}

const TABS: { value: OrderStatus | ''; label: string; color: string }[] = [
  { value: '', label: '전체', color: 'text-gray-600' },
  { value: 'PENDING', label: '입금전', color: 'text-yellow-600' },
  { value: 'PAID', label: '입금확인', color: 'text-blue-600' },
  { value: 'PREPARING', label: '배송준비중', color: 'text-indigo-600' },
  { value: 'SHIPPED', label: '배송중', color: 'text-purple-600' },
  { value: 'DELIVERED', label: '배송완료', color: 'text-green-600' },
  { value: 'CONFIRMED', label: '구매확정', color: 'text-emerald-600' },
  { value: 'CANCELLED', label: '취소/환불', color: 'text-gray-400' },
];

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  REFUNDED: 'bg-red-100 text-red-600',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: '입금전',
  PAID: '입금확인',
  PREPARING: '배송준비중',
  SHIPPED: '배송중',
  DELIVERED: '배송완료',
  CONFIRMED: '구매확정',
  CANCELLED: '취소됨',
  REFUNDED: '환불됨',
};

const NEXT_STATUS: Partial<Record<OrderStatus, { to: OrderStatus; label: string; color: string }>> = {
  PENDING: { to: 'PAID', label: '입금확인', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  PAID: { to: 'PREPARING', label: '배송준비', color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  PREPARING: { to: 'SHIPPED', label: '배송중처리', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  SHIPPED: { to: 'DELIVERED', label: '배송완료', color: 'bg-green-600 hover:bg-green-700 text-white' },
  DELIVERED: { to: 'CONFIRMED', label: '구매확정', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
};

const PAYMENT_LABEL: Record<string, string> = {
  CARD: '신용카드',
  VIRTUAL_ACCOUNT: '가상계좌',
  BANK_TRANSFER: '계좌이체',
  KAKAOPAY: '카카오페이',
  POSTPAY: '후불결제',
};

const BULK_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'PENDING', label: '입금전' },
  { value: 'PAID', label: '입금확인' },
  { value: 'PREPARING', label: '배송준비중' },
  { value: 'SHIPPED', label: '배송중' },
  { value: 'DELIVERED', label: '배송완료' },
  { value: 'CONFIRMED', label: '구매확정' },
  { value: 'CANCELLED', label: '취소' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // 날짜 필터
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 체크박스 선택
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('PAID');
  const [bulkLoading, setBulkLoading] = useState(false);

  // 운송장 모달
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingCompany, setTrackingCompany] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingSaving, setTrackingSaving] = useState(false);

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    setSelectedIds(new Set());
    const statusParam = activeTab === 'CANCELLED' ? undefined : (activeTab || undefined);

    adminApi
      .get('/admin/orders', {
        params: {
          page,
          limit,
          status: statusParam,
          search: appliedSearch || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      })
      .then(({ data }) => {
        let items = data.items ?? data;
        if (activeTab === 'CANCELLED') {
          items = items.filter((o: Order) => o.status === 'CANCELLED' || o.status === 'REFUNDED');
        }
        setOrders(items);
        setTotal(data.total ?? data.length);
      })
      .finally(() => setLoading(false));
  }, [page, activeTab, appliedSearch, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminApi.get('/admin/dashboard').then(({ data }) => {
      if (data.byStatus) setCounts(data.byStatus);
    });
  }, []);

  function handleTabChange(tab: OrderStatus | '') {
    setActiveTab(tab);
    setPage(1);
    setSelectedIds(new Set());
  }

  function applySearch() {
    setAppliedSearch(search);
    setPage(1);
  }

  function applyDateFilter() {
    setPage(1);
    load();
  }

  async function handleStatusChange(order: Order, nextStatus: OrderStatus) {
    if (nextStatus === 'SHIPPED') {
      setTrackingOrder(order);
      setTrackingCompany(order.trackingCompany ?? '');
      setTrackingNumber(order.trackingNumber ?? '');
      return;
    }
    await adminApi.put(`/admin/orders/${order.id}/status`, { status: nextStatus });
    load();
  }

  async function handleCancelOrder(order: Order) {
    if (!confirm(`주문 ${order.orderNumber}을(를) 취소하시겠습니까?`)) return;
    await adminApi.put(`/admin/orders/${order.id}/status`, { status: 'CANCELLED' });
    load();
  }

  async function handleRefund(order: Order) {
    if (!confirm(`주문 ${order.orderNumber} 환불 처리하시겠습니까?\n카드/가상계좌 결제 시 자동으로 취소됩니다.`)) return;
    try {
      await adminApi.post(`/admin/orders/${order.id}/refund`, { reason: '관리자 환불 처리' });
      load();
    } catch (e: any) {
      alert(e.response?.data?.message ?? '환불 처리 중 오류가 발생했습니다.');
    }
  }

  async function handleSaveTracking() {
    if (!trackingOrder) return;
    if (!trackingNumber.trim()) return alert('운송장 번호를 입력하세요.');
    setTrackingSaving(true);
    try {
      await adminApi.put(`/admin/orders/${trackingOrder.id}/tracking`, {
        trackingNumber: trackingNumber.trim(),
        trackingCompany: trackingCompany.trim(),
      });
      await adminApi.put(`/admin/orders/${trackingOrder.id}/status`, { status: 'SHIPPED' });
      setTrackingOrder(null);
      load();
    } finally {
      setTrackingSaving(false);
    }
  }

  // 체크박스 토글
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  }

  async function handleBulkStatus() {
    if (selectedIds.size === 0) return alert('주문을 선택해주세요.');
    if (!confirm(`선택한 ${selectedIds.size}건의 상태를 "${BULK_STATUS_OPTIONS.find(o => o.value === bulkStatus)?.label}"으로 변경하시겠습니까?`)) return;
    setBulkLoading(true);
    try {
      await adminApi.post('/admin/orders/bulk-status', {
        orderIds: Array.from(selectedIds),
        status: bulkStatus,
      });
      load();
    } catch (e: any) {
      alert(e.response?.data?.message ?? '일괄 변경 중 오류가 발생했습니다.');
    } finally {
      setBulkLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);
  const allChecked = orders.length > 0 && selectedIds.size === orders.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">주문 관리</h1>
          <p className="mt-0.5 text-sm text-gray-500">전체 {total.toLocaleString()}건</p>
        </div>
      </div>

      {/* 상태별 탭 */}
      <div className="flex gap-0.5 rounded-xl bg-gray-100 p-1 overflow-x-auto">
        {TABS.map((tab) => {
          const count = tab.value
            ? (tab.value === 'CANCELLED'
              ? (counts['CANCELLED'] ?? 0) + (counts['REFUNDED'] ?? 0)
              : (counts[tab.value] ?? 0))
            : undefined;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value as OrderStatus | '')}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={isActive ? tab.color : ''}>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 검색 + 날짜 필터 */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
            placeholder="주문번호, 회원명 검색"
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>
        <button
          onClick={applySearch}
          className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
        >
          검색
        </button>
        <div className="flex items-center gap-1.5 ml-2">
          <Calendar size={14} className="text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="py-2 px-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="py-2 px-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={applyDateFilter}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            적용
          </button>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
              className="px-2 py-2 text-gray-400 hover:text-gray-600 text-sm"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 일괄 처리 영역 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5">
          <span className="text-sm font-medium text-blue-700">{selectedIds.size}건 선택됨</span>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
                className="appearance-none py-1.5 pl-3 pr-8 border border-blue-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BULK_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={handleBulkStatus}
              disabled={bulkLoading}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkLoading ? '처리 중...' : '일괄 변경'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {/* 주문 테이블 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left">주문번호</th>
              <th className="px-4 py-3 text-left">회원</th>
              <th className="px-4 py-3 text-right">금액</th>
              <th className="px-4 py-3 text-center">결제방법</th>
              <th className="px-4 py-3 text-center">상태</th>
              <th className="px-4 py-3 text-left">주문일</th>
              <th className="px-4 py-3 text-center">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-gray-400">불러오는 중...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-gray-400">주문이 없습니다.</td>
              </tr>
            ) : (
              orders.map((o) => {
                const next = NEXT_STATUS[o.status];
                const isSelected = selectedIds.has(o.id);
                return (
                  <tr key={o.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(o.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-700">{o.orderNumber}</p>
                      {o.trackingNumber && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-purple-600">
                          <Truck size={11} />
                          {o.trackingCompany && <span>{o.trackingCompany}</span>}
                          <span>{o.trackingNumber}</span>
                        </p>
                      )}
                      {o.cancelReason && (
                        <p className="mt-0.5 text-xs text-red-500 truncate max-w-[160px]" title={o.cancelReason}>
                          사유: {o.cancelReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.user?.name}</p>
                      <p className="text-xs text-gray-400">{o.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatPrice(o.finalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(o.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {next && (
                          <button
                            onClick={() => handleStatusChange(o, next.to)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${next.color}`}
                          >
                            {next.label}
                          </button>
                        )}
                        {(o.status === 'PENDING' || o.status === 'PAID') && (
                          <button
                            onClick={() => handleCancelOrder(o)}
                            className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            취소
                          </button>
                        )}
                        {o.status === 'CANCELLED' && (
                          <button
                            onClick={() => handleRefund(o)}
                            className="rounded-md px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            환불처리
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* 운송장 번호 입력 모달 */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">배송중 처리</h2>
              <button onClick={() => setTrackingOrder(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              주문번호: <span className="font-mono font-medium text-gray-900">{trackingOrder.orderNumber}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">택배사</label>
                <input
                  type="text"
                  value={trackingCompany}
                  onChange={(e) => setTrackingCompany(e.target.value)}
                  placeholder="예: CJ대한통운, 롯데택배, 한진택배"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  운송장 번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="예: 123456789012"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setTrackingOrder(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveTracking}
                disabled={trackingSaving}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                <Truck size={14} />
                {trackingSaving ? '처리 중...' : '배송중 처리'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
