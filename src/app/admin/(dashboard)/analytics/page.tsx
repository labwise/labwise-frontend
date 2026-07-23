'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import adminApi from '@/lib/admin-api';
import { TrendingUp, TrendingDown, Coins, Users } from 'lucide-react';

interface Analytics {
  totalRevenue: number;
  confirmedRevenue: number;
  totalCost: number;
  netProfit: number;
  marginRate: number;
  totalPointsIssued: number;
  totalPointsUsed: number;
  unpaidOrderCount: number;
  unpaidOrderAmount: number;
  uncostedOrderCount: number;
  pendingConfirmedRevenue: number;
  pendingConfirmedOrderCount: number;
  monthlyRevenue: { month: string; revenue: number; cost: number; profit: number }[];
  topPointUsers: { id: string; name: string; email: string; balance: number; totalEarned: number }[];
}

type Tab = 'sales' | 'points';

function KpiCard({
  label, value, sub, color, icon: Icon,
}: {
  label: string; value: string; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(() =>
    searchParams.get('tab') === 'points' ? 'points' : 'sales'
  );

  useEffect(() => {
    adminApi.get('/admin/analytics')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400">불러오는 중...</p>;
  if (!data) return <p className="text-sm text-red-500">데이터를 불러올 수 없습니다.</p>;

  const maxRevenue = Math.max(...data.monthlyRevenue.map((r) => r.revenue), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">통계 / 분석</h1>

      {/* 탭 */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {([['sales', '매출 · 수익'], ['points', '와이즈 분석']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              router.replace(key === 'points' ? '/admin/analytics?tab=points' : '/admin/analytics');
            }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'sales' && (
        <div className="space-y-6">
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="전체 매출"
              value={`${data.totalRevenue.toLocaleString()}원`}
              sub="취소·환불 제외"
              color="bg-blue-500"
              icon={TrendingUp}
            />
            <KpiCard
              label="구매확정 매출"
              value={`${data.confirmedRevenue.toLocaleString()}원`}
              sub="순수익 계산 기준"
              color="bg-indigo-500"
              icon={TrendingUp}
            />
            <KpiCard
              label="총 원가"
              value={`${data.totalCost.toLocaleString()}원`}
              sub="공급가 입력 상품만"
              color="bg-orange-400"
              icon={TrendingDown}
            />
            <KpiCard
              label="순수익"
              value={`${data.netProfit.toLocaleString()}원`}
              sub={`마진율 ${data.marginRate}%`}
              color={data.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}
              icon={TrendingUp}
            />
          </div>

          {/* 미입금 / 원가미입력 알림 */}
          {(data.unpaidOrderCount > 0 || data.uncostedOrderCount > 0 || data.pendingConfirmedOrderCount > 0) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.unpaidOrderCount > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                  <p className="font-semibold text-amber-800">⏳ 미입금 주문 {data.unpaidOrderCount}건</p>
                  <p className="mt-0.5 text-xs text-amber-600">
                    무통장/가상계좌 미완료 — {data.unpaidOrderAmount.toLocaleString()}원 대기 중
                  </p>
                </div>
              )}
              {data.uncostedOrderCount > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm">
                  <p className="font-semibold text-rose-800">⚠️ 원가 미입력 주문 {data.uncostedOrderCount}건</p>
                  <p className="mt-0.5 text-xs text-rose-600">출고 이후 주문 중 원가 미확정 건 — 구매확정 시 순수익 집계에서 제외됩니다</p>
                </div>
              )}
              {data.pendingConfirmedOrderCount > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm">
                  <p className="font-semibold text-rose-800">📊 원가 미확정 구매확정 주문 {data.pendingConfirmedOrderCount}건</p>
                  <p className="mt-0.5 text-xs text-rose-600">
                    {data.pendingConfirmedRevenue.toLocaleString()}원 — 순수익 집계에서 제외됨 (원가 입력 시 자동 반영)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 월별 매출 바 차트 */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-5">월별 매출 (최근 12개월)</h2>
            {data.monthlyRevenue.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">데이터 없음</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 text-left font-medium">월</th>
                      <th className="pb-2 text-right font-medium">매출</th>
                      <th className="pb-2 text-right font-medium">원가</th>
                      <th className="pb-2 text-right font-medium">수익</th>
                      <th className="pb-2 pl-4 font-medium w-48 text-left">비율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.monthlyRevenue.map((row) => {
                      const barWidth = maxRevenue > 0 ? (row.revenue / maxRevenue) * 100 : 0;
                      const profitColor = row.profit >= 0 ? 'text-emerald-600' : 'text-red-500';
                      return (
                        <tr key={row.month}>
                          <td className="py-2.5 text-gray-600 font-medium">{row.month}</td>
                          <td className="py-2.5 text-right text-gray-800">{row.revenue.toLocaleString()}원</td>
                          <td className="py-2.5 text-right text-gray-400">
                            {row.cost > 0 ? `${row.cost.toLocaleString()}원` : '-'}
                          </td>
                          <td className={`py-2.5 text-right font-medium ${profitColor}`}>
                            {row.cost > 0 ? `${row.profit.toLocaleString()}원` : '-'}
                          </td>
                          <td className="py-2.5 pl-4">
                            <div className="h-2 w-full rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-blue-400 transition-all"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 원가 미입력 안내 */}
          {data.totalCost === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
              공급가가 입력된 상품이 없어 순수익 계산이 불가합니다. 상품 등록 시 공급가를 입력하면 수익 분석이 활성화됩니다.
            </div>
          )}
        </div>
      )}

      {tab === 'points' && (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <KpiCard
              label="누적 적립 와이즈"
              value={`${data.totalPointsIssued.toLocaleString()}W`}
              sub="구매 적립 + 관리자 지급"
              color="bg-violet-500"
              icon={Coins}
            />
            <KpiCard
              label="누적 사용 와이즈"
              value={`${data.totalPointsUsed.toLocaleString()}W`}
              sub="주문 결제 + 와이즈몰"
              color="bg-pink-500"
              icon={Coins}
            />
            <KpiCard
              label="순환 비율"
              value={
                data.totalPointsIssued > 0
                  ? `${Math.round((data.totalPointsUsed / data.totalPointsIssued) * 100)}%`
                  : '-'
              }
              sub="사용 / 발급"
              color="bg-sky-500"
              icon={Users}
            />
          </div>

          {/* 회원별 적립 순위 */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-800">회원별 누적 적립 순위</h2>
              <p className="text-xs text-gray-400 mt-0.5">구매 적립 + 관리자 지급 합산 · TOP 30</p>
            </div>
            {data.topPointUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">적립 내역 없음</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-xs text-gray-500">
                      <th className="px-5 py-3 text-left font-medium">순위</th>
                      <th className="px-5 py-3 text-left font-medium">회원</th>
                      <th className="px-5 py-3 text-right font-medium">누적 적립</th>
                      <th className="px-5 py-3 text-right font-medium">현재 잔액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.topPointUsers.map((u, i) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                            i === 1 ? 'bg-gray-100 text-gray-600' :
                            i === 2 ? 'bg-orange-100 text-orange-600' :
                            'text-gray-400'
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-violet-600">
                          {u.totalEarned.toLocaleString()}P
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600">
                          {u.balance.toLocaleString()}P
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
