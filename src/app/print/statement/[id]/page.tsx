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

export default function StatementPage() {
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

  const grandTotal = order.productTotal;
  const supplyTotal = Math.round(grandTotal / 1.1);
  const vatTotal = grandTotal - supplyTotal;
  const issueDate = new Date(order.createdAt).toLocaleDateString('ko-KR');
  const addr = order.shippingAddress;

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } body { margin: 0; } } @page { size: A4; margin: 15mm; }`}</style>
      <div className="no-print flex items-center gap-2 border-b bg-gray-50 px-4 py-3">
        <button onClick={() => window.print()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">인쇄 / PDF 저장</button>
        <button onClick={() => window.history.back()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">돌아가기</button>
        <button onClick={() => window.close()} className="ml-auto rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">닫기</button>
      </div>

      <div className="mx-auto max-w-[210mm] bg-white p-10 print:p-0">
        <div className="mb-8 text-center">
          <h1 className="inline-block border-b-2 border-gray-800 pb-2 text-3xl font-bold tracking-[0.3em]">거 래 명 세 서</h1>
        </div>

        <div className="mb-6 flex items-start justify-between text-sm">
          <div className="space-y-1 text-gray-600">
            <div><span className="inline-block w-20 text-gray-400">주문번호</span><span className="font-medium">{order.orderNumber}</span></div>
            <div><span className="inline-block w-20 text-gray-400">거래일자</span><span>{issueDate}</span></div>
            <div><span className="inline-block w-20 text-gray-400">결제수단</span><span>{METHOD[order.paymentMethod] ?? order.paymentMethod}</span></div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">합계금액 (VAT 포함)</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{formatPrice(order.finalAmount)}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded border border-gray-300 p-4">
            <p className="mb-2 border-b pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">공급자</p>
            <div className="space-y-1.5">
              <div className="flex gap-2"><span className="w-16 flex-shrink-0 text-gray-400">상호</span><span className="font-semibold">{config.companyName || 'Labwise'}</span></div>
              {config.businessNumber && <div className="flex gap-2"><span className="w-16 flex-shrink-0 text-gray-400">사업자번호</span><span>{config.businessNumber}</span></div>}
              {config.ceoName && <div className="flex gap-2"><span className="w-16 flex-shrink-0 text-gray-400">대표자</span><span>{config.ceoName}</span></div>}
              {config.address && <div className="flex gap-2"><span className="w-16 flex-shrink-0 text-gray-400">주소</span><span>{config.address}</span></div>}
              {config.phone && <div className="flex gap-2"><span className="w-16 flex-shrink-0 text-gray-400">연락처</span><span>{config.phone}</span></div>}
            </div>
          </div>
          <div className="rounded border border-gray-300 p-4">
            <p className="mb-2 border-b pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">공급받는자</p>
            <div className="space-y-1.5">
              {addr?.name && <div className="flex gap-2"><span className="w-16 flex-shrink-0 text-gray-400">수령인</span><span className="font-semibold">{addr.name}</span></div>}
              {addr?.phone && <div className="flex gap-2"><span className="w-16 flex-shrink-0 text-gray-400">연락처</span><span>{addr.phone}</span></div>}
              {(addr?.address || addr?.detailAddress) && (
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">주소</span>
                  <span>{[addr.address, addr.detailAddress].filter(Boolean).join(' ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <table className="mb-4 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-600 px-3 py-2 text-left">품목</th>
              <th className="w-14 border border-gray-600 px-3 py-2 text-center">수량</th>
              <th className="w-28 border border-gray-600 px-3 py-2 text-right">단가</th>
              <th className="w-28 border border-gray-600 px-3 py-2 text-right">공급가액</th>
              <th className="w-24 border border-gray-600 px-3 py-2 text-right">세액(10%)</th>
              <th className="w-28 border border-gray-600 px-3 py-2 text-right">합계</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const supply = Math.round(item.subtotal / 1.1);
              const vat = item.subtotal - supply;
              return (
                <tr key={i} className="even:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2">{item.productName}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(item.unitPrice)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(supply)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(vat)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium">{formatPrice(item.subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td className="border border-gray-300 px-3 py-2" colSpan={3}>소 계</td>
              <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(supplyTotal)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(vatTotal)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right text-blue-700">{formatPrice(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="space-y-1 border-t border-gray-200 pt-3 text-sm">
          {order.shippingFee > 0 && (
            <div className="flex justify-between"><span className="text-gray-500">배송비</span><span>{formatPrice(order.shippingFee)}</span></div>
          )}
          {order.pointUsed > 0 && (
            <div className="flex justify-between text-blue-600"><span>포인트 사용 (-)</span><span>{formatPrice(order.pointUsed)}</span></div>
          )}
          <div className="flex justify-between pt-1 font-bold text-base">
            <span>최종 결제금액</span>
            <span className="text-blue-700">{formatPrice(order.finalAmount)}</span>
          </div>
        </div>

        <div className="mt-10 text-right text-sm text-gray-500">
          <p>{issueDate}</p>
          <p className="mt-1 text-base font-bold text-gray-800">{config.companyName || 'Labwise'} (인)</p>
        </div>
      </div>
    </>
  );
}
