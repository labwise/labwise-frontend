'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Ticket, Trophy, Gift, ChevronRight, Clock } from 'lucide-react';

interface Tier {
  id: string;
  minAmount: number;
  prizeName: string;
  prizeDescription?: string;
  prizeImageUrl?: string;
}

interface RaffleStatus {
  ticketCount: number;
  hasApplied: boolean;
  pool: {
    currentAmount: number;
    status: 'OPEN' | 'CLOSED' | 'DRAWN';
    deadlineAt: string | null;
    periodStartedAt: string;
  };
  currentPrize: Tier | null;
  tiers: Tier[];
}

export default function RafflePage() {
  const qc = useQueryClient();
  const [applyDone, setApplyDone] = useState(false);

  const { data, isLoading } = useQuery<RaffleStatus>({
    queryKey: ['raffle-my'],
    queryFn: async () => {
      const { data } = await api.get('/jackpot/my');
      return data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => { await api.post('/jackpot/apply'); },
    onSuccess: () => {
      setApplyDone(true);
      qc.invalidateQueries({ queryKey: ['raffle-my'] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
    );
  }

  const { ticketCount, hasApplied, pool, currentPrize, tiers } = data;
  const isOpen = pool.status === 'OPEN';
  const isClosed = pool.status === 'CLOSED';
  const deadlineDate = pool.deadlineAt ? new Date(pool.deadlineAt) : null;
  const isPastDeadline = deadlineDate ? new Date() > deadlineDate : false;
  const canApply = isOpen && !hasApplied && !isPastDeadline;

  const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);
  const currentAmount = pool.currentAmount;

  return (
    <div className="space-y-5">
      {/* 응모권 카드 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        {/* 배경 패턴 */}
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '16px 16px' }} />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-200">내 응모권</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-5xl font-bold">{ticketCount}</span>
              <span className="mb-1.5 text-xl text-blue-200">장</span>
            </div>
            <p className="mt-1 text-xs text-blue-300">
              기본 1장 + 구매 {formatPrice((ticketCount - 1) * 50000)} 적립분
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            {Array.from({ length: Math.min(ticketCount, 5) }).map((_, i) => (
              <div
                key={i}
                className="flex h-8 w-24 items-center justify-center rounded-lg border border-white/30 bg-white/15 shadow-sm backdrop-blur-sm"
                style={{ transform: `rotate(${(i - 2) * 3}deg) translateY(${i * -4}px)` }}
              >
                <Ticket className="mr-1 h-3.5 w-3.5 text-yellow-300" />
                <span className="text-xs font-bold tracking-widest text-white/90">NO.{String(i + 1).padStart(3, '0')}</span>
              </div>
            ))}
            {ticketCount > 5 && (
              <p className="text-xs text-blue-300">+{ticketCount - 5}장 더</p>
            )}
          </div>
        </div>

        {/* 티켓 하단 점선 구분선 */}
        <div className="relative mt-5 flex items-center gap-2">
          <div className="h-px flex-1 border-t border-dashed border-white/30" />
          <Ticket className="h-4 w-4 text-white/40" />
          <div className="h-px flex-1 border-t border-dashed border-white/30" />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-blue-200">
            {hasApplied ? '✅ 이번 회차 응모 완료' : canApply ? '아직 응모 전입니다' : isClosed ? '⛔ 응모 마감됨' : '응모 대기 중'}
          </span>
          {deadlineDate && !isPastDeadline && (
            <span className="flex items-center gap-1 text-xs text-yellow-300">
              <Clock className="h-3.5 w-3.5" />
              {deadlineDate.toLocaleDateString('ko-KR')} 마감
            </span>
          )}
        </div>
      </div>

      {/* 응모하기 버튼 */}
      {canApply && (
        <button
          onClick={() => applyMutation.mutate()}
          disabled={applyMutation.isPending}
          className="w-full rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-transform disabled:opacity-60"
        >
          {applyMutation.isPending ? '처리 중...' : '🎟️  이번 회차 응모하기'}
        </button>
      )}
      {(hasApplied || applyDone) && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm font-medium text-green-700">
          🎉 응모 완료! 추첨 결과를 기다려주세요.
        </div>
      )}
      {isClosed && !hasApplied && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
          이번 회차 응모가 마감됐습니다. 다음 회차를 기다려주세요.
        </div>
      )}

      {/* 현재 펀드 & 상품 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">현재 펀드 현황</h3>
        <div className="mb-2 flex items-end justify-between">
          <span className="text-2xl font-bold text-blue-600">{formatPrice(currentAmount)}</span>
          {currentPrize && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Gift className="h-3.5 w-3.5" />
              현재 상품: {currentPrize.prizeName}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          ※ 펀드는 구매금액의 1.5%가 자동 적립됩니다. 적립될수록 더 좋은 상품으로 바뀝니다.
        </p>
      </div>

      {/* 상품 구간 진행도 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-yellow-500" />
          상품 구간 — 펀드가 쌓일수록 상품이 바뀝니다
        </h3>
        <div className="space-y-2.5">
          {sortedTiers.map((tier, i) => {
            const isActive = currentPrize?.id === tier.id;
            const isPast = currentAmount >= tier.minAmount &&
              (i === sortedTiers.length - 1 || currentAmount < sortedTiers[i + 1]?.minAmount);
            const isUnlocked = currentAmount >= tier.minAmount;

            return (
              <div
                key={tier.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  isActive
                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                    : isUnlocked
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-gray-100 bg-gray-50/50 opacity-60'
                }`}
              >
                {tier.prizeImageUrl ? (
                  <img src={tier.prizeImageUrl} alt={tier.prizeName} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-xl">
                    🎁
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{tier.prizeName}</p>
                    {isActive && (
                      <span className="flex-shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">현재</span>
                    )}
                    {isUnlocked && !isActive && (
                      <span className="flex-shrink-0 text-green-500 text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{formatPrice(tier.minAmount)} 이상 적립 시</p>
                  {tier.prizeDescription && (
                    <p className="text-xs text-gray-500 truncate">{tier.prizeDescription}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
