'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface SiteConfig { companyName?: string; businessNumber?: string; ceoName?: string; address?: string; phone?: string; }
interface OrderItem { productName: string; quantity: number; unitPrice: number; subtotal: number; }
interface Order {
  id: string; orderNumber: string; finalAmount: number; productTotal: number;
  shippingFee: number; pointUsed: number; paymentMethod: string;
  items: OrderItem[]; shippingAddress: Record<string, string>; createdAt: string;
}

const METHOD: Record<string, string> = {
  CARD: '신용카드', VIRTUAL_ACCOUNT: '가상계좌', BANK_TRANSFER: '무통장입금',
  KAKAOPAY: '카카오페이', POSTPAY: '후불결제',
};

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [config, setConfig] = useState<SiteConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/orders/${id}`).then(({ data }) => setOrder(data)),
      api.get('/site-settings').then(({ data }) => setConfig(data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!order) return <div className="flex min-h-screen items-center justify-center text-red-500">주문을 찾을 수 없습니다.</div>;

  const supplyTotal = Math.round(order.productTotal / 1.1);
  const vatTotal = order.productTotal - supplyTotal;
  const paidAt = new Date(order.createdAt).toLocaleString('ko-KR');

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } body { margin: 0; } } @page { size: A5; margin: 10mm; }`}</style>
      <div className="no-print flex items-center gap-2 border-b bg-gray-50 px-4 py-3">
        <button onClick={() => window.print()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">인쇄 / PDF 저장</button>
        <button onClick={() => window.close()} className="ml-auto rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">닫기</button>
      </div>

      <div className="mx-auto max-w-[148mm] bg-white p-8 print:p-0">
        <div className="mb-6 text-center">
          <h1 className="inline-block border-b-2 border-gray-800 pb-2 text-2xl font-bold tracking-[0.3em]">영 수 증</h1>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex gap-2"><span className="w-20 text-gray-400">주문번호</span><span className="font-medium">{order.orderNumber}</span></div>
            <div className="flex gap-2"><span className="w-20 text-gray-400">결제일시</span><span>{paidAt}</span></div>
            <div className="flex gap-2"><span className="w-20 text-gray-400">결제수단</span><span>{METHOD[order.paymentMethod] ?? order.paymentMethod}</span></div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">결제 금액</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{formatPrice(order.finalAmount)}</p>
          </div>
        </div>

        <div className="mb-5 rounded border border-gray-200 p-3 text-sm">
          <p className="mb-1 text-xs font-semibold text-gray-500">공급자</p>
          <p className="font-semibold">{config.companyName || 'Labwise'}</p>
          {config.businessNumber && <p className="text-gray-500">사업자번호: {config.businessNumber}</p>}
          {config.phone && <p className="text-gray-500">연락처: {config.phone}</p>}
        </div>

        <table className="mb-4 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-600 px-2 py-1.5 text-left">품목</th>
              <th className="w-10 border border-gray-600 px-2 py-1.5 text-center">수량</th>
              <th className="w-24 border border-gray-600 px-2 py-1.5 text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="even:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1.5">{item.productName}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">{item.quantity}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right">{formatPrice(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1.5 border-t border-gray-200 pt-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">공급가액</span><span>{formatPrice(supplyTotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">부가세 (10%)</span><span>{formatPrice(vatTotal)}</span></div>
          {order.shippingFee > 0 && <div className="flex justify-between"><span className="text-gray-500">배송비</span><span>{formatPrice(order.shippingFee)}</span></div>}
          {order.pointUsed > 0 && <div className="flex justify-between text-blue-600"><span>포인트 사용</span><span>-{formatPrice(order.pointUsed)}</span></div>}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span>최종 결제금액</span>
            <span className="text-blue-700">{formatPrice(order.finalAmount)}</span>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">위 금액을 영수합니다.</p>
        <div className="mt-2 text-right text-sm">
          <p>{new Date(order.createdAt).toLocaleDateString('ko-KR')}</p>
          <p className="mt-1 font-bold">{config.companyName || 'Labwise'} (인)</p>
        </div>
      </div>
    </>
  );
}
