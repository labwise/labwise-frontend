'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Gift } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface Tier { id: string; minAmount: number; prizeName: string; prizeImageUrl?: string }
interface JackpotData {
  currentAmount: number;
  status: 'OPEN' | 'CLOSED' | 'DRAWN';
  deadlineAt: string | null;
  currentPrize: Tier | null;
  tiers: Tier[];
  entryCount: number;
  totalContributed: number;
  recentDraws: { drawnAt: string; prizeName?: string; winnerMaskedName?: string }[];
}

export default function JackpotFlask() {
  const [collapsed, setCollapsed] = useState(false);

  const { data } = useQuery<JackpotData>({
    queryKey: ['jackpot-public'],
    queryFn: async () => { const { data } = await api.get('/jackpot'); return data; },
    refetchInterval: 30000,
    staleTime: 30000,
  });

  if (!data) return null;

  const sortedTiers = [...(data.tiers ?? [])].sort((a, b) => a.minAmount - b.minAmount);
  const currentTierIdx = data.currentPrize
    ? sortedTiers.findIndex((t) => t.id === data.currentPrize!.id)
    : -1;
  const tierMin = currentTierIdx >= 0 ? sortedTiers[currentTierIdx].minAmount : 0;
  const nextTier = currentTierIdx >= 0 ? sortedTiers[currentTierIdx + 1] : sortedTiers[0];
  const isLastTier = currentTierIdx >= 0 && !nextTier;
  const tierMax = nextTier
    ? nextTier.minAmount
    : (tierMin > 0 ? Math.round(tierMin * 2) : 100000);

  const pct = isLastTier
    ? 100
    : tierMax > tierMin
    ? Math.min(100, Math.max(0, Math.round(((data.currentAmount - tierMin) / (tierMax - tierMin)) * 100)))
    : 0;

  const subtitle = isLastTier
    ? '최고 구간 달성!'
    : nextTier
    ? `${nextTier.prizeName} 까지 ${pct}%`
    : `${pct}% 달성`;

  const lastDraw = data.recentDraws?.[0];
  const deadline = data.deadlineAt ? new Date(data.deadlineAt) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-1.5 rounded-l-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-700 xl:flex"
      >
        <Gift className="h-3.5 w-3.5" />
        {pct}%
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 xl:block" style={{ width: 156 }}>
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <button
          onClick={() => setCollapsed(true)}
          className="absolute right-2 top-2 rounded-full p-0.5 text-gray-300 hover:text-gray-500"
          aria-label="위젯 접기"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <div className="px-4 pt-4 pb-2 text-center">
          <p className="text-[11px] font-bold text-blue-600">🎁 감사펀드</p>
          <p className="mt-1 text-[17px] font-extrabold text-gray-900">{formatPrice(data.currentAmount)}</p>
          <p className="mt-0.5 text-[9.5px] text-gray-400">{subtitle}</p>
        </div>

        <div className="mx-3.5 mb-1.5 h-1.5 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mx-3.5 mb-3 flex items-center justify-between text-[9px] text-gray-400">
          <span>{daysLeft !== null && daysLeft >= 0 ? (daysLeft === 0 ? '오늘 마감' : `D-${daysLeft} 마감`) : ''}</span>
          <span>{data.entryCount}명 응모</span>
        </div>

        <div className="px-3 pb-3">
          <Link
            href="/my/raffle"
            className="block rounded-lg bg-blue-600 py-2 text-center text-[11px] font-bold text-white hover:bg-blue-700"
          >
            응모하기
          </Link>
        </div>

        <div className="flex flex-col border-t border-gray-100">
          {lastDraw && (
            <Link
              href="/raffle-history"
              className="flex items-baseline justify-between border-b border-gray-100 px-3.5 py-2 text-[9px] text-gray-400 hover:bg-gray-50"
            >
              <span>최근 당첨</span>
              <span className="text-[10.5px] font-bold text-gray-700">{lastDraw.winnerMaskedName}</span>
            </Link>
          )}
          <Link
            href="/donations"
            className="flex items-baseline justify-between px-3.5 py-2 text-[9px] text-gray-400 hover:bg-gray-50"
          >
            <span>기부 누적</span>
            <span className="text-[10.5px] font-bold text-green-600">{formatPrice(data.totalContributed)}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
