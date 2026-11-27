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

// 견적서 양식 색상 (랩와이즈 견적서 템플릿과 동일)
const BLUE = '#2F8FD6';
const LIGHT = '#EAF4FB';
const LINE = '#9DB8CC';

// 빈 줄까지 포함한 품목표 최소 행 수
const MIN_ITEM_ROWS = 6;

const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

// 금액을 한글 표기로 바꾼다. 예: 137500 → 일십삼만칠천오백
function toKoreanAmount(amount: number): string {
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const units = ['', '십', '백', '천'];
  const groups = ['', '만', '억', '조'];
  let n = Math.floor(Math.abs(amount));
  if (n === 0) return '영';
  let out = '';
  let g = 0;
  while (n > 0) {
    const part = n % 10000;
    if (part) {
      let s = '';
      String(part)
        .padStart(4, '0')
        .split('')
        .forEach((c, i) => {
          if (c !== '0') s += digits[Number(c)] + units[3 - i];
        });
      out = s + groups[g] + out;
    }
    n = Math.floor(n / 10000);
    g++;
  }
  return out;
}

const thLabel = 'border px-2 py-1 text-center text-[12px] font-bold whitespace-nowrap';
const tdValue = 'border px-2.5 py-1 text-[12px]';
const tdAmount = 'border px-1.5 py-1 text-right text-[12px] whitespace-nowrap tabular-nums';

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
  const companyName = config.companyName || 'Labwise';
  const blankRows = Math.max(0, MIN_ITEM_ROWS - estimate.items.length);

  const border = { borderColor: LINE };
  const label = { borderColor: LINE, backgroundColor: LIGHT };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
        }
        @page { size: A4; margin: 12mm; }
        .estimate-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .estimate-sheet tr { break-inside: avoid; }
        .estimate-sheet thead { display: table-header-group; }
        .estimate-sheet .estimate-totals { break-inside: avoid; }
        .estimate-sheet .estimate-notes { break-inside: avoid; }
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

      <div className="overflow-x-auto print:overflow-visible">
      <div className="estimate-sheet mx-auto min-w-[700px] max-w-[210mm] bg-white p-10 text-gray-900 print:min-w-0 print:p-0">
        {/* 머리글: 글씨 포함 로고 */}
        {/* eslint-disable-next-line @next/next/no-img-element -- 인쇄 전용 정적 로고 */}
        <img src="/brand/labwise-logo.png" alt={companyName} className="h-11 w-auto" />

        {/* 제목 */}
        <div className="my-4 border-y-2 py-1.5 text-center" style={{ borderColor: BLUE }}>
          <h1 className="text-[28px] font-bold tracking-[0.6em] pl-[0.6em]">견적서</h1>
        </div>

        {/* 수신 / 공급자 */}
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[11%]" />
            <col className="w-[36%]" />
            <col className="w-[5%]" />
            <col className="w-[11%]" />
            <col className="w-[37%]" />
          </colgroup>
          <tbody>
            <tr>
              <th className={thLabel} style={label}>수 신</th>
              <td className={tdValue} style={border}>
                <span className="font-semibold">{estimate.buyerCompany}</span>
                <span className="ml-2">귀하</span>
              </td>
              <td
                rowSpan={6}
                className="border text-center text-[13px] font-bold leading-7 text-white"
                style={{ borderColor: LINE, backgroundColor: BLUE }}
              >
                공<br />급<br />자
              </td>
              <th className={thLabel} style={label}>등록번호</th>
              <td className={tdValue} style={border}>{config.businessNumber}</td>
            </tr>
            <tr>
              <th className={thLabel} style={label}>담 당 자</th>
              <td className={tdValue} style={border}>{estimate.buyerContact}</td>
              <th className={thLabel} style={label}>상 호</th>
              <td className={tdValue} style={border}>{companyName}</td>
            </tr>
            <tr>
              <th className={thLabel} style={label}>연 락 처</th>
              <td className={tdValue} style={border}>{estimate.buyerPhone}</td>
              <th className={thLabel} style={label}>대 표 자</th>
              <td className={tdValue} style={border}>
                {config.ceoName}
                <span className="ml-3 text-gray-500">(인)</span>
              </td>
            </tr>
            <tr>
              <th className={thLabel} style={label}>견적번호</th>
              <td className={tdValue} style={border}>{estimate.estimateNumber}</td>
              <th rowSpan={2} className={thLabel} style={label}>주 소</th>
              <td rowSpan={2} className={tdValue} style={border}>{config.address}</td>
            </tr>
            <tr>
              <th className={thLabel} style={label}>견적일자</th>
              <td className={tdValue} style={border}>{issueDate}</td>
            </tr>
            <tr>
              <th className={thLabel} style={label}>유효기간</th>
              <td className={tdValue} style={border}>{validUntil}까지 (30일)</td>
              <th className={thLabel} style={label}>전 화</th>
              <td className={tdValue} style={border}>{config.phone}</td>
            </tr>
          </tbody>
        </table>

        <p className="mb-2 mt-3 text-[13px]">아래와 같이 견적합니다.</p>

        {/* 합계 강조줄 */}
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[25%]" />
            <col className="w-[75%]" />
          </colgroup>
          <tbody>
            <tr>
              <th
                className="border py-2 text-center text-[14px] font-bold tracking-[0.3em] text-white"
                style={{ borderColor: LINE, backgroundColor: BLUE }}
              >
                합계금액
              </th>
              <td className="border py-2 text-center text-[14px] font-bold" style={label}>
                일금 {toKoreanAmount(grandTotal)}원정 (₩{fmt(grandTotal)}) · 부가세 포함
              </td>
            </tr>
          </tbody>
        </table>

        {/* 품목표 */}
        <table className="mt-3 w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[5%]" />
            <col className="w-[28%]" />
            <col className="w-[7%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr>
              {['No', '품 명', '수량', '단 가', '공급가액', '세액(10%)', '합 계'].map((h) => (
                <th key={h} className={thLabel} style={label}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estimate.items.map((item, i) => {
              const supply = Math.round(item.subtotal / 1.1);
              const vat = item.subtotal - supply;
              return (
                <tr key={i}>
                  <td className={`${tdValue} text-center`} style={border}>{i + 1}</td>
                  <td className={tdValue} style={border}>{item.productName}</td>
                  <td className={`${tdValue} text-center`} style={border}>{item.quantity}</td>
                  <td className={tdAmount} style={border}>{formatPrice(item.unitPrice)}</td>
                  <td className={tdAmount} style={border}>{formatPrice(supply)}</td>
                  <td className={tdAmount} style={border}>{formatPrice(vat)}</td>
                  <td className={`${tdAmount} font-medium`} style={border}>{formatPrice(item.subtotal)}</td>
                </tr>
              );
            })}
            {Array.from({ length: blankRows }).map((_, i) => (
              <tr key={`blank-${i}`} aria-hidden="true">
                {Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="border py-1 text-[12px]" style={border}>&nbsp;</td>
                ))}
              </tr>
            ))}
          </tbody>
          {/* 전체 합계는 tfoot이 아닌 일반 행 묶음: 인쇄 시 쪽마다 반복되지 않고 마지막 품목 뒤에 한 번만 나온다 */}
          <tbody className="estimate-totals">
            {[
              { k: '소 계 (공급가액)', v: supplyTotal },
              { k: '부가세 (10%)', v: vatTotal },
              { k: '합 계', v: grandTotal, strong: true },
            ].map((row) => (
              <tr key={row.k}>
                <th colSpan={5} className={thLabel} style={label}>{row.k}</th>
                <td
                  colSpan={2}
                  className={`${tdAmount} ${row.strong ? 'font-bold' : ''}`}
                  style={{ borderColor: LINE, color: row.strong ? BLUE : undefined }}
                >
                  {formatPrice(row.v)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 안내 사항 + 발행일·상호: 쪽 경계에서 나뉘지 않도록 한 묶음 */}
        <div className="estimate-notes">
        <p className="mb-1.5 mt-4 text-[13px] font-bold" style={{ color: BLUE }}>안내 사항</p>
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[17%]" />
            <col className="w-[83%]" />
          </colgroup>
          <tbody>
            <tr>
              <th className={thLabel} style={label}>유효기간</th>
              <td className={tdValue} style={border}>본 견적서는 발행일로부터 30일간 유효합니다.</td>
            </tr>
            <tr>
              <th className={thLabel} style={label}>금 액</th>
              <td className={tdValue} style={border}>부가가치세(10%)가 포함된 금액입니다.</td>
            </tr>
            <tr>
              <th className={thLabel} style={label}>재 고</th>
              <td className={tdValue} style={border}>본 견적은 재고 상황에 따라 변동될 수 있습니다.</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-5 text-right text-[13px] text-gray-600">
          <p>{issueDate}</p>
          <p className="mt-1 text-[15px] font-bold text-gray-900">{companyName} (인)</p>
        </div>
        </div>
      </div>
      </div>
    </>
  );
}
