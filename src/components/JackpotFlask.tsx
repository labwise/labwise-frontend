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

  // 메스 플라스크 SVG 치수 (viewBox 0 0 100 290)
  // 목(neck): y=20 ~ y=185 (165px — 전체의 약 65%)
  // 몸통(body): y=185 ~ y=282 (97px — 전체의 약 35%)
  // 내부 채움 가능 범위
  const fillBottom = 280;
  const fillTop    = 22;          // 마개 바로 아래
  const fillRange  = fillBottom - fillTop; // 258
  const liquidY = fillBottom - (pct / 100) * fillRange;
  const liquidH = (pct / 100) * fillRange;

  return (
    <div
      className="fixed right-4 top-1/2 z-40 -translate-y-1/2 hidden xl:flex flex-col items-center select-none"
      style={{ width: 160 }}
    >
      <div
        className="w-full rounded-2xl shadow-xl border border-blue-200 overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #eff6ff 0%, #dbeafe 100%)' }}
      >
        {/* 헤더 — 한 줄 */}
        <div className="px-4 pt-4 pb-1 text-center">
          <p className="text-[13px] font-bold text-blue-700 tracking-wide whitespace-nowrap">
            연구자 감사 펀드
          </p>
          <p className="text-[11px] text-blue-400 mt-0.5">매출의 1.5% 적립</p>
        </div>

        {/* 플라스크 SVG */}
        <div className="flex justify-center py-2">
          <svg
            viewBox="0 0 100 290"
            width="110"
            height="319"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* 내부 영역 클립 */}
              <clipPath id="vf-clip">
                {/* 목 내부 */}
                <rect x="44" y="20" width="12" height="166" />
                {/* 몸통 내부 (배 모양) */}
                <path d="
                  M 44 185
                  Q 42 192, 28 204
                  Q 10 222, 10 246
                  Q 10 280, 50 280
                  Q 90 280, 90 246
                  Q 90 222, 72 204
                  Q 58 192, 56 185
                  Z
                " />
              </clipPath>

              {/* 액체 그라디언트 */}
              <linearGradient id="vf-liq" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#1d4ed8" stopOpacity="0.82" />
                <stop offset="40%"  stopColor="#3b82f6" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.82" />
              </linearGradient>

              {/* 유리 광택 */}
              <linearGradient id="vf-shine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"  stopColor="white" stopOpacity="0.0" />
                <stop offset="25%" stopColor="white" stopOpacity="0.22" />
                <stop offset="55%" stopColor="white" stopOpacity="0.04" />
                <stop offset="100%" stopColor="white" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* ── 마개 (스토퍼) ── */}
            <rect x="36" y="3" width="28" height="16" rx="5"
              fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" />
            <rect x="40" y="6" width="12" height="5" rx="2.5"
              fill="white" opacity="0.55" />

            {/* ── 유리 배경 (목 + 몸통) ── */}
            {/* 목 배경 */}
            <rect x="44" y="19" width="12" height="167"
              fill="#dbeafe" fillOpacity="0.45" />
            {/* 몸통 배경 */}
            <path d="
              M 44 185
              Q 42 192, 28 204
              Q 10 222, 10 246
              Q 10 280, 50 280
              Q 90 280, 90 246
              Q 90 222, 72 204
              Q 58 192, 56 185
              Z
            " fill="#dbeafe" fillOpacity="0.5" />

            {/* ── 액체 ── */}
            <rect
              x="0" y={liquidY} width="100" height={liquidH + 6}
              fill="url(#vf-liq)"
              clipPath="url(#vf-clip)"
              className="transition-all duration-1000"
            />

            {/* ── 메니스커스 (액체 상단 곡면) ── */}
            {pct > 1 && (
              <ellipse
                cx="50"
                cy={liquidY}
                rx={liquidY > 185 ? 6 : 30}
                ry="3.5"
                fill="#60a5fa"
                opacity="0.75"
                clipPath="url(#vf-clip)"
                className="transition-all duration-1000"
              />
            )}

            {/* ── 기포 ── */}
            {pct > 10 && (
              <>
                <circle cx="47" cy={Math.min(Math.max(liquidY + 20, 200), 265)} r="2.5"
                  fill="white" opacity="0.35" clipPath="url(#vf-clip)">
                  <animateTransform attributeName="transform" type="translate"
                    values="0,0;0,-18;0,0" dur="2.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="54" cy={Math.min(Math.max(liquidY + 35, 220), 270)} r="1.8"
                  fill="white" opacity="0.28" clipPath="url(#vf-clip)">
                  <animateTransform attributeName="transform" type="translate"
                    values="0,0;0,-14;0,0" dur="3.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* ── 눈금선 ── */}
            {[33, 66].map((mark) => {
              const markY = fillBottom - (mark / 100) * fillRange;
              // 몸통 오른쪽 경계 x: 베지어 곡선 구간별 역산
              let rightX: number;
              if (markY <= 185) {
                rightX = 56; // 목 오른쪽
              } else if (markY <= 204) {
                // 구간: (72,204) → ctrl(58,192) → (56,185)
                const t = (24 - Math.sqrt(20 * markY - 3504)) / 10;
                rightX = 72 - 28 * t + 12 * t * t;
              } else if (markY <= 246) {
                // 구간: (90,246) → ctrl(90,222) → (72,204)
                const t = (48 - Math.sqrt(24 * markY - 3600)) / 12;
                rightX = 90 - 18 * t * t;
              } else {
                // 구간: (50,280) → ctrl(90,280) → (90,246)
                const t = Math.sqrt((280 - markY) / 34);
                rightX = 50 + 80 * t - 40 * t * t;
              }
              return (
                <g key={mark}>
                  <line x1={rightX} y1={markY} x2={rightX + 10} y2={markY}
                    stroke="#93c5fd" strokeWidth="1.2" />
                  <text x={rightX + 12} y={markY + 3.5} fontSize="8" fill="#93c5fd"
                    fontFamily="monospace">{mark}%</text>
                </g>
              );
            })}

            {/* ── 유리 반사 (목) ── */}
            <rect x="46" y="20" width="4" height="162"
              fill="url(#vf-shine)" rx="2" />
            {/* 유리 반사 (몸통 왼쪽) */}
            <path d="
              M 46 186
              Q 40 196, 28 210
              Q 18 226, 17 248
            " fill="none" stroke="white" strokeWidth="4"
              strokeOpacity="0.22" strokeLinecap="round" />

            {/* ── 외곽선 — 목 ── */}
            <rect x="44" y="19" width="12" height="167"
              fill="none" stroke="#3b82f6" strokeWidth="2"
              strokeLinejoin="round" />

            {/* ── 외곽선 — 몸통 ── */}
            <path d="
              M 44 185
              Q 42 192, 28 204
              Q 10 222, 10 246
              Q 10 280, 50 280
              Q 90 280, 90 246
              Q 90 222, 72 204
              Q 58 192, 56 185
            " fill="none" stroke="#3b82f6" strokeWidth="2"
              strokeLinejoin="round" />
          </svg>
        </div>

        {/* 수치 */}
        <div className="px-5 pb-4 text-center">
          <p className="text-[17px] font-bold text-blue-700 leading-tight">
            {formatWise(data.currentAmount)}
          </p>

          {/* 프로그래스바 */}
          <div className="mt-2 h-2 rounded-full bg-blue-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-blue-400">
            <span className="font-medium">{pct}%</span>
            <span>목표 {formatWise(data.threshold)}</span>
          </div>
        </div>

        {/* 최근 당첨 */}
        {lastDraw && (
          <div className="border-t border-blue-100 bg-white/50 px-4 py-2.5 text-center">
            <p className="text-[10px] font-semibold text-green-600">🎉 최근 추첨</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {new Date(lastDraw.drawnAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              &nbsp;·&nbsp;{lastDraw.winnerCount}명 당첨
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
