'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, TrendingUp, TrendingDown, Minus, Trash2, Plus } from 'lucide-react';
import adminApi from '@/lib/admin-api';

interface PriceHistoryRow {
  batchId: string;
  batchSeq: number;
  confirmedAt: string | null;
  orderedAt: string | null;
  currency: string;
  unitPriceForeign: number;
  exchangeRate: number | null;
  unitLandedCostKrw: number;
  quantityReceived: number | null;
  quantityAvailable: number | null;
  delta: number | null;
  deltaRate: number | null;
  changeReason: string | null;
}

interface SourcingProduct {
  id: string;
  name: string;
  sourcingCode?: string;
  supplierName?: string;
}

interface SourcingBatchOption {
  id: string;
  batchSeq: number;
  status: string;
}

interface SourcingDocument {
  id: string;
  batchId: string;
  docType: string;
  originalName: string;
  localRelativePath: string;
  notes: string | null;
  createdAt: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  QUOTATION:         '견적서 (PI)',
  ORDER_PAYMENT:     '주문·결제',
  SHIPPING:          '운송 서류',
  CUSTOMS:           '통관 서류',
  INSPECTION:        '검수 기록',
  COST_CONFIRMATION: '원가 확인서',
  OTHER:             '기타',
};

const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABELS);

function formatKrw(v: number) {
  return v.toLocaleString('ko-KR') + '원';
}

function formatForeign(v: number, currency: string) {
  if (currency === 'JPY') return `¥${v.toFixed(0)}`;
  if (currency === 'USD') return `$${v.toFixed(2)}`;
  if (currency === 'CNY') return `¥${v.toFixed(2)} (CNY)`;
  if (currency === 'EUR') return `€${v.toFixed(2)}`;
  return `${v.toLocaleString('ko-KR')}원`;
}

function formatDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function SourcingProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<SourcingProduct | null>(null);
  const [history, setHistory] = useState<PriceHistoryRow[]>([]);
  const [batches, setBatches] = useState<SourcingBatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [documents, setDocuments] = useState<SourcingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Add document form state
  const [addForm, setAddForm] = useState({
    docType: 'QUOTATION',
    originalName: '',
    localRelativePath: '',
    notes: '',
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prodRes, histRes, batchRes] = await Promise.all([
          adminApi.get(`/sourcing-products/${id}`),
          adminApi.get(`/sourcing-products/${id}/price-history`),
          adminApi.get(`/sourcing-batches?sourcingProductId=${id}`),
        ]);
        setProduct(prodRes.data);
        setHistory(histRes.data);
        const batchList: SourcingBatchOption[] = batchRes.data;
        setBatches(batchList);
        if (batchList.length > 0) {
          setSelectedBatchId(batchList[0].id);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!selectedBatchId) {
      setDocuments([]);
      return;
    }
    async function loadDocs() {
      setDocLoading(true);
      setDocError(null);
      try {
        const res = await adminApi.get(`/sourcing-batches/${selectedBatchId}/documents`);
        setDocuments(res.data);
      } catch {
        setDocError('문서 목록을 불러오지 못했습니다.');
      } finally {
        setDocLoading(false);
      }
    }
    loadDocs();
  }, [selectedBatchId]);

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBatchId) return;
    setAdding(true);
    setDocError(null);
    try {
      await adminApi.post(`/sourcing-batches/${selectedBatchId}/documents`, {
        docType: addForm.docType,
        originalName: addForm.originalName.trim(),
        localRelativePath: addForm.localRelativePath.trim(),
        notes: addForm.notes.trim() || undefined,
      });
      setAddForm({ docType: 'QUOTATION', originalName: '', localRelativePath: '', notes: '' });
      const res = await adminApi.get(`/sourcing-batches/${selectedBatchId}/documents`);
      setDocuments(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setDocError(Array.isArray(msg) ? msg.join(', ') : (msg ?? '문서 추가 중 오류가 발생했습니다.'));
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteDocument(docId: string) {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return;
    setDocError(null);
    try {
      await adminApi.delete(`/sourcing-documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      setDocError('문서 삭제 중 오류가 발생했습니다.');
    }
  }

  if (loading) return <p className="text-sm text-gray-400 p-6">로딩 중...</p>;
  if (!product) return <p className="text-sm text-gray-400 p-6">소싱 상품을 찾을 수 없습니다.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/sourcing/products"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
        >
          <ChevronLeft className="h-4 w-4" /> 소싱 상품 목록
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {[product.sourcingCode, product.supplierName].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* 가격 이력 표 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">배치별 착지원가 이력</h2>
          <p className="text-xs text-gray-400 mt-0.5">CONFIRMED 상태인 배치만 표시됩니다.</p>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-400 p-6">확정된 소싱 배치가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">입고확정일</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">발주일</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">외화 단가</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">적용 환율</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 whitespace-nowrap">착지원가 (개당)</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 whitespace-nowrap">입고수량</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 whitespace-nowrap">잔여 재고</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 whitespace-nowrap">직전 대비</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">변동 사유</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => {
                  const hasChange = row.delta !== null;
                  const up = hasChange && row.delta! > 0;
                  const down = hasChange && row.delta! < 0;
                  return (
                    <tr key={row.batchId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{row.batchSeq}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(row.confirmedAt)}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(row.orderedAt)}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-mono">
                        {formatForeign(row.unitPriceForeign, row.currency)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono">
                        {row.exchangeRate != null ? `${row.exchangeRate.toLocaleString('ko-KR')}원` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatKrw(row.unitLandedCostKrw)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                        {row.quantityReceived != null ? row.quantityReceived.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                        {row.quantityAvailable != null ? row.quantityAvailable.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {!hasChange ? (
                          <span className="text-gray-300 text-xs">-</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              up ? 'text-red-600' : down ? 'text-green-600' : 'text-gray-500'
                            }`}
                          >
                            {up ? <TrendingUp size={12} /> : down ? <TrendingDown size={12} /> : <Minus size={12} />}
                            {row.delta! > 0 ? '+' : ''}
                            {formatKrw(Math.round(row.delta!))}
                            {row.deltaRate != null && (
                              <span className="opacity-70">
                                ({row.delta! > 0 ? '+' : ''}{row.deltaRate.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">
                        {row.changeReason ?? ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 문서 관리 섹션 (AC-02) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">소싱 서류 관리</h2>
          <p className="text-xs text-gray-400 mt-0.5">배치별 견적서·통관 서류 등을 관리합니다.</p>
        </div>

        <div className="p-5 space-y-4">
          {/* 배치 선택 */}
          {batches.length === 0 ? (
            <p className="text-sm text-gray-400">소싱 배치가 없습니다.</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">배치 선택</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.batchSeq} — {b.status}
                    </option>
                  ))}
                </select>
              </div>

              {docError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{docError}</p>
              )}

              {/* 문서 목록 */}
              {docLoading ? (
                <p className="text-sm text-gray-400">문서 로딩 중...</p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-gray-400">이 배치에 등록된 서류가 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 whitespace-nowrap">종류</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">파일명</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">상대 경로</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">메모</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 whitespace-nowrap">등록일</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 whitespace-nowrap text-xs font-medium">
                            {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                          </td>
                          <td className="px-4 py-2 text-gray-600 text-xs max-w-[180px] truncate">{doc.originalName}</td>
                          <td className="px-4 py-2 text-gray-400 text-xs font-mono max-w-[240px] truncate">{doc.localRelativePath}</td>
                          <td className="px-4 py-2 text-gray-400 text-xs max-w-[160px] truncate">{doc.notes ?? ''}</td>
                          <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">{formatDate(doc.createdAt)}</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 문서 추가 폼 */}
              <form onSubmit={handleAddDocument} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600">서류 추가</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">종류</label>
                    <select
                      value={addForm.docType}
                      onChange={(e) => setAddForm((f) => ({ ...f, docType: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {DOC_TYPE_OPTIONS.map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">원본 파일명 (최대 255자)</label>
                    <input
                      type="text"
                      value={addForm.originalName}
                      onChange={(e) => setAddForm((f) => ({ ...f, originalName: e.target.value }))}
                      placeholder="20260722_PI_CUVETTE45.pdf"
                      maxLength={255}
                      required
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">상대 경로 (supplier-sourcing/ 기준, 최대 500자)</label>
                    <input
                      type="text"
                      value={addForm.localRelativePath}
                      onChange={(e) => setAddForm((f) => ({ ...f, localRelativePath: e.target.value }))}
                      placeholder="items/CUVETTE45/batches/20260722-001/01-quotation/20260722_PI.pdf"
                      maxLength={500}
                      required
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">메모 (선택)</label>
                    <input
                      type="text"
                      value={addForm.notes}
                      onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="선택 입력"
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={adding}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    {adding ? '추가 중...' : '서류 추가'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
