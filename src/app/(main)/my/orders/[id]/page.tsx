'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Receipt, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { formatPrice, formatWise, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface PaymentInfo { receiptUrl?: string; method?: string; }

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '결제 대기', color: 'text-yellow-600 bg-yellow-50' },
  PAID: { label: '결제 완료', color: 'text-blue-600 bg-blue-50' },
  PREPARING: { label: '상품 준비', color: 'text-indigo-600 bg-indigo-50' },
  SHIPPED: { label: '배송 중', color: 'text-purple-600 bg-purple-50' },
  DELIVERED: { label: '배송 완료', color: 'text-green-600 bg-green-50' },
  CANCELLED: { label: '취소됨', color: 'text-red-600 bg-red-50' },
  REFUNDED: { label: '환불 완료', color: 'text-gray-600 bg-gray-50' },
};

const REFUND_REASONS = [
  { value: 'CHANGE_OF_MIND', label: '단순 변심', note: '반품 배송비는 고객님 부담입니다' },
  { value: 'DEFECTIVE', label: '상품 불량/파손', note: '반품 배송비는 저희가 부담합니다' },
  { value: 'WRONG_ITEM', label: '오배송 (다른 상품 도착)', note: '반품 배송비는 저희가 부담합니다' },
  { value: 'DESCRIPTION_MISMATCH', label: '상품 설명과 실물이 다름', note: '반품 배송비는 저희가 부담합니다' },
  { value: 'OTHER', label: '기타', note: '상세 사유를 입력해주세요' },
] as const;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [refundCategory, setRefundCategory] = useState<typeof REFUND_REASONS[number]['value']>('CHANGE_OF_MIND');
  const [refundDetail, setRefundDetail] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    },
  });

  const { data: paymentInfo } = useQuery<PaymentInfo>({
    queryKey: ['payment', id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/payments/orders/${id}`);
        return data;
      } catch {
        return {};
      }
    },
    enabled: !!order && (order.status === 'PAID' || order.status === 'PREPARING' || order.status === 'SHIPPED' || order.status === 'DELIVERED'),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await api.post('/payments/cancel', { orderId: id, cancelReason: '고객 요청 취소' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });

  const refundMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/orders/${id}/refund`, { category: refundCategory, detail: refundDetail || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setShowRefundModal(false);
    },
  });

  if (isLoading) return <div className="py-8 text-center text-gray-400">로딩 중...</div>;
  if (!order) return <div className="py-8 text-center text-gray-400">주문을 찾을 수 없습니다.</div>;

  const st = statusLabels[order.status] ?? { label: order.status, color: 'text-gray-600 bg-gray-50' };
  const addr = order.shippingAddress;
  const canCancel = order.status === 'PENDING' || order.status === 'PAID';
  const canRefund = order.status === 'DELIVERED' || order.status === 'CONFIRMED';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/my/orders" className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
          <ChevronLeft className="h-4 w-4" /> 주문 목록
        </Link>
        <div className="flex gap-2">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              loading={cancelMutation.isPending}
              onClick={() => {
                if (confirm('주문을 취소하시겠습니까?\n결제가 완료된 주문은 즉시 환불 처리됩니다.'))
                  cancelMutation.mutate();
              }}
            >
              주문 취소
            </Button>
          )}
          {canRefund && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRefundModal(true)}
            >
              반품/환불 신청
            </Button>
          )}
        </div>
      </div>

      {/* 환불 신청 모달 */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-base font-bold text-gray-900">반품/환불 신청</h3>
            <p className="mb-3 text-sm text-gray-500">
              신청 사유를 선택해주세요. 사유에 따라 반품 배송비 부담 주체가 달라집니다.
            </p>
            <div className="space-y-2">
              {REFUND_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-sm ${
                    refundCategory === r.value ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={refundCategory === r.value}
                      onChange={() => setRefundCategory(r.value)}
                    />
                    <span className="font-medium text-gray-900">{r.label}</span>
                  </span>
                  <span className="ml-6 text-xs text-gray-400">{r.note}</span>
                </label>
              ))}
            </div>
            <textarea
              value={refundDetail}
              onChange={(e) => setRefundDetail(e.target.value)}
              placeholder={refundCategory === 'OTHER' ? '상세 사유를 입력해주세요 (필수)' : '상세 내용 (선택)'}
              rows={2}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRefundModal(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                loading={refundMutation.isPending}
                onClick={() => {
                  if (refundCategory === 'OTHER' && !refundDetail.trim()) {
                    return alert('기타 사유는 상세 내용을 입력해주세요.');
                  }
                  refundMutation.mutate();
                }}
              >
                신청하기
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{order.orderNumber}</p>
            <p className="text-sm text-gray-400">{formatDateTime(order.createdAt)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${st.color}`}>
            {st.label}
          </span>
        </div>
        {order.cancelReason && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            사유: {order.cancelReason}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-gray-900">주문 상품</h2>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                <p className="text-xs text-gray-400">{formatPrice(item.unitPrice)} × {item.quantity}</p>
              </div>
              <p className="font-medium text-gray-900">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-gray-900">결제 내역</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">상품 금액</span>
            <span>{formatPrice(order.productTotal)}</span>
          </div>
          {order.pointUsed > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>와이즈 사용</span>
              <span>-{formatWise(order.pointUsed)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">배송비</span>
            <span>{order.shippingFee === 0 ? '무료' : formatPrice(order.shippingFee)}</span>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <div className="flex justify-between font-bold">
              <span>최종 결제 금액</span>
              <span className="text-blue-600">{formatPrice(order.finalAmount)}</span>
            </div>
          </div>
        </div>
        {(paymentInfo?.receiptUrl || (order.status !== 'PENDING' && order.status !== 'CANCELLED')) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {paymentInfo?.receiptUrl && (
              <a
                href={paymentInfo.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Receipt className="h-4 w-4" />
                카드 영수증 보기
              </a>
            )}
            {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
              <>
                <button
                  onClick={() => window.open(`/print/statement/${order.id}`, '_blank')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 text-blue-500" />
                  거래명세서
                </button>
                <button
                  onClick={() => window.open(`/print/receipt/${order.id}`, '_blank')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Receipt className="h-4 w-4 text-green-500" />
                  영수증
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {addr && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-gray-900">배송지</h2>
          <div className="space-y-1 text-sm text-gray-600">
            <p>{addr.recipientName} ({addr.phone})</p>
            <p>[{addr.zipCode}] {addr.address}</p>
            {addr.addressDetail && <p>{addr.addressDetail}</p>}
          </div>
          {order.memo && (
            <p className="mt-2 rounded bg-gray-50 px-3 py-2 text-sm text-gray-500">
              메모: {order.memo}
            </p>
          )}
          {order.trackingNumber && (
            <div className="mt-3 rounded-lg bg-purple-50 border border-purple-100 px-4 py-3 flex items-center justify-between">
              <div className="text-sm">
                <p className="text-xs text-purple-500 mb-0.5">배송 정보</p>
                <p className="font-medium text-purple-800">
                  {order.trackingCompany}&nbsp;
                  <span className="font-mono">{order.trackingNumber}</span>
                </p>
              </div>
              <a
                href={`https://tracker.delivery/#/${order.trackingCompany}/${order.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
              >
                배송 조회
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
