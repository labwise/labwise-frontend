'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { Users, ShoppingCart, DollarSign, Package, ChevronRight, AlertTriangle, TrendingUp, Calculator } from 'lucide-react';

interface SiteConfig {
  companyName?: string; ceoName?: string; businessNumber?: string;
  address?: string; mailOrderNumber?: string;
}

const REQUIRED_LEGAL_FIELDS: { key: keyof SiteConfig; label: string }[] = [
  { key: 'companyName', label: '상호(회사명)' },
  { key: 'ceoName', label: '대표자명' },
  { key: 'businessNumber', label: '사업자등록번호' },
  { key: 'address', label: '사업장 주소' },
  { key: 'mailOrderNumber', label: '통신판매업 신고번호' },
];

interface ProfitSummary {
  revenue: number;
  cost: number;
  pgFeeCost: number;
  pgFeeRate: number;
  pointsCost: number;
  jackpotDonationCost: number;
  netProfit: number;
  marginRate: number;
}

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  byStatus?: {
    PENDING: number;
    PAID: number;
    PREPARING: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELLED: number;
    REFUNDED: number;
  };
  profitSummary?: ProfitSummary;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
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

const ORDER_STATUS_ROWS: {
  status: keyof NonNullable<Stats['byStatus']>;
  label: string;
  badge: string;
  action?: string;
}[] = [
  { status: 'PENDING', label: '입금전', badge: 'bg-yellow-100 text-yellow-700', action: '확인필요' },
  { status: 'PAID', label: '입금확인', badge: 'bg-blue-100 text-blue-700', action: '배송준비' },
  { status: 'PREPARING', label: '배송준비중', badge: 'bg-indigo-100 text-indigo-700' },
  { status: 'SHIPPED', label: '배송중', badge: 'bg-purple-100 text-purple-700' },
  { status: 'DELIVERED', label: '배송완료', badge: 'bg-green-100 text-green-700' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingLegalFields, setMissingLegalFields] = useState<string[]>([]);

  useEffect(() => {
    adminApi
      .get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));

    adminApi.get('/admin/site-settings').then(({ data }: { data: SiteConfig }) => {
      const missing = REQUIRED_LEGAL_FIELDS.filter((f) => !data?.[f.key]?.trim()).map((f) => f.label);
      setMissingLegalFields(missing);
    }).catch(() => {});
  }, []);

  if (loading) return <p className="text-sm text-gray-400">불러오는 중...</p>;
  if (!stats) return <p className="text-sm text-red-500">데이터를 불러올 수 없습니다.</p>;

  const actionNeeded = (stats.byStatus?.PENDING ?? 0) + (stats.byStatus?.PAID ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">대시보드</h1>

      {missingLegalFields.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">전자상거래법상 필수 표시 정보가 비어있습니다</p>
            <p className="mt-0.5 text-amber-700">
              {missingLegalFields.join(', ')} —{' '}
              <Link href="/admin/site-settings" className="font-medium underline hover:text-amber-900">
                사이트 설정에서 입력하기
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* 주요 지표 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="전체 회원"
          value={(stats.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="전체 주문"
          value={(stats.totalOrders ?? 0).toLocaleString()}
          icon={ShoppingCart}
          color="bg-indigo-500"
        />
        <StatCard
          label="누적 매출"
          value={`${(stats.totalRevenue ?? 0).toLocaleString()}원`}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard
          label="등록 상품"
          value={(stats.totalProducts ?? 0).toLocaleString()}
          icon={Package}
          color="bg-violet-500"
        />
      </div>

      {/* 주문 현황 */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">주문 현황</h2>
            {actionNeeded > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                처리필요 {actionNeeded}건
              </span>
            )}
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-0.5 text-sm text-blue-600 hover:text-blue-700"
          >
            전체보기
            <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-5 divide-x divide-gray-100">
          {ORDER_STATUS_ROWS.map(({ status, label, badge, action }) => {
            const count = stats.byStatus?.[status] ?? 0;
            return (
              <Link
                key={status}
                href={`/admin/orders?status=${status}`}
                className="flex flex-col items-center gap-1 px-4 py-5 transition-colors hover:bg-gray-50"
              >
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
                  {label}
                </span>
                <span className={`text-2xl font-bold ${count > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                  {count}
                </span>
                {action && count > 0 && (
                  <span className="text-xs font-medium text-red-500">{action}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 순수익 */}
      {stats.profitSummary && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              <h2 className="font-semibold text-gray-900">실질 순수익</h2>
              <span className="text-xs text-gray-400">구매확정 주문 기준</span>
            </div>
            <Link
              href="/admin/cost-calculator"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Calculator size={14} /> 원가 계산기
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 px-5 py-5 md:grid-cols-3">
            <div>
              <p className="text-xs text-gray-400">매출</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{stats.profitSummary.revenue.toLocaleString()}원</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">순수익</p>
              <p className={`mt-1 text-lg font-bold ${stats.profitSummary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.profitSummary.netProfit.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">순마진율</p>
              <p className={`mt-1 text-lg font-bold ${stats.profitSummary.marginRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.profitSummary.marginRate}%
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-5 py-4 text-xs text-gray-500 md:grid-cols-4">
            <div className="flex justify-between md:block">
              <span>원가</span>
              <span className="font-medium text-gray-700 md:mt-0.5 md:block">-{stats.profitSummary.cost.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between md:block">
              <span>PG 수수료 (추정 {stats.profitSummary.pgFeeRate}%)</span>
              <span className="font-medium text-gray-700 md:mt-0.5 md:block">-{stats.profitSummary.pgFeeCost.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between md:block">
              <span>와이즈 포인트 적립</span>
              <span className="font-medium text-gray-700 md:mt-0.5 md:block">-{stats.profitSummary.pointsCost.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between md:block">
              <span>감사펀드+기부 (3%)</span>
              <span className="font-medium text-gray-700 md:mt-0.5 md:block">-{stats.profitSummary.jackpotDonationCost.toLocaleString()}원</span>
            </div>
          </div>
          <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
            PG 수수료는 결제사에서 거래별 수수료를 제공하지 않아 추정 요율로 계산됩니다. 원가는 상품별 공급가(costPrice)가 입력된 항목만 반영됩니다 — 원가 계산기에서 상품을 연동해두면 자동 반영됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
