'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Search, FileText } from 'lucide-react';
import adminApi from '@/lib/admin-api';
import { formatPrice } from '@/lib/utils';

interface Estimate {
  id: string;
  estimateNumber: string;
  buyerCompany: string;
  buyerContact?: string;
  buyerPhone?: string;
  totalAmount: number;
  createdAt: string;
  user?: { name: string; email: string };
  items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[];
}

export default function AdminEstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    adminApi
      .get(`/estimates/admin/all?page=${page}&limit=${LIMIT}`)
      .then(({ data }) => {
        setEstimates(data.items);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = search
    ? estimates.filter(
        (e) =>
          e.estimateNumber.includes(search) ||
          e.buyerCompany.toLowerCase().includes(search.toLowerCase()) ||
          (e.buyerContact ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (e.user?.name ?? '').includes(search),
      )
    : estimates;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">견적서 내역</h1>
          <p className="mt-0.5 text-sm text-gray-500">총 {total}건</p>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="견적번호, 상호명, 담당자, 회원명 검색"
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">견적서가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">견적번호</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">공급받는자</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">발행 회원</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">금액</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">발행일</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">보기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((est) => (
                <>
                  <tr
                    key={est.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpanded(expanded === est.id ? null : est.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">
                      {est.estimateNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{est.buyerCompany}</p>
                      {est.buyerContact && (
                        <p className="text-xs text-gray-400">
                          {est.buyerContact}
                          {est.buyerPhone && ` · ${est.buyerPhone}`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {est.user ? (
                        <>
                          <p className="text-gray-700">{est.user.name}</p>
                          <p className="text-xs text-gray-400">{est.user.email}</p>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatPrice(est.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {new Date(est.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/print/estimate/${est.id}`, '_blank');
                        }}
                        className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        출력
                      </button>
                    </td>
                  </tr>
                  {expanded === est.id && (
                    <tr key={`${est.id}-detail`} className="bg-blue-50">
                      <td colSpan={6} className="px-6 py-3">
                        <p className="mb-2 text-xs font-semibold text-blue-700">품목 내역</p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500">
                              <th className="pb-1 text-left font-medium">품목</th>
                              <th className="pb-1 text-center font-medium">수량</th>
                              <th className="pb-1 text-right font-medium">단가</th>
                              <th className="pb-1 text-right font-medium">합계</th>
                            </tr>
                          </thead>
                          <tbody>
                            {est.items.map((item, i) => (
                              <tr key={i}>
                                <td className="py-0.5">{item.productName}</td>
                                <td className="py-0.5 text-center">{item.quantity}</td>
                                <td className="py-0.5 text-right">{formatPrice(item.unitPrice)}</td>
                                <td className="py-0.5 text-right font-medium">{formatPrice(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded text-sm ${
                p === page ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
