'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

interface SiteConfig {
  companyName?: string;
  businessNumber?: string;
  ceoName?: string;
  address?: string;
  phone?: string;
}

const paymentMethodLabel: Record<string, string> = {
  CARD: '신용카드',
  BANK_TRANSFER: '무통장입금',
  VIRTUAL_ACCOUNT: '가상계좌',
};

export default function StatementPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [config, setConfig] = useState<SiteConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/orders/${orderId}`).then(({ data }) => setOrder(data)),
      api.get('/site-settings').then(({ data }) => setConfig(data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        주문을 찾을 수 없습니다.
      </div>
    );
  }

  const addr = order.shippingAddress;
  const grandTotal = order.finalAmount;
  const supplyTotal = Math.round(grandTotal / 1.1);
  const vatTotal = grandTotal - supplyTotal;
  const dateStr = new Date(order.createdAt).toLocaleDateString('ko-KR');

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
        }
        @page { size: A4; margin: 15mm; }
      `}</style>

      <div className="no-print flex items-center gap-2 border-b bg-gray-50 px-4 py-3">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          인쇄하기 (PDF 저장)
        </button>
        <button
          onClick={() => window.close()}
          className="ml-auto rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          닫기
        </button>
      </div>

      <div className="mx-auto max-w-[210mm] bg-white p-10 print:p-0">
        {/* 제목 */}
        <div className="mb-10 text-center">
          <h1 className="inline-block border-b-2 border-gray-800 pb-2 text-3xl font-bold tracking-[0.3em]">
            거 래 명 세 서
          </h1>
        </div>

        {/* 주문 정보 */}
        <div className="mb-6 flex items-start justify-between text-sm">
          <div className="space-y-1 text-gray-600">
            <div>
              <span className="inline-block w-24 text-gray-400">주문번호</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div>
              <span className="inline-block w-24 text-gray-400">거래일자</span>
              <span>{dateStr}</span>
            </div>
            <div>
              <span className="inline-block w-24 text-gray-400">결제방법</span>
              <span>{paymentMethodLabel[order.paymentMethod] ?? order.paymentMethod}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">거래 합계금액 (VAT 포함)</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{formatPrice(grandTotal)}</p>
          </div>
        </div>

        {/* 공급자 / 공급받는자 */}
        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded border border-gray-300 p-4">
            <p className="mb-2 border-b pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">공급자</p>
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <span className="w-16 flex-shrink-0 text-gray-400">상호</span>
                <span className="font-semibold">{config.companyName || 'Labwise'}</span>
              </div>
              {config.businessNumber && (
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">사업자번호</span>
                  <span>{config.businessNumber}</span>
                </div>
              )}
              {config.ceoName && (
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">대표자</span>
                  <span>{config.ceoName}</span>
                </div>
              )}
              {config.address && (
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">주소</span>
                  <span>{config.address}</span>
                </div>
              )}
              {config.phone && (
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">연락처</span>
                  <span>{config.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div className="rounded border border-gray-300 p-4">
            <p className="mb-2 border-b pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">공급받는자</p>
            {addr && (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">담당자</span>
                  <span className="font-semibold">{addr.recipientName}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">연락처</span>
                  <span>{addr.phone}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">주소</span>
                  <span>[{addr.zipCode}] {addr.address}{addr.addressDetail ? ` ${addr.addressDetail}` : ''}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 품목표 */}
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
            {order.items?.map((item) => {
              const total = item.unitPrice * item.quantity;
              const supply = Math.round(total / 1.1);
              const vat = total - supply;
              return (
                <tr key={item.id} className="even:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2">{item.productName}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(item.unitPrice)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(supply)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(vat)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium">{formatPrice(total)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td className="border border-gray-300 px-3 py-2" colSpan={3}>
                합 계
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(supplyTotal)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(vatTotal)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right text-blue-700">{formatPrice(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        {/* 포인트 사용 안내 */}
        {order.pointUsed > 0 && (
          <div className="mb-4 text-xs text-gray-400">
            * 와이즈(포인트) {order.pointUsed.toLocaleString()}P 사용으로 인해 실 결제금액이 상이할 수 있습니다.
          </div>
        )}

        {/* 비고 */}
        <div className="space-y-1 text-xs text-gray-400">
          <p>• 부가가치세(10%)가 포함된 금액입니다.</p>
          <p>• 본 거래명세서는 세금계산서를 대체하지 않습니다.</p>
        </div>

        <div className="mt-10 text-right text-sm text-gray-500">
          <p>{dateStr}</p>
          <p className="mt-1 text-base font-bold text-gray-800">{config.companyName || 'Labwise'} (인)</p>
        </div>
      </div>
    </>
  );
}
