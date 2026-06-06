'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import adminApi from '@/lib/admin-api';
import { Truck } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING: '주문 접수', PAID: '결제 완료', CONFIRMED: '주문 확인', PREPARING: '준비중',
  SHIPPED: '배송중', DELIVERED: '배송완료', CANCELLED: '취소됨', REFUNDED: '환불됨',
};
const STATUS_FLOW = ['PENDING', 'PAID', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'];

const CARRIERS = [
  { value: 'cjlogistics', label: 'CJ대한통운' },
  { value: 'lotteglogis', label: '롯데택배' },
  { value: 'hanjin', label: '한진택배' },
  { value: 'koreapost', label: '우체국택배' },
  { value: 'ilogen', label: '로젠택배' },
  { value: 'kdexp', label: '경동택배' },
  { value: 'daesin', label: '대신택배' },
  { value: 'etc', label: '기타' },
];

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; sku: string };
}
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  finalAmount: number;
  shippingFee: number;
  discountAmount: number;
  createdAt: string;
  user: { name: string; email: string; phone: string };
  shippingAddress: { recipientName: string; phone: string; address: string; detailAddress: string; zipCode: string };
  items: OrderItem[];
  trackingNumber?: string;
  trackingCompany?: string;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingCompany, setTrackingCompany] = useState('cjlogistics');
  const [saving, setSaving] = useState(false);
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [trackingSaved, setTrackingSaved] = useState(false);

  useEffect(() => {
    adminApi.get(`/admin/orders/${id}`).then(({ data }) => {
      setOrder(data);
      setNewStatus(data.status);
      setTrackingNumber(data.trackingNumber ?? '');
      if (data.trackingCompany) setTrackingCompany(data.trackingCompany);
    });
  }, [id]);

  async function handleStatusUpdate() {
    if (!order || newStatus === order.status) return;
    setSaving(true);
    try {
      const { data } = await adminApi.put(`/admin/orders/${id}/status`, {
        status: newStatus,
        reason: reason || undefined,
      });
      setOrder(data);
    } finally {
      setSaving(false);
    }
  }

  async function handleTrackingSave() {
    if (!trackingNumber.trim()) return;
    setTrackingSaving(true);
    try {
      const { data } = await adminApi.put(`/admin/orders/${id}/tracking`, {
        trackingNumber: trackingNumber.trim(),
        trackingCompany,
      });
      setOrder(data);
      setTrackingSaved(true);
      setTimeout(() => setTrackingSaved(false), 2000);
    } finally {
      setTrackingSaving(false);
    }
  }

  if (!order) return <p className="text-gray-400 text-sm">불러오는 중...</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← 뒤로</button>
        <h1 className="text-xl font-bold text-gray-900">주문 상세</h1>
        <span className="text-sm text-gray-400 font-mono">{order.orderNumber}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">주문 상품</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product?.name}</p>
                    <p className="text-xs text-gray-400">{item.product?.sku} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">{(item.unitPrice * item.quantity).toLocaleString()}원</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>배송비</span><span>{order.shippingFee?.toLocaleString() ?? 0}원</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>할인</span><span>-{order.discountAmount.toLocaleString()}원</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>합계</span><span>{(order.finalAmount ?? order.totalAmount)?.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-3">배송지</h2>
            {order.shippingAddress && (
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{order.shippingAddress.recipientName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>[{order.shippingAddress.zipCode}] {order.shippingAddress.address} {order.shippingAddress.detailAddress}</p>
              </div>
            )}
          </div>

          {/* 운송장 입력 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck size={16} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">운송장 관리</h2>
            </div>
            {order.trackingNumber && (
              <div className="mb-3 rounded-lg bg-purple-50 border border-purple-100 px-4 py-3 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-purple-700 font-medium">
                    {CARRIERS.find(c => c.value === order.trackingCompany)?.label ?? order.trackingCompany}
                  </span>
                  <span className="ml-2 font-mono text-purple-600">{order.trackingNumber}</span>
                </div>
                <a
                  href={`https://tracker.delivery/#/${order.trackingCompany}/${order.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  배송 조회 →
                </a>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">택배사</label>
                <select
                  value={trackingCompany}
                  onChange={(e) => setTrackingCompany(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CARRIERS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">송장 번호</label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="숫자만 입력"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <button
                onClick={handleTrackingSave}
                disabled={trackingSaving || !trackingNumber.trim()}
                className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {trackingSaved ? '저장됨 ✓' : trackingSaving ? '저장 중...' : '운송장 저장'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">상태 관리</h2>
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">현재 상태</p>
              <p className="font-medium text-gray-900">{STATUS_LABELS[order.status] ?? order.status}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">변경할 상태</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[...STATUS_FLOW, 'CANCELLED', 'REFUNDED'].map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">사유 (선택)</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="취소/환불 사유 등"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={saving || newStatus === order.status}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '상태 변경'}
              </button>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-3">주문자</h2>
            <div className="text-sm space-y-1">
              <p className="font-medium text-gray-900">{order.user?.name}</p>
              <p className="text-gray-500">{order.user?.email}</p>
              <p className="text-gray-500">{order.user?.phone}</p>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-3">주문 정보</h2>
            <div className="text-sm space-y-2 text-gray-500">
              <div className="flex justify-between">
                <span>주문일</span>
                <span>{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
