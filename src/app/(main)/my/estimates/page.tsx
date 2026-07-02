'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, ExternalLink, Copy, Plus, CreditCard, Building2, User } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Suspense } from 'react';
import { useInstitutionStore } from '@/store/institution.store';

interface EstimateItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Estimate {
  id: string;
  estimateNumber: string;
  buyerCompany: string;
  buyerContact?: string;
  buyerPhone?: string;
  items: EstimateItem[];
  totalAmount: number;
  status: 'issued' | 'paid';
  institutionId?: string;
  createdAt: string;
}

function summary(items: EstimateItem[]) {
  if (!items?.length) return '품목 없음';
  const first = items[0].productName;
  return items.length === 1 ? first : `${first} 외 ${items.length - 1}개 품목`;
}

const STATUS = {
  issued: { label: '미결제', color: 'bg-amber-100 text-amber-700' },
  paid:   { label: '결제완료', color: 'bg-green-100 text-green-700' },
};

function EstimateList({ estimates, onClone }: { estimates: Estimate[]; onClone: (id: string) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlight && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlight, estimates]);

  if (estimates.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p className="text-gray-500">발행된 견적서가 없습니다.</p>
        <button
          onClick={() => router.push('/estimates/new')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> 견적서 만들기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {estimates.map((est) => {
        const isHighlight = est.id === highlight;
        const st = STATUS[est.status] ?? STATUS.issued;
        return (
          <div
            key={est.id}
            ref={isHighlight ? highlightRef : undefined}
            className={`rounded-xl border bg-white p-5 transition-all ${
              isHighlight ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{est.estimateNumber}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(est.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-gray-600">{summary(est.items)}</p>
                <p className="text-xs text-gray-400">{est.buyerCompany}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-blue-600">{formatPrice(est.totalAmount)}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-50 pt-3">
              <button
                onClick={() => window.open(`/print/estimate/${est.id}`, '_blank')}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <ExternalLink className="h-3.5 w-3.5" /> 견적서 보기
              </button>
              <button
                onClick={() => onClone(est.id)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <Copy className="h-3.5 w-3.5" /> 복제해서 새 견적서
              </button>
              {est.status === 'issued' && (
                <button
                  onClick={() => router.push(`/checkout?estimateId=${est.id}`)}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <CreditCard className="h-3.5 w-3.5" /> 결제하기
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MyEstimatesInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mode, institution } = useInstitutionStore();

  const { data: estimates = [], isLoading } = useQuery<Estimate[]>({
    queryKey: ['my-estimates', mode],
    queryFn: async () => {
      const { data } = await api.get('/estimates/my');
      return data;
    },
  });

  async function handleClone(id: string) {
    try {
      const { data } = await api.post(`/estimates/${id}/clone`);
      await queryClient.invalidateQueries({ queryKey: ['my-estimates'] });
      router.push(`/my/estimates?highlight=${data.id}`);
    } catch {
      alert('복제에 실패했습니다.');
    }
  }

  const isInstitution = mode === 'institution';

  return (
    <div className="space-y-4">
      {/* 현재 모드 표시 */}
      <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
        isInstitution
          ? 'bg-indigo-50 text-indigo-700'
          : 'bg-blue-50 text-blue-700'
      }`}>
        {isInstitution ? (
          <>
            <Building2 className="h-4 w-4" />
            기관 견적서 목록 — {institution?.name ?? '기관'}
          </>
        ) : (
          <>
            <User className="h-4 w-4" />
            개인 견적서 목록
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500">총 {estimates.length}개</h2>
        <button
          onClick={() => router.push('/estimates/new')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white ${
            isInstitution ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Plus className="h-4 w-4" /> 새 견적서 만들기
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : (
        <EstimateList estimates={estimates} onClone={handleClone} />
      )}
    </div>
  );
}

export default function MyEstimatesPage() {
  return (
    <Suspense>
      <MyEstimatesInner />
    </Suspense>
  );
}
