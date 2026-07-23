'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { Plus, ChevronDown, ChevronRight, CheckCircle2, Package } from 'lucide-react';

interface SourcingProduct {
  id: string;
  name: string;
  sourcingCode?: string;
}

interface OpeningItem {
  id: string;
  productId: string;
  product?: { id: string; name: string };
  unitCostKrw: number;
  quantityAvailable: number;
  quantityReserved: number;
  quantityShipped: number;
  isUnknownCost: boolean;
  createdAt: string;
}

interface CostItem {
  type: string;
  label: string;
  currency: string;
  amount: number;
  exchangeRate?: number;
  amountKrw: number;
  includeInCost: boolean;
}

interface SourcingBatch {
  id: string;
  sourcingProductId: string;
  sourcingProduct?: SourcingProduct;
  batchSeq: number;
  status: string;
  importVatStatus?: string;
  currency: string;
  unitPriceForeign: number;
  exchangeRate: number;
  quantityOrdered: number;
  quantityReceived?: number;
  quantitySaleable?: number;
  costs?: CostItem[];
  totalGoodsCostKrw?: number;
  totalIncludedCostsKrw?: number;
  totalLandedCostKrw?: number;
  unitLandedCostKrw?: number;
  importDeclarationNumber?: string;
  orderedAt?: string;
  confirmedAt?: string;
  notes?: string;
  receiptItem?: { id: string; quantityAvailable: number; isUnknownCost?: boolean; isOpening?: boolean } | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성중', ORDERED: '주문완료', IN_TRANSIT: '운송중',
  CUSTOMS: '통관중', RECEIVED: '입고대기', CONFIRMED: '확정', CANCELLED: '취소',
};

const VAT_STATUS_LABEL: Record<string, string> = {
  UNCONFIRMED: '미확인',
  DEDUCTIBLE: '공제 가능',
  NON_DEDUCTIBLE: '공제 불가',
};
const VAT_STATUS_COLOR: Record<string, string> = {
  UNCONFIRMED: 'bg-yellow-100 text-yellow-700',
  DEDUCTIBLE: 'bg-green-100 text-green-700',
  NON_DEDUCTIBLE: 'bg-red-100 text-red-600',
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500',
  ORDERED: 'bg-blue-100 text-blue-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  CUSTOMS: 'bg-orange-100 text-orange-700',
  RECEIVED: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-400',
};

const COST_TYPE_LABEL: Record<string, string> = {
  OVERSEAS_INLAND: '해외 내륙 운송', INTL_FREIGHT: '국제 운송비', INSURANCE: '보험료',
  CUSTOMS_DUTY: '관세', IMPORT_VAT: '수입 부가세', CUSTOMS_BROKER: '통관 대행료',
  REMITTANCE: '송금 수수료', DOMESTIC_SHIPPING: '국내 배송비', INSPECTION: '검사비', OTHER: '기타',
};

function won(n?: number) {
  if (n == null) return '-';
  return Math.round(n).toLocaleString('ko-KR') + '원';
}

const EMPTY_FORM = {
  sourcingProductId: '',
  currency: 'CNY',
  unitPriceForeign: '',
  exchangeRate: '',
  quantityOrdered: '',
  quantitySaleable: '',
  notes: '',
};

export default function SourcingBatchesPage() {
  const [batches, setBatches] = useState<SourcingBatch[]>([]);
  const [products, setProducts] = useState<SourcingProduct[]>([]);
  const [openingItems, setOpeningItems] = useState<OpeningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProductId, setFilterProductId] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmQty, setConfirmQty] = useState('');
  const [error, setError] = useState('');
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [correctCost, setCorrectCost] = useState('');
  const [correctNote, setCorrectNote] = useState('');
  const [correctSaving, setCorrectSaving] = useState(false);
  const [correctError, setCorrectError] = useState('');

  async function loadBatches(spId?: string) {
    setLoading(true);
    try {
      const url = `/sourcing-batches${spId ? `?sourcingProductId=${spId}` : ''}`;
      const { data } = await adminApi.get(url);
      setBatches(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadOpeningItems() {
    try {
      const { data } = await adminApi.get('/inventory/opening-items');
      setOpeningItems(data);
    } catch {
      // 조회 실패 시 무시 (배치 목록에는 영향 없음)
    }
  }

  useEffect(() => {
    adminApi.get('/sourcing-products').then(({ data }) => setProducts(data));
    loadBatches();
    loadOpeningItems();
  }, []);

  function handleFilterChange(id: string) {
    setFilterProductId(id);
    loadBatches(id || undefined);
  }

  async function handleSave() {
    if (!form.sourcingProductId) { setError('소싱 상품을 선택하세요.'); return; }
    if (!form.unitPriceForeign || !form.quantityOrdered) { setError('단가와 수량은 필수입니다.'); return; }
    setSaving(true); setError('');
    try {
      await adminApi.post('/sourcing-batches', {
        sourcingProductId: form.sourcingProductId,
        currency: form.currency,
        unitPriceForeign: Number(form.unitPriceForeign),
        exchangeRate: form.currency === 'KRW' ? undefined : Number(form.exchangeRate),
        quantityOrdered: Number(form.quantityOrdered),
        quantitySaleable: form.quantitySaleable ? Number(form.quantitySaleable) : undefined,
        notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      loadBatches(filterProductId || undefined);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '저장 오류');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    try {
      await adminApi.put(`/sourcing-batches/${id}`, { status });
      loadBatches(filterProductId || undefined);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '상태 변경 오류');
    }
  }

  async function handleVatStatusUpdate(id: string, importVatStatus: string) {
    try {
      await adminApi.put(`/sourcing-batches/${id}`, { importVatStatus });
      loadBatches(filterProductId || undefined);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '수입 부가세 상태 변경 오류');
    }
  }

  async function handleCorrectCost() {
    if (!correctId || !correctCost || !correctNote.trim()) return;
    setCorrectSaving(true); setCorrectError('');
    try {
      await adminApi.patch(`/inventory/receipt-items/${correctId}/correct-cost`, {
        unitCostKrw: Number(correctCost),
        note: correctNote.trim(),
      });
      setCorrectId(null); setCorrectCost(''); setCorrectNote('');
      loadBatches(filterProductId || undefined);
      loadOpeningItems();
    } catch (e: any) {
      setCorrectError(e?.response?.data?.message ?? '원가 보정 오류');
    } finally {
      setCorrectSaving(false);
    }
  }

  async function handleConfirm() {
    if (!confirmId || !confirmQty) return;
    try {
      await adminApi.post(`/sourcing-batches/${confirmId}/confirm`, { quantityReceived: Number(confirmQty) });
      setConfirmId(null);
      setConfirmQty('');
      loadBatches(filterProductId || undefined);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '입고 확정 오류');
    }
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">소싱 배치</h1>
          <p className="text-sm text-gray-500 mt-1">소싱 이벤트별 구매 내역과 착지원가를 관리합니다.</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); }} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={15} /> 신규 배치
        </button>
      </div>

      {/* OPENING 원가 미확정 항목 */}
      {openingItems.filter((o) => o.isUnknownCost).length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-orange-800">OPENING 원가 미확정 항목</span>
            <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">
              {openingItems.filter((o) => o.isUnknownCost).length}건
            </span>
          </div>
          <p className="text-xs text-orange-700">기존 재고 전환 시 원가를 알 수 없었던 항목입니다. 실제 원가를 확인하고 보정하세요.</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-orange-600 border-b border-orange-200">
                <th className="pb-1 font-medium">상품명</th>
                <th className="pb-1 font-medium text-right">가용재고</th>
                <th className="pb-1 font-medium text-right">예약중</th>
                <th className="pb-1 font-medium text-right">출고완료</th>
                <th className="pb-1 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {openingItems.filter((o) => o.isUnknownCost).map((o) => (
                <tr key={o.id} className="border-b border-orange-100">
                  <td className="py-2 text-gray-800">{o.product?.name ?? o.productId}</td>
                  <td className="py-2 text-right text-gray-600">{o.quantityAvailable}개</td>
                  <td className="py-2 text-right text-gray-600">{o.quantityReserved}개</td>
                  <td className="py-2 text-right text-gray-600">{o.quantityShipped}개</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => {
                        setCorrectId(o.id);
                        setCorrectCost('');
                        setCorrectNote('');
                        setCorrectError('');
                      }}
                      className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                    >
                      원가 보정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 필터 */}
      <div className="flex items-center gap-3">
        <select value={filterProductId} onChange={(e) => handleFilterChange(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64">
          <option value="">전체 소싱 상품</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* 신규 배치 폼 */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">신규 배치 생성</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">소싱 상품 *</label>
              <select className={inputClass} value={form.sourcingProductId} onChange={(e) => setForm((f) => ({ ...f, sourcingProductId: e.target.value }))}>
                <option value="">선택하세요</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">통화</label>
              <select className={inputClass} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                {['CNY', 'USD', 'JPY', 'EUR', 'KRW'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">환율 (1{form.currency} = ?원)</label>
              <input className={inputClass} type="number" min="0" disabled={form.currency === 'KRW'} value={form.currency === 'KRW' ? '1' : form.exchangeRate} onChange={(e) => setForm((f) => ({ ...f, exchangeRate: e.target.value }))} placeholder="예: 185.5" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">단가 ({form.currency}, 개당) *</label>
              <input className={inputClass} type="number" min="0" value={form.unitPriceForeign} onChange={(e) => setForm((f) => ({ ...f, unitPriceForeign: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">주문 수량 *</label>
              <input className={inputClass} type="number" min="1" value={form.quantityOrdered} onChange={(e) => setForm((f) => ({ ...f, quantityOrdered: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">변동 사유</label>
              <input className={inputClass} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="가격 변동 원인, 공급사 변경 등 — 가격 이력에 표시됩니다" />
            </div>
          </div>
          <p className="text-xs text-gray-400">비용 항목(운송비·관세 등)은 배치 생성 후 수정 화면에서 추가할 수 있습니다.</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600">취소</button>
            <button onClick={handleSave} disabled={saving} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '배치 생성'}
            </button>
          </div>
        </div>
      )}

      {/* 입고 확정 모달 */}
      {confirmId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-yellow-800">입고 수량 입력 → 배치 확정</h2>
          <p className="text-sm text-yellow-700">실제 입고된 수량을 입력하세요. 확정 후에는 배치를 수정·삭제할 수 없습니다.</p>
          <div className="flex items-center gap-3">
            <input type="number" min="1" className={inputClass + ' w-40'} value={confirmQty} onChange={(e) => setConfirmQty(e.target.value)} placeholder="입고 수량" />
            <button onClick={handleConfirm} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">확정</button>
            <button onClick={() => { setConfirmId(null); setConfirmQty(''); }} className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600">취소</button>
          </div>
        </div>
      )}

      {/* 원가 보정 모달 */}
      {correctId && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-orange-800">OPENING 원가 보정</h2>
          <p className="text-sm text-orange-700">
            원가 미확정 배치의 실제 원가를 최초 확정합니다. 확정 후에는 이 기능으로 재수정할 수 없습니다.
          </p>
          {correctError && <p className="text-sm text-red-600">{correctError}</p>}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-orange-700 w-24 shrink-0">실제 원가 (원)</label>
              <input
                type="number"
                min="0"
                className={inputClass + ' w-48'}
                value={correctCost}
                onChange={(e) => setCorrectCost(e.target.value)}
                placeholder="예: 15000"
              />
            </div>
            <div className="flex items-start gap-2">
              <label className="text-sm text-orange-700 w-24 shrink-0 mt-2">보정 사유 *</label>
              <textarea
                className={inputClass + ' min-h-[60px]'}
                value={correctNote}
                onChange={(e) => setCorrectNote(e.target.value)}
                placeholder="원가 확정 근거 (공급사 세금계산서 수취, 정산 완료 등)"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setCorrectId(null); setCorrectCost(''); setCorrectNote(''); setCorrectError(''); }}
              className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600"
            >취소</button>
            <button
              onClick={handleCorrectCost}
              disabled={correctSaving || !correctCost || !correctNote.trim()}
              className="text-sm px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {correctSaving ? '처리 중...' : '원가 확정'}
            </button>
          </div>
        </div>
      )}

      {/* 배치 목록 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 p-6">로딩 중...</p>
        ) : batches.length === 0 ? (
          <p className="text-sm text-gray-400 p-6">배치가 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-6" />
                <th className="px-4 py-3 text-left font-medium text-gray-500">배치</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">소싱 상품</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">단가</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">수량</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">착지원가/개</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">상태</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">재고</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">동작</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <>
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button onClick={() => setExpanded(expanded === b.id ? null : b.id)} className="text-gray-400 hover:text-gray-700">
                        {expanded === b.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-500">#{b.batchSeq}</span>
                      {b.orderedAt && <div className="text-xs text-gray-400">{new Date(b.orderedAt).toLocaleDateString('ko-KR')}</div>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{b.sourcingProduct?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {b.unitPriceForeign.toLocaleString()} {b.currency}
                      <div className="text-xs text-gray-400">× {b.exchangeRate}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {b.quantityOrdered.toLocaleString()}개
                      {b.quantitySaleable != null && b.quantitySaleable !== b.quantityOrdered && (
                        <div className="text-xs text-gray-400">판매 {b.quantitySaleable}개</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{won(b.unitLandedCostKrw)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status] ?? 'bg-gray-100'}`}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.receiptItem ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs"><Package size={12} />가용 {b.receiptItem.quantityAvailable}개</span>
                      ) : b.status === 'CONFIRMED' ? (
                        <span className="text-gray-400 text-xs">입고항목 없음</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {b.status !== 'CONFIRMED' && b.status !== 'CANCELLED' && (
                          <>
                            {b.status === 'RECEIVED' && (
                              <button onClick={() => { setConfirmId(b.id); setConfirmQty(String(b.quantityOrdered)); }} className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                                <CheckCircle2 size={12} /> 입고확정
                              </button>
                            )}
                            <select
                              className="text-xs border border-gray-200 rounded px-1 py-1"
                              value={b.status}
                              onChange={(e) => handleStatusUpdate(b.id, e.target.value)}
                            >
                              {['DRAFT', 'ORDERED', 'IN_TRANSIT', 'CUSTOMS', 'RECEIVED'].map((s) => (
                                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === b.id && (
                    <tr key={b.id + '-detail'} className="bg-gray-50 border-b border-gray-200">
                      <td colSpan={9} className="px-8 py-4">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-2">비용 내역</p>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span className="text-gray-500">총 상품 원가</span><span>{won(b.totalGoodsCostKrw)}</span></div>
                              {(b.costs ?? []).map((c, i) => (
                                <div key={i} className="flex justify-between">
                                  <span className={`text-gray-500 flex items-center gap-1 ${!c.includeInCost ? 'opacity-50' : ''}`}>
                                    {!c.includeInCost && <span className="text-xs text-gray-300">[제외]</span>}
                                    {COST_TYPE_LABEL[c.type] ?? c.type} ({c.label})
                                  </span>
                                  <span className={!c.includeInCost ? 'text-gray-400 line-through' : ''}>{won(c.amountKrw)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between font-semibold border-t border-gray-200 pt-1 mt-1">
                                <span>총 착지원가</span><span>{won(b.totalLandedCostKrw)}</span>
                              </div>
                              {b.quantitySaleable && (
                                <div className="flex justify-between text-blue-700 font-semibold">
                                  <span>개당 원가 (판매 {b.quantitySaleable}개 기준)</span><span>{won(b.unitLandedCostKrw)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-2">배치 정보</p>
                            <div className="space-y-2 text-gray-600">
                              {b.importDeclarationNumber && <div>수입신고번호: {b.importDeclarationNumber}</div>}
                              {b.notes && <div>변동 사유: {b.notes}</div>}
                              {b.confirmedAt && <div>확정일: {new Date(b.confirmedAt).toLocaleString('ko-KR')}</div>}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">수입 부가세:</span>
                                {b.status === 'CONFIRMED' || b.status === 'CANCELLED' ? (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${VAT_STATUS_COLOR[b.importVatStatus ?? 'UNCONFIRMED'] ?? 'bg-gray-100'}`}>
                                    {VAT_STATUS_LABEL[b.importVatStatus ?? 'UNCONFIRMED']}
                                  </span>
                                ) : (
                                  <select
                                    className="text-xs border border-gray-200 rounded px-2 py-1"
                                    value={b.importVatStatus ?? 'UNCONFIRMED'}
                                    onChange={(e) => handleVatStatusUpdate(b.id, e.target.value)}
                                  >
                                    <option value="UNCONFIRMED">미확인</option>
                                    <option value="DEDUCTIBLE">공제 가능</option>
                                    <option value="NON_DEDUCTIBLE">공제 불가</option>
                                  </select>
                                )}
                                {(b.importVatStatus === 'UNCONFIRMED' || !b.importVatStatus) && b.status === 'RECEIVED' && (
                                  <span className="text-xs text-yellow-600">※ 입고 확정 전에 설정 필요</span>
                                )}
                              </div>
                              {b.receiptItem?.isUnknownCost === true && b.receiptItem?.isOpening === true && (
                                <div className="mt-3 pt-3 border-t border-orange-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-orange-600 font-medium">원가 미확정 (OPENING 배치)</span>
                                    <button
                                      onClick={() => {
                                        setCorrectId(b.receiptItem!.id);
                                        setCorrectCost('');
                                        setCorrectNote('');
                                        setCorrectError('');
                                      }}
                                      className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                                    >
                                      원가 보정
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
