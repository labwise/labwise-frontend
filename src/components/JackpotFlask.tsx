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

  // 플라스크 내부 채움 계산
  // viewBox: 0 0 80 220
  // 내부 채움 가능 영역: y=22(목 상단) ~ y=208(바닥)
  const fillTop = 22;
  const fillBottom = 208;
  const fillRange = fillBottom - fillTop;  // 186
  const liquidY = fillBottom - (pct / 100) * fillRange;
  const liquidH = (pct / 100) * fillRange;

  return (
    <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2 hidden xl:flex flex-col items-center gap-0 select-none"
      style={{ width: 130 }}>

      {/* 카드 전체 */}
      <div className="rounded-2xl overflow-hidden shadow-xl border border-blue-100"
        style={{ background: 'linear-gradient(160deg, #f0f7ff 0%, #e8f0fe 100%)' }}>

        {/* 헤더 */}
        <div className="px-4 pt-4 pb-2 text-center">
          <p className="text-[11px] font-bold text-blue-700 tracking-wide">🧪 연구자 감사 펀드</p>
          <p className="text-[10px] text-blue-400 mt-0.5">매출의 1%가 모입니다</p>
        </div>

        {/* 플라스크 */}
        <div className="flex justify-center px-2 pb-1">
          <svg viewBox="0 0 80 220" width="90" height="198" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* 플라스크 안쪽 클립 영역 */}
              <clipPath id="flask-inner-clip">
                <path d="
                  M 32 22
                  L 32 72
                  Q 30 80, 19 96
                  Q 6 115, 6 142
                  Q 6 206, 40 206
                  Q 74 206, 74 142
                  Q 74 115, 61 96
                  Q 50 80, 48 72
                  L 48 22
                  Z
                " />
              </clipPath>

              {/* 액체 그라디언트 */}
              <linearGradient id="liq-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.85" />
              </linearGradient>

              {/* 유리 반사 그라디언트 */}
              <linearGradient id="glass-shine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0.0" />
                <stop offset="30%" stopColor="white" stopOpacity="0.18" />
                <stop offset="50%" stopColor="white" stopOpacity="0.0" />
                <stop offset="100%" stopColor="white" stopOpacity="0.0" />
              </linearGradient>

              {/* 플라스크 배경 (유리 느낌) */}
              <linearGradient id="glass-bg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#eff6ff" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* ── 마개 (스토퍼) ── */}
            <rect x="27" y="2" width="26" height="14" rx="5"
              fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            {/* 마개 하이라이트 */}
            <rect x="30" y="4" width="10" height="4" rx="2" fill="white" opacity="0.5" />

            {/* ── 플라스크 유리 배경 ── */}
            <path d="
              M 32 16
              L 32 72
              Q 30 80, 19 96
              Q 6 115, 6 142
              Q 6 206, 40 206
              Q 74 206, 74 142
              Q 74 115, 61 96
              Q 50 80, 48 72
              L 48 16
              Z
            " fill="url(#glass-bg)" stroke="none" />

            {/* ── 액체 채움 ── */}
            <rect
              x="0" y={liquidY} width="80" height={liquidH + 4}
              fill="url(#liq-grad)"
              clipPath="url(#flask-inner-clip)"
              className="transition-all duration-1000"
            />

            {/* ── 메니스커스 (액체 상단 곡면) ── */}
            {pct > 2 && (
              <ellipse
                cx="40" cy={liquidY}
                rx={pct > 30 ? 28 : 8}
                ry="4"
                fill="#60a5fa"
                opacity="0.7"
                clipPath="url(#flask-inner-clip)"
                className="transition-all duration-1000"
              />
            )}

            {/* ── 기포 애니메이션 ── */}
            {pct > 15 && (
              <>
                <circle cx="35" cy={Math.max(liquidY + 15, 100)} r="2"
                  fill="white" opacity="0.3"
                  clipPath="url(#flask-inner-clip)">
                  <animateTransform attributeName="transform" type="translate"
                    values="0,0;0,-12;0,0" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx="45" cy={Math.max(liquidY + 25, 110)} r="1.5"
                  fill="white" opacity="0.25"
                  clipPath="url(#flask-inner-clip)">
                  <animateTransform attributeName="transform" type="translate"
                    values="0,0;0,-10;0,0" dur="3.1s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* ── 눈금선 ── */}
            {[25, 50, 75].map((mark) => {
              const y = fillBottom - (mark / 100) * fillRange;
              return (
                <g key={mark}>
                  <line x1="48" y1={y} x2="56" y2={y} stroke="#93c5fd" strokeWidth="1" />
                  <text x="59" y={y + 3} fontSize="6" fill="#93c5fd">{mark}%</text>
                </g>
              );
            })}

            {/* ── 유리 반사 (왼쪽 하이라이트) ── */}
            <path d="
              M 34 22
              L 34 68
              Q 32 76, 23 90
              Q 16 104, 14 122
            " fill="none" stroke="white" strokeWidth="3" strokeOpacity="0.35"
              strokeLinecap="round" />

            {/* ── 플라스크 외곽선 ── */}
            <path d="
              M 32 16
              L 32 72
              Q 30 80, 19 96
              Q 6 115, 6 142
              Q 6 206, 40 206
              Q 74 206, 74 142
              Q 74 115, 61 96
              Q 50 80, 48 72
              L 48 16
            " fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />

            {/* 목 양쪽 선 */}
            <line x1="32" y1="16" x2="32" y2="22" stroke="#3b82f6" strokeWidth="2.5" />
            <line x1="48" y1="16" x2="48" y2="22" stroke="#3b82f6" strokeWidth="2.5" />
          </svg>
        </div>

        {/* 수치 */}
        <div className="px-4 pb-4 text-center">
          <p className="text-base font-bold text-blue-700 leading-tight">
            {formatWise(data.currentAmount)}
          </p>

          {/* 프로그래스바 */}
          <div className="mt-2 h-1.5 rounded-full bg-blue-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-blue-400">
            <span>{pct}%</span>
            <span>목표 {formatWise(data.threshold)}</span>
          </div>
        </div>

        {/* 최근 당첨 */}
        {lastDraw && (
          <div className="border-t border-blue-100 px-3 py-2.5 text-center bg-white/50">
            <p className="text-[9px] font-semibold text-green-600">🎉 최근 추첨</p>
            <p className="text-[9px] text-gray-500 mt-0.5">
              {new Date(lastDraw.drawnAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              &nbsp;·&nbsp;{lastDraw.winnerCount}명 당첨
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
