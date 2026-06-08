'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface RecentDraw {
  id: string;
  drawnAt: string;
  totalAmount: number;
  prizeName?: string;
  winnerMaskedName?: string;
}

interface JackpotPublic {
  recentDraws: RecentDraw[];
}

export default function WinnerTicker() {
  const { data } = useQuery<JackpotPublic>({
    queryKey: ['jackpot-public-ticker'],
    queryFn: async () => {
      const { data } = await api.get('/jackpot');
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const draws = data?.recentDraws ?? [];
  if (draws.length === 0) return null;

  const items = [...draws, ...draws];

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5">
      <div className="flex items-center gap-3 px-4">
        <div className="flex-shrink-0 flex items-center gap-1.5 text-white text-xs font-semibold whitespace-nowrap">
          <Trophy size={13} className="text-yellow-300" />
          감사 펀드 당첨
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div
            className="flex gap-8 whitespace-nowrap animate-ticker"
            style={{ animationDuration: `${Math.max(20, draws.length * 6)}s` }}
          >
            {items.map((d, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs text-white">
                <span className="font-semibold text-yellow-200">{d.winnerMaskedName ?? '???'}</span>
                <span className="text-blue-200">{d.prizeName ?? '상품'} 당첨</span>
                <span className="text-blue-300">({formatPrice(d.totalAmount)})</span>
                <span className="text-blue-300 text-[10px]">
                  {new Date(d.drawnAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-blue-400 mx-1">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
