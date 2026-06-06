'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface SiteConfig {
  companyName?: string;
  businessNumber?: string;
  ceoName?: string;
  address?: string;
  phone?: string;
}

interface Estimate {
  id: string;
  estimateNumber: string;
  buyerCompany: string;
  buyerContact?: string;
  buyerPhone?: string;
  items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[];
  totalAmount: number;
  createdAt: string;
}

export default function EstimatePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [config, setConfig] = useState<SiteConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/estimates/${id}`).then(({ data }) => setEstimate(data)),
      api.get('/site-settings').then(({ data }) => setConfig(data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }
  if (!estimate) {
    return <div className="flex min-h-screen items-center justify-center text-red-500">견적서를 찾을 수 없습니다.</div>;
  }

  const grandTotal = estimate.totalAmount;
  const supplyTotal = Math.round(grandTotal / 1.1);
  const vatTotal = grandTotal - supplyTotal;
  const issueDate = new Date(estimate.createdAt).toLocaleDateString('ko-KR');
  const validUntil = new Date(new Date(estimate.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR');

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
          onClick={() => window.history.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          돌아가기
        </button>
        <button
          onClick={() => window.close()}
          className="ml-auto rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          닫기
        </button>
      </div>

      <div className="mx-auto max-w-[210mm] bg-white p-10 print:p-0">
        <div className="mb-10 text-center">
          <h1 className="inline-block border-b-2 border-gray-800 pb-2 text-3xl font-bold tracking-[0.3em]">
            견 적 서
          </h1>
        </div>

        <div className="mb-6 flex items-start justify-between text-sm">
          <div className="space-y-1 text-gray-600">
            <div>
              <span className="inline-block w-20 text-gray-400">견적번호</span>
              <span className="font-medium">{estimate.estimateNumber}</span>
            </div>
            <div>
              <span className="inline-block w-20 text-gray-400">견적일자</span>
              <span>{issueDate}</span>
            </div>
            <div>
              <span className="inline-block w-20 text-gray-400">유효기간</span>
              <span>{validUntil}까지 (30일)</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">견적 합계금액 (VAT 포함)</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{formatPrice(grandTotal)}</p>
          </div>
        </div>

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
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <span className="w-16 flex-shrink-0 text-gray-400">상호명</span>
                <span className="font-semibold">{estimate.buyerCompany}</span>
              </div>
              {estimate.buyerContact && (
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">담당자</span>
                  <span>{estimate.buyerContact}</span>
                </div>
              )}
              {estimate.buyerPhone && (
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">연락처</span>
                  <span>{estimate.buyerPhone}</span>
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
            {estimate.items.map((item, i) => {
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
              <td className="border border-gray-300 px-3 py-2" colSpan={3}>합 계</td>
              <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(supplyTotal)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(vatTotal)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right text-blue-700">{formatPrice(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="space-y-1 text-xs text-gray-400">
          <p>• 본 견적서는 발행일로부터 30일간 유효합니다.</p>
          <p>• 부가가치세(10%)가 포함된 금액입니다.</p>
          <p>• 본 견적은 재고 상황에 따라 변동될 수 있습니다.</p>
        </div>

        <div className="mt-10 text-right text-sm text-gray-500">
          <p>{issueDate}</p>
          <p className="mt-1 text-base font-bold text-gray-800">{config.companyName || 'Labwise'} (인)</p>
        </div>
      </div>
    </>
  );
}
