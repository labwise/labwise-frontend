'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '결제 대기', color: 'text-yellow-600 bg-yellow-50' },
  PAID: { label: '결제 완료', color: 'text-blue-600 bg-blue-50' },
  PREPARING: { label: '상품 준비', color: 'text-indigo-600 bg-indigo-50' },
  SHIPPED: { label: '배송 중', color: 'text-purple-600 bg-purple-50' },
  DELIVERED: { label: '배송 완료', color: 'text-green-600 bg-green-50' },
  CANCELLED: { label: '취소', color: 'text-red-600 bg-red-50' },
  REFUNDED: { label: '환불', color: 'text-gray-600 bg-gray-50' },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });

  if (isLoading) return <div className="py-8 text-center text-gray-400">로딩 중...</div>;
  if (!order) return <div className="py-8 text-center text-gray-400">주문을 찾을 수 없습니다.</div>;

  const st = statusLabels[order.status] ?? { label: order.status, color: 'text-gray-600 bg-gray-50' };
  const addr = order.shippingAddress;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/my/orders" className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
          <ChevronLeft className="h-4 w-4" /> 주문 목록
        </Link>
        {order.status === 'PENDING' && (
          <Button
            variant="danger"
            size="sm"
            loading={cancelMutation.isPending}
            onClick={() => {
              if (confirm('주문을 취소하시겠습니까?')) cancelMutation.mutate();
            }}
          >
            주문 취소
          </Button>
        )}
      </div>

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
              <span>포인트 사용</span>
              <span>-{formatPrice(order.pointUsed)}</span>
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
        </div>
      )}
    </div>
  );
}
