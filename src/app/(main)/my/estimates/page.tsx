'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface Estimate {
  id: string;
  estimateNumber: string;
  buyerCompany: string;
  buyerContact?: string;
  buyerPhone?: string;
  totalAmount: number;
  createdAt: string;
}

export default function MyEstimatesPage() {
  const { data: estimates = [], isLoading } = useQuery<Estimate[]>({
    queryKey: ['my-estimates'],
    queryFn: async () => {
      const { data } = await api.get('/estimates/my');
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (estimates.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p className="text-gray-500">발행된 견적서가 없습니다.</p>
        <p className="mt-1 text-sm text-gray-400">장바구니에서 견적서를 발행할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {estimates.map((est) => (
        <div key={est.id} className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{est.estimateNumber}</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                  {new Date(est.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="mt-1 space-y-0.5 text-sm text-gray-500">
                <p>
                  <span className="text-gray-400">상호명</span>{' '}
                  <span className="font-medium text-gray-700">{est.buyerCompany}</span>
                </p>
                {est.buyerContact && (
                  <p>
                    <span className="text-gray-400">담당자</span>{' '}
                    <span>{est.buyerContact}</span>
                    {est.buyerPhone && <span className="ml-2 text-gray-400">{est.buyerPhone}</span>}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-600">{formatPrice(est.totalAmount)}</p>
              <button
                onClick={() => window.open(`/print/estimate/${est.id}`, '_blank')}
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                견적서 보기
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
