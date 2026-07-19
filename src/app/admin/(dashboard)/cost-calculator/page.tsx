'use client';

import { useMemo, useState } from 'react';
import { Calculator, RefreshCw } from 'lucide-react';

type Currency = 'CNY' | 'USD' | 'JPY' | 'KRW';

const CURRENCY_LABEL: Record<Currency, string> = {
  CNY: '중국 위안 (CNY)',
  USD: '미국 달러 (USD)',
  JPY: '일본 엔 (JPY, 100엔 기준)',
  KRW: '원화 (KRW, 환율 미적용)',
};

function won(n: number) {
  return Math.round(n).toLocaleString('ko-KR') + '원';
}

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function CostCalculatorPage() {
  const [currency, setCurrency] = useState<Currency>('CNY');
  const [sourcingAmount, setSourcingAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [customsRate, setCustomsRate] = useState('8');
  const [intlLogistics, setIntlLogistics] = useState('');
  const [domesticShipping, setDomesticShipping] = useState('3000');
  const [pgFeeRate, setPgFeeRate] = useState('2.5');
  const [wisePointRate, setWisePointRate] = useState('12');
  const [fundDonationRate, setFundDonationRate] = useState('3');
  const [targetMargin, setTargetMargin] = useState('20');
  const [checkPrice, setCheckPrice] = useState('');

  const effectiveRate = currency === 'KRW' ? 1 : num(exchangeRate);

  const calc = useMemo(() => {
    const sourcingKRW = num(sourcingAmount) * effectiveRate;
    const customsKRW = sourcingKRW * (num(customsRate) / 100);
    const fixedCost = sourcingKRW + customsKRW + num(intlLogistics) + num(domesticShipping);

    const revenueRate = num(pgFeeRate) + num(wisePointRate) + num(fundDonationRate);
    const marginRate = num(targetMargin);
    const denom = 1 - (revenueRate + marginRate) / 100;

    const suggestedPriceRaw = denom > 0 ? fixedCost / denom : null;
    const suggestedPrice = suggestedPriceRaw !== null ? Math.ceil(suggestedPriceRaw / 10) * 10 : null;

    return { sourcingKRW, customsKRW, fixedCost, revenueRate, denomInvalid: denom <= 0, suggestedPrice };
  }, [sourcingAmount, effectiveRate, customsRate, intlLogistics, domesticShipping, pgFeeRate, wisePointRate, fundDonationRate, targetMargin]);

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

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Calculator size={22} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">원가 계산기</h1>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        해외 소싱 상품의 관부가세·물류비·환율과 와이즈포인트·감사펀드+기부·PG수수료를 반영해 권장 판매가를 계산합니다.
        저장되지 않는 계산기이며, 계산 결과는 참고용입니다.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 입력 영역 */}
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">1. 소싱 원가</h2>
            <div className="space-y-3">
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
                  <label className="mb-1 block text-xs text-gray-500">소싱 금액 ({currency})</label>
                  <input value={sourcingAmount} onChange={(e) => setSourcingAmount(e.target.value)}
                    type="number" min="0" placeholder="0" className={inputClass()} />
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
              </div>
              <p className="text-xs text-gray-400">환율은 실시간 조회 없이 직접 입력합니다. 결제/송금 시점 고시 환율을 확인해 입력하세요.</p>
              <div>
                <label className="mb-1 block text-xs text-gray-500">관부가세율 (%, 소싱원가 환산액 기준)</label>
                <input value={customsRate} onChange={(e) => setCustomsRate(e.target.value)}
                  type="number" min="0" step="0.1" className={inputClass()} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">국제 물류비 (원)</label>
                  <input value={intlLogistics} onChange={(e) => setIntlLogistics(e.target.value)}
                    type="number" min="0" placeholder="0" className={inputClass()} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">국내 배송비 (원)</label>
                  <input value={domesticShipping} onChange={(e) => setDomesticShipping(e.target.value)}
                    type="number" min="0" className={inputClass()} />
                </div>
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
              <div className="flex justify-between"><span>소싱 원가 (환산)</span><span>{won(calc.sourcingKRW)}</span></div>
              <div className="flex justify-between"><span>관부가세</span><span>{won(calc.customsKRW)}</span></div>
              <div className="flex justify-between"><span>국제 물류비</span><span>{won(num(intlLogistics))}</span></div>
              <div className="flex justify-between"><span>국내 배송비</span><span>{won(num(domesticShipping))}</span></div>
              <div className="flex justify-between font-semibold"><span>총 고정비용</span><span>{won(calc.fixedCost)}</span></div>
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
                <div className="flex justify-between"><span>판매가</span><span>{won(check.price)}</span></div>
                <div className="flex justify-between"><span>총 고정비용</span><span>-{won(calc.fixedCost)}</span></div>
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
    </div>
  );
}
