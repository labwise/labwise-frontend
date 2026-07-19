'use client';

import { useEffect, useMemo, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { Calculator, RefreshCw, Search, X, Save, Pencil, Trash2, Link2, Plus } from 'lucide-react';

type Currency = 'CNY' | 'USD' | 'JPY' | 'KRW';

const CURRENCY_LABEL: Record<Currency, string> = {
  CNY: '중국 위안 (CNY)',
  USD: '미국 달러 (USD)',
  JPY: '일본 엔 (JPY, 100엔 기준)',
  KRW: '원화 (KRW, 환율 미적용)',
};

interface ProductSearchResult { id: string; name: string; sku?: string; }
interface OtherCostRow { label: string; currency: Currency; amount: string; exchangeRate: string; }
interface OtherCostSaved { label: string; currency: string; amount: number; exchangeRate: number; }
interface SourcingItem {
  id: string;
  name: string;
  currency: string;
  sourcingAmount: number;
  exchangeRate: number;
  customsRate: number;
  intlLogistics: number;
  domesticShipping: number;
  quantity: number;
  otherCosts?: OtherCostSaved[];
  pgFeeRate: number;
  wisePointRate: number;
  fundDonationRate: number;
  targetMargin: number;
  unitCostKrw: number;
  suggestedPrice?: number;
  memo?: string;
  productId?: string;
  product?: { id: string; name: string } | null;
  updatedAt: string;
}

function won(n: number) {
  return Math.round(n).toLocaleString('ko-KR') + '원';
}

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const DEFAULTS = {
  name: '',
  currency: 'CNY' as Currency,
  sourcingAmount: '',
  exchangeRate: '',
  customsRate: '8',
  intlLogistics: '',
  domesticShipping: '3000',
  quantity: '1',
  pgFeeRate: '2.5',
  wisePointRate: '12',
  fundDonationRate: '3',
  targetMargin: '20',
  memo: '',
};

export default function CostCalculatorPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState(DEFAULTS.name);
  const [currency, setCurrency] = useState<Currency>(DEFAULTS.currency);
  const [sourcingAmount, setSourcingAmount] = useState(DEFAULTS.sourcingAmount);
  const [exchangeRate, setExchangeRate] = useState(DEFAULTS.exchangeRate);
  const [customsRate, setCustomsRate] = useState(DEFAULTS.customsRate);
  const [intlLogistics, setIntlLogistics] = useState(DEFAULTS.intlLogistics);
  const [domesticShipping, setDomesticShipping] = useState(DEFAULTS.domesticShipping);
  const [quantity, setQuantity] = useState(DEFAULTS.quantity);
  const [otherCosts, setOtherCosts] = useState<OtherCostRow[]>([]);
  const [pgFeeRate, setPgFeeRate] = useState(DEFAULTS.pgFeeRate);
  const [wisePointRate, setWisePointRate] = useState(DEFAULTS.wisePointRate);
  const [fundDonationRate, setFundDonationRate] = useState(DEFAULTS.fundDonationRate);
  const [targetMargin, setTargetMargin] = useState(DEFAULTS.targetMargin);
  const [memo, setMemo] = useState(DEFAULTS.memo);
  const [checkPrice, setCheckPrice] = useState('');

  const [linkedProduct, setLinkedProduct] = useState<ProductSearchResult | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);

  const [items, setItems] = useState<SourcingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/sourcing-items');
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleProductSearch() {
    if (!productSearch.trim()) return;
    const { data } = await adminApi.get('/admin/products', { params: { search: productSearch, limit: 10 } });
    setProductResults(data.items ?? data);
  }

  const effectiveRate = currency === 'KRW' ? 1 : num(exchangeRate);

  const calc = useMemo(() => {
    const qty = Math.max(1, num(quantity));
    // 소싱 금액은 개당 단가로 입력받는다 — 총 소싱금액은 단가 × 수량으로 계산.
    const unitPriceKRW = num(sourcingAmount) * effectiveRate;
    const totalSourcingKRW = unitPriceKRW * qty;
    // 국제 물류비도 소싱과 같은 통화로 청구되는 경우가 많아 동일 환율을 적용해 환산한다.
    const intlLogisticsKRW = num(intlLogistics) * effectiveRate;
    // 관부가세는 상품가만이 아니라 국제운임을 포함한 CIF 총액 기준으로 부과된다.
    const cifBase = totalSourcingKRW + intlLogisticsKRW;
    const customsKRW = cifBase * (num(customsRate) / 100);
    // 기타 비용(수수료 등)은 항목마다 통화가 다를 수 있어 항목별 환율로 각각 환산한다.
    const otherCostsKRW = otherCosts.reduce((sum, oc) => {
      const rate = oc.currency === 'KRW' ? 1 : num(oc.exchangeRate);
      return sum + num(oc.amount) * rate;
    }, 0);
    // 물류비·관부가세·국내배송비·기타비용은 수량과 무관한 배치(batch) 단위 비용이므로 수량으로 나눠 개당 비용을 구한다.
    const batchExtras = intlLogisticsKRW + customsKRW + num(domesticShipping) + otherCostsKRW;
    const batchCost = totalSourcingKRW + batchExtras;
    const fixedCost = unitPriceKRW + batchExtras / qty;

    const revenueRate = num(pgFeeRate) + num(wisePointRate) + num(fundDonationRate);
    const marginRate = num(targetMargin);
    const denom = 1 - (revenueRate + marginRate) / 100;

    const suggestedPriceRaw = denom > 0 ? fixedCost / denom : null;
    const suggestedPrice = suggestedPriceRaw !== null ? Math.ceil(suggestedPriceRaw / 10) * 10 : null;

    return { unitPriceKRW, totalSourcingKRW, intlLogisticsKRW, cifBase, customsKRW, otherCostsKRW, batchExtras, batchCost, qty, fixedCost, revenueRate, denomInvalid: denom <= 0, suggestedPrice };
  }, [sourcingAmount, effectiveRate, customsRate, intlLogistics, domesticShipping, quantity, otherCosts, pgFeeRate, wisePointRate, fundDonationRate, targetMargin]);

  const check = useMemo(() => {
    const price = num(checkPrice);
    if (price <= 0) return null;
    const pgFeeKRW = price * (num(pgFeeRate) / 100);
    const wisePointKRW = price * (num(wisePointRate) / 100);
    const fundKRW = price * (num(fundDonationRate) / 100);
    const profit = price - calc.fixedCost - pgFeeKRW - wisePointKRW - fundKRW;
    const marginPercent = (profit / price) * 100;
    return { price, pgFeeKRW, wisePointKRW, fundKRW, profit, marginPercent };
  }, [checkPrice, calc.fixedCost, pgFeeRate, wisePointRate, fundDonationRate]);

  function inputClass() {
    return 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';
  }

  function addOtherCost() {
    setOtherCosts((prev) => [...prev, { label: '', currency: 'KRW', amount: '', exchangeRate: '' }]);
  }

  function updateOtherCost(index: number, patch: Partial<OtherCostRow>) {
    setOtherCosts((prev) => prev.map((oc, i) => (i === index ? { ...oc, ...patch } : oc)));
  }

  function removeOtherCost(index: number) {
    setOtherCosts((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setEditingId(null);
    setName(DEFAULTS.name);
    setCurrency(DEFAULTS.currency);
    setSourcingAmount(DEFAULTS.sourcingAmount);
    setExchangeRate(DEFAULTS.exchangeRate);
    setCustomsRate(DEFAULTS.customsRate);
    setIntlLogistics(DEFAULTS.intlLogistics);
    setDomesticShipping(DEFAULTS.domesticShipping);
    setQuantity(DEFAULTS.quantity);
    setOtherCosts([]);
    setPgFeeRate(DEFAULTS.pgFeeRate);
    setWisePointRate(DEFAULTS.wisePointRate);
    setFundDonationRate(DEFAULTS.fundDonationRate);
    setTargetMargin(DEFAULTS.targetMargin);
    setMemo(DEFAULTS.memo);
    setCheckPrice('');
    setLinkedProduct(null);
    setProductSearch('');
    setProductResults([]);
  }

  function loadIntoForm(item: SourcingItem) {
    setEditingId(item.id);
    setName(item.name);
    setCurrency(item.currency as Currency);
    setSourcingAmount(String(item.sourcingAmount));
    setExchangeRate(String(item.exchangeRate));
    setCustomsRate(String(item.customsRate));
    setIntlLogistics(String(item.intlLogistics));
    setDomesticShipping(String(item.domesticShipping));
    setQuantity(String(item.quantity ?? 1));
    setOtherCosts((item.otherCosts ?? []).map((oc) => ({
      label: oc.label,
      currency: oc.currency as Currency,
      amount: String(oc.amount),
      exchangeRate: String(oc.exchangeRate),
    })));
    setPgFeeRate(String(item.pgFeeRate));
    setWisePointRate(String(item.wisePointRate));
    setFundDonationRate(String(item.fundDonationRate));
    setTargetMargin(String(item.targetMargin));
    setMemo(item.memo ?? '');
    setLinkedProduct(item.product ? { id: item.product.id, name: item.product.name } : null);
    setCheckPrice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave() {
    if (!name.trim()) { setError('아이템 이름을 입력해주세요.'); return; }
    setError('');
    setSaving(true);
    try {
      const dto = {
        name: name.trim(),
        currency,
        sourcingAmount: num(sourcingAmount),
        exchangeRate: effectiveRate,
        customsRate: num(customsRate),
        intlLogistics: num(intlLogistics),
        domesticShipping: num(domesticShipping),
        quantity: calc.qty,
        otherCosts: otherCosts
          .filter((oc) => oc.label.trim() && num(oc.amount) > 0)
          .map((oc) => ({
            label: oc.label.trim(),
            currency: oc.currency,
            amount: num(oc.amount),
            exchangeRate: oc.currency === 'KRW' ? 1 : num(oc.exchangeRate),
          })),
        pgFeeRate: num(pgFeeRate),
        wisePointRate: num(wisePointRate),
        fundDonationRate: num(fundDonationRate),
        targetMargin: num(targetMargin),
        unitCostKrw: Math.round(calc.fixedCost),
        suggestedPrice: calc.suggestedPrice ?? undefined,
        memo: memo.trim() || undefined,
        productId: linkedProduct?.id,
      };
      if (editingId) {
        await adminApi.put(`/admin/sourcing-items/${editingId}`, dto);
      } else {
        await adminApi.post('/admin/sourcing-items', dto);
      }
      await loadItems();
      resetForm();
    } catch {
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 소싱 아이템을 삭제하시겠습니까? (연동된 상품의 원가는 유지됩니다)')) return;
    await adminApi.delete(`/admin/sourcing-items/${id}`);
    if (editingId === id) resetForm();
    await loadItems();
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Calculator size={22} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">원가 계산기</h1>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        해외 소싱 상품의 관부가세·물류비·환율과 와이즈포인트·감사펀드+기부·PG수수료를 반영해 권장 판매가를 계산합니다.
        상품과 연동하면 계산된 원가가 상품의 공급가(costPrice)에 반영되어 대시보드 순수익 계산에 사용됩니다.
      </p>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 입력 영역 */}
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">1. 소싱 아이템</h2>
              {editingId && (
                <button type="button" onClick={resetForm} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                  <Plus size={12} /> 새 아이템
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">아이템 이름</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="예: OO 시약 500ml" className={inputClass()} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">통화</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={inputClass()}>
                  {(Object.keys(CURRENCY_LABEL) as Currency[]).map((c) => (
                    <option key={c} value={c}>{CURRENCY_LABEL[c]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">소싱 단가 ({currency}, 개당)</label>
                  <input value={sourcingAmount} onChange={(e) => setSourcingAmount(e.target.value)}
                    type="number" min="0" placeholder="0" className={inputClass()} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">소싱 수량 (개)</label>
                  <input value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    type="number" min="1" step="1" className={inputClass()} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  환율 (1{currency} = ?원)
                </label>
                <input value={currency === 'KRW' ? '1' : exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  disabled={currency === 'KRW'}
                  type="number" min="0" placeholder="예: 190" className={inputClass() + (currency === 'KRW' ? ' bg-gray-50 text-gray-400' : '')} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">국제 물류비 ({currency}, 이번 소싱 전체 배송비 합계)</label>
                <input value={intlLogistics} onChange={(e) => setIntlLogistics(e.target.value)}
                  type="number" min="0" placeholder="0" className={inputClass()} />
              </div>
              <p className="text-xs text-gray-400">환율은 실시간 조회 없이 직접 입력합니다. 소싱 단가·국제 물류비 모두 결제/송금 시점 고시 환율을 확인해 입력하세요.</p>
              <div>
                <label className="mb-1 block text-xs text-gray-500">관부가세율 (%, CIF 기준: 총 소싱금액+국제물류비 환산액)</label>
                <input value={customsRate} onChange={(e) => setCustomsRate(e.target.value)}
                  type="number" min="0" step="0.1" className={inputClass()} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">국내 배송비 (원)</label>
                <input value={domesticShipping} onChange={(e) => setDomesticShipping(e.target.value)}
                  type="number" min="0" className={inputClass()} />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs text-gray-500">기타 비용 (수수료 등, 선택)</label>
                  <button type="button" onClick={addOtherCost} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                    <Plus size={12} /> 항목 추가
                  </button>
                </div>
                {otherCosts.length > 0 && (
                  <div className="space-y-2">
                    {otherCosts.map((oc, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input
                          value={oc.label}
                          onChange={(e) => updateOtherCost(i, { label: e.target.value })}
                          placeholder="예: 포워딩 수수료"
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                        />
                        <select
                          value={oc.currency}
                          onChange={(e) => updateOtherCost(i, { currency: e.target.value as Currency })}
                          className="w-20 rounded-lg border border-gray-300 px-1.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          {(Object.keys(CURRENCY_LABEL) as Currency[]).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <input
                          value={oc.amount}
                          onChange={(e) => updateOtherCost(i, { amount: e.target.value })}
                          type="number" min="0" placeholder="금액"
                          className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          value={oc.currency === 'KRW' ? '1' : oc.exchangeRate}
                          onChange={(e) => updateOtherCost(i, { exchangeRate: e.target.value })}
                          disabled={oc.currency === 'KRW'}
                          type="number" min="0" placeholder="환율"
                          className={'w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none' + (oc.currency === 'KRW' ? ' bg-gray-50 text-gray-400' : '')}
                        />
                        <button type="button" onClick={() => removeOtherCost(i)} className="shrink-0 text-gray-300 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-400">항목별로 통화가 다르면 해당 통화 환율을 각각 입력하세요. 원화(KRW)는 환율 입력이 필요 없습니다.</p>
              </div>

              <p className="text-xs text-gray-400">개당 원가 = 소싱 단가 + (국제물류비+관부가세+국내배송비+기타비용) ÷ 소싱 수량</p>
              <div>
                <label className="mb-1 block text-xs text-gray-500">메모 (선택)</label>
                <input value={memo} onChange={(e) => setMemo(e.target.value)}
                  placeholder="소싱처, 특이사항 등" className={inputClass()} />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">2. 판매가 연동 비용 · 목표 마진</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">PG 수수료 (%)</label>
                  <input value={pgFeeRate} onChange={(e) => setPgFeeRate(e.target.value)}
                    type="number" min="0" step="0.1" className={inputClass()} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">와이즈 포인트 (%)</label>
                  <input value={wisePointRate} onChange={(e) => setWisePointRate(e.target.value)}
                    type="number" min="0" step="0.1" className={inputClass()} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">감사펀드+기부 (%)</label>
                  <input value={fundDonationRate} onChange={(e) => setFundDonationRate(e.target.value)}
                    type="number" min="0" step="0.1" className={inputClass()} />
                </div>
              </div>
              <p className="text-xs text-gray-400">토스페이먼츠 계약 요율에 맞게 PG 수수료를 조정하세요. 와이즈 포인트·감사펀드+기부는 현재 정책 기준값(12% / 3%)이 기본값입니다.</p>
              <div>
                <label className="mb-1 block text-xs text-gray-500">목표 마진율 (%, 판매가 대비 순이익)</label>
                <input value={targetMargin} onChange={(e) => setTargetMargin(e.target.value)}
                  type="number" step="0.1" className={inputClass()} />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">3. 상품 연동 (선택)</h2>
            <p className="mb-3 text-xs text-gray-400">연동하면 저장 시 해당 상품의 공급가(원가)가 이 계산 결과로 갱신됩니다.</p>
            {linkedProduct ? (
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                <span className="flex items-center gap-1.5"><Link2 size={14} /> {linkedProduct.name}</span>
                <button type="button" onClick={() => setLinkedProduct(null)}><X size={14} /></button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleProductSearch(); }}
                    placeholder="상품명 검색"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button type="button" onClick={handleProductSearch}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <Search size={14} /> 검색
                  </button>
                </div>
                {productResults.length > 0 && (
                  <div className="max-h-32 divide-y divide-gray-50 overflow-y-auto rounded-lg border border-gray-200">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setLinkedProduct(p); setProductResults([]); setProductSearch(''); }}
                        className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        <span>{p.name}</span>
                        <span className="text-xs text-gray-400">{p.sku}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} /> {editingId ? '아이템 수정 저장' : '아이템 저장'}
          </button>
        </div>

        {/* 결과 영역 */}
        <div className="space-y-6">
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h2 className="mb-4 text-sm font-semibold text-blue-900">권장 판매가</h2>
            {calc.denomInvalid ? (
              <p className="text-sm text-red-600">
                PG 수수료 + 와이즈 포인트 + 감사펀드/기부 + 목표 마진율의 합이 100% 이상입니다. 값을 낮춰주세요.
              </p>
            ) : (
              <>
                <p className="text-3xl font-bold text-blue-700">
                  {calc.suggestedPrice !== null ? won(calc.suggestedPrice) : '-'}
                </p>
                <p className="mt-1 text-xs text-blue-600">10원 단위 올림 처리된 금액입니다.</p>
                <button
                  type="button"
                  onClick={() => setCheckPrice(String(calc.suggestedPrice ?? ''))}
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  <RefreshCw size={12} /> 아래 검증란에 적용
                </button>
              </>
            )}
            <div className="mt-4 space-y-1 border-t border-blue-200 pt-3 text-xs text-blue-800">
              <div className="flex justify-between"><span>소싱 단가 (환산)</span><span>{won(calc.unitPriceKRW)}</span></div>
              <div className="flex justify-between"><span>총 소싱금액 ({calc.qty}개)</span><span>{won(calc.totalSourcingKRW)}</span></div>
              <div className="flex justify-between"><span>국제 물류비 (환산)</span><span>{won(calc.intlLogisticsKRW)}</span></div>
              <div className="flex justify-between"><span>관부가세 (CIF {won(calc.cifBase)} 기준)</span><span>{won(calc.customsKRW)}</span></div>
              <div className="flex justify-between"><span>국내 배송비</span><span>{won(num(domesticShipping))}</span></div>
              {calc.otherCostsKRW > 0 && (
                <div className="flex justify-between"><span>기타 비용 (환산 합계)</span><span>{won(calc.otherCostsKRW)}</span></div>
              )}
              <div className="flex justify-between font-semibold"><span>총 원가 ({calc.qty}개)</span><span>{won(calc.batchCost)}</span></div>
              <div className="flex justify-between border-t border-blue-200 pt-1 font-semibold"><span>개당 원가</span><span>{won(calc.fixedCost)}</span></div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">판매가로 마진 검증</h2>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">검증할 판매가 (원)</label>
              <input value={checkPrice} onChange={(e) => setCheckPrice(e.target.value)}
                type="number" min="0" placeholder="판매가를 입력하세요" className={inputClass()} />
            </div>
            {check ? (
              <div className="space-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <div className="flex justify-between"><span>판매가 (개당)</span><span>{won(check.price)}</span></div>
                <div className="flex justify-between"><span>개당 원가</span><span>-{won(calc.fixedCost)}</span></div>
                <div className="flex justify-between"><span>PG 수수료</span><span>-{won(check.pgFeeKRW)}</span></div>
                <div className="flex justify-between"><span>와이즈 포인트 적립</span><span>-{won(check.wisePointKRW)}</span></div>
                <div className="flex justify-between"><span>감사펀드+기부 적립</span><span>-{won(check.fundKRW)}</span></div>
                <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
                  <span>예상 순이익</span>
                  <span className={check.profit >= 0 ? 'text-blue-700' : 'text-red-600'}>{won(check.profit)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>실질 마진율</span>
                  <span className={check.marginPercent >= 0 ? 'text-blue-700' : 'text-red-600'}>{check.marginPercent.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">판매가를 입력하면 예상 순이익과 실질 마진율을 확인할 수 있습니다.</p>
            )}
          </section>
        </div>
      </div>

      {/* 저장된 소싱 아이템 목록 */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">저장된 소싱 아이템</h2>
        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400">저장된 소싱 아이템이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="pb-2 font-medium">이름</th>
                  <th className="pb-2 font-medium">연동 상품</th>
                  <th className="pb-2 font-medium">수량</th>
                  <th className="pb-2 font-medium">개당 원가</th>
                  <th className="pb-2 font-medium">권장 판매가</th>
                  <th className="pb-2 font-medium">수정일</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5">{item.name}</td>
                    <td className="py-2.5">
                      {item.product
                        ? <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"><Link2 size={11} /> {item.product.name}</span>
                        : <span className="text-xs text-gray-300">미연동</span>}
                    </td>
                    <td className="py-2.5">{item.quantity ?? 1}개</td>
                    <td className="py-2.5">{won(item.unitCostKrw)}</td>
                    <td className="py-2.5">{item.suggestedPrice ? won(item.suggestedPrice) : '-'}</td>
                    <td className="py-2.5 text-xs text-gray-400">{new Date(item.updatedAt).toLocaleDateString('ko-KR')}</td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => loadIntoForm(item)} className="text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                        <button type="button" onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
