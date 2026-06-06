'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatWise } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface JackpotPublic {
  recentDraws: {
    drawnAt: string;
    winnerCount: number;
    pointsPerWinner: number;
    winners: { maskedName: string }[];
  }[];
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

  const winners: { name: string; points: number; date: string }[] = [];
  for (const draw of data?.recentDraws ?? []) {
    for (const w of draw.winners ?? []) {
      winners.push({
        name: w.maskedName,
        points: draw.pointsPerWinner,
        date: draw.drawnAt,
      });
    }
  }

  if (winners.length === 0) return null;

  // Duplicate list for seamless loop
  const items = [...winners, ...winners];

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
            style={{ animationDuration: `${Math.max(20, winners.length * 4)}s` }}
          >
            {items.map((w, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs text-white">
                <span className="font-semibold text-yellow-200">{w.name}</span>
                <span className="text-blue-200">{formatWise(w.points)} 적립</span>
                <span className="text-blue-300 text-[10px]">
                  {new Date(w.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
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
