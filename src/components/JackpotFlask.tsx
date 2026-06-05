'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatWise } from '@/lib/utils';

interface JackpotData {
  currentAmount: number;
  threshold: number;
  percentage: number;
  recentDraws: {
    drawnAt: string;
    totalAmount: number;
    winnerCount: number;
    pointsPerWinner: number;
    winners: { maskedName: string }[];
  }[];
}

export default function JackpotFlask() {
  const { data } = useQuery<JackpotData>({
    queryKey: ['jackpot-public'],
    queryFn: async () => {
      const { data } = await api.get('/jackpot');
      return data;
    },
    refetchInterval: 30000,
    staleTime: 1000 * 30,
  });

  if (!data) return null;

  const pct = data.percentage;
  const lastDraw = data.recentDraws?.[0];

  return (
    <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2 hidden xl:flex flex-col items-center gap-2 select-none">
      {/* 타이틀 */}
      <div className="rounded-lg bg-white/90 border border-blue-100 shadow-sm px-3 py-1.5 text-center backdrop-blur-sm">
        <p className="text-[10px] font-bold text-blue-700 tracking-wider uppercase">연구자 감사 펀드</p>
        <p className="text-[10px] text-gray-500 mt-0.5">🧪 매출의 1%가 모입니다</p>
      </div>

      {/* 플라스크 SVG */}
      <div className="relative w-16">
        <svg viewBox="0 0 64 120" className="w-full drop-shadow-md">
          {/* 플라스크 외형 */}
          <defs>
            <clipPath id="flask-clip">
              {/* 플라스크 안쪽 채우기 영역 */}
              <path d="M22 4 L22 52 L4 100 Q4 116 32 116 Q60 116 60 100 L42 52 L42 4 Z" />
            </clipPath>
          </defs>

          {/* 배경 (빈 플라스크) */}
          <path
            d="M22 4 L22 52 L4 100 Q4 116 32 116 Q60 116 60 100 L42 52 L42 4 Z"
            fill="#EFF6FF"
            stroke="#93C5FD"
            strokeWidth="2"
          />

          {/* 액체 채우기 (아래부터 위로) */}
          <rect
            x="0" y={116 - (112 * pct / 100)} width="64" height={112 * pct / 100}
            fill="url(#liquid-gradient)"
            clipPath="url(#flask-clip)"
            className="transition-all duration-1000"
          />

          {/* 거품 효과 */}
          {pct > 10 && (
            <>
              <circle cx="28" cy={116 - (112 * pct / 100) + 6} r="2.5" fill="rgba(255,255,255,0.5)" className="animate-pulse" />
              <circle cx="36" cy={116 - (112 * pct / 100) + 12} r="1.5" fill="rgba(255,255,255,0.4)" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
            </>
          )}

          {/* 플라스크 외형 선 (위에 그려서 선명하게) */}
          <path
            d="M22 4 L22 52 L4 100 Q4 116 32 116 Q60 116 60 100 L42 52 L42 4 Z"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
          />

          {/* 플라스크 목 */}
          <rect x="20" y="1" width="24" height="6" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />

          {/* 그라디언트 정의 */}
          <defs>
            <linearGradient id="liquid-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>

        {/* 퍼센트 텍스트 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow">{pct}%</span>
        </div>
      </div>

      {/* 금액 표시 */}
      <div className="rounded-lg bg-white/90 border border-blue-100 shadow-sm px-3 py-2 text-center backdrop-blur-sm w-20">
        <p className="text-xs font-bold text-blue-600">{formatWise(data.currentAmount)}</p>
        <div className="my-1 h-px bg-gray-100" />
        <p className="text-[10px] text-gray-400">목표 {formatWise(data.threshold)}</p>
      </div>

      {/* 최근 당첨자 */}
      {lastDraw && (
        <div className="rounded-lg bg-white/90 border border-green-100 shadow-sm px-2 py-2 text-center backdrop-blur-sm w-20">
          <p className="text-[9px] font-semibold text-green-600">🎉 최근 당첨</p>
          <p className="text-[9px] text-gray-500 mt-0.5">
            {new Date(lastDraw.drawnAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </p>
          <p className="text-[9px] text-gray-600 mt-0.5">{lastDraw.winnerCount}명 당첨</p>
        </div>
      )}
    </div>
  );
}
