'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatPrice } from '@/lib/utils';

interface SiteConfig {
  companyName?: string;
  businessNumber?: string;
  ceoName?: string;
  address?: string;
  phone?: string;
}

export default function EstimatePage() {
  const { items, fetchCart } = useCartStore();
  const [config, setConfig] = useState<SiteConfig>({});
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [ready, setReady] = useState(false);

  const [estimateNo] = useState(() => {
    const d = new Date();
    const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 900 + 100);
    return `EST-${ymd}-${rand}`;
  });

  const today = new Date().toLocaleDateString('ko-KR');
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR');

  useEffect(() => {
    fetchCart();
    api.get('/site-settings').then(({ data }) => setConfig(data)).catch(() => {});
  }, []);

  const grandTotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const supplyTotal = Math.round(grandTotal / 1.1);
  const vatTotal = grandTotal - supplyTotal;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-1 text-lg font-bold text-gray-900">견적서 발행</h2>
          <p className="mb-6 text-sm text-gray-500">
            공급받는자 정보를 입력하세요
            {items.length > 0 && ` (${items.length}개 품목)`}
          </p>
          {items.length === 0 ? (
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
              장바구니가 비어있습니다. 상품을 담은 후 다시 시도해주세요.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  상호 / 담당자 <span className="text-red-500">*</span>
                </label>
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="예: (주)연구소 / 김연구"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">연락처</label>
                <input
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  if (!buyerName.trim()) return alert('상호/담당자를 입력해주세요.');
                  setReady(true);
                }}
                className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                견적서 보기
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          onClick={() => setReady(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          정보 수정
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
            견 적 서
          </h1>
        </div>

        {/* 견적 정보 */}
        <div className="mb-6 flex items-start justify-between text-sm">
          <div className="space-y-1 text-gray-600">
            <div>
              <span className="inline-block w-20 text-gray-400">견적번호</span>
              <span className="font-medium">{estimateNo}</span>
            </div>
            <div>
              <span className="inline-block w-20 text-gray-400">견적일자</span>
              <span>{today}</span>
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
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <span className="w-16 flex-shrink-0 text-gray-400">상호/담당자</span>
                <span className="font-semibold">{buyerName}</span>
              </div>
              {buyerContact && (
                <div className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-gray-400">연락처</span>
                  <span>{buyerContact}</span>
                </div>
              )}
            </div>
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
            {items.map((item) => {
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

        {/* 비고 */}
        <div className="space-y-1 text-xs text-gray-400">
          <p>• 본 견적서는 발행일로부터 30일간 유효합니다.</p>
          <p>• 부가가치세(10%)가 포함된 금액입니다.</p>
          <p>• 본 견적은 재고 상황에 따라 변동될 수 있습니다.</p>
        </div>

        <div className="mt-10 text-right text-sm text-gray-500">
          <p>{today}</p>
          <p className="mt-1 text-base font-bold text-gray-800">{config.companyName || 'Labwise'} (인)</p>
        </div>
      </div>
    </>
  );
}
