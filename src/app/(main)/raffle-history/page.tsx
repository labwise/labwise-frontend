'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Trophy, Gift, Calendar, Building2 } from 'lucide-react';
import { formatWise } from '@/lib/utils';

interface DrawRecord {
  id: string;
  drawnAt: string;
  totalAmount: number;
  winnerType?: 'PERSONAL' | 'INSTITUTION';
  prizeName?: string;
  prizeImageUrl?: string;
  winnerMaskedName?: string;
  winnerInstitutionMaskedName?: string;
  pointsPerWinner?: number;
  totalTickets?: number;
  winnerTicketIndex?: number;
  seed?: string;
}

export default function RaffleHistoryPage() {
  const { data: draws = [], isLoading } = useQuery<DrawRecord[]>({
    queryKey: ['raffle-history-public'],
    queryFn: async () => {
      const { data } = await api.get('/jackpot/history');
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
          <Trophy className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">감사 펀드 당첨 이력</h1>
          <p className="text-sm text-gray-500">추첨 결과를 투명하게 공개합니다</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && draws.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 py-16 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">아직 추첨 이력이 없습니다.</p>
          <p className="mt-1 text-xs text-gray-400">첫 번째 당첨자가 되어보세요! 🎉</p>
        </div>
      )}

      <div className="space-y-4">
        {draws.map((draw, idx) => (
          <div
            key={draw.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex items-stretch">
              {/* 순서 뱃지 */}
              <div className="flex w-14 flex-shrink-0 flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-indigo-700 py-5 text-white">
                <span className="text-[10px] font-medium text-blue-200">제</span>
                <span className="text-2xl font-bold leading-none">{draws.length - idx}</span>
                <span className="text-[10px] font-medium text-blue-200">회</span>
              </div>

              {/* 내용 */}
              <div className="flex flex-1 items-center gap-4 px-5 py-4">
                {draw.winnerType === 'INSTITUTION' ? (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-3xl">
                    🏛️
                  </div>
                ) : draw.prizeImageUrl ? (
                  <img
                    src={draw.prizeImageUrl}
                    alt={draw.prizeName}
                    className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-3xl">
                    🎁
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {draw.winnerType === 'INSTITUTION' ? (
                      <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                        <Building2 className="h-3 w-3" />
                        기관 포인트 {formatWise(draw.pointsPerWinner ?? draw.totalAmount)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
                        <Gift className="h-3 w-3" />
                        {draw.prizeName ?? '상품'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-lg font-bold text-gray-900">
                    🎉 {draw.winnerType === 'INSTITUTION'
                      ? `${draw.winnerInstitutionMaskedName ?? '???'} 기관`
                      : `${draw.winnerMaskedName ?? '???'} 님`}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(draw.drawnAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span>펀드 {formatPrice(draw.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 장식 */}
            <div className="border-t border-dashed border-gray-100 bg-gray-50/50 px-5 py-2 text-center">
              <p className="text-[11px] text-gray-400">
                구매금액의 1.5%가 자동 적립된 펀드로 추첨되었습니다
              </p>
              {draw.seed && (
                <p className="mt-1 truncate text-[10px] text-gray-300" title={`검증 시드: ${draw.seed}`}>
                  검증코드 {draw.seed.slice(0, 12)}… · 발행 응모권 {draw.totalTickets?.toLocaleString()}장 · 당첨 인덱스 {draw.winnerTicketIndex}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
