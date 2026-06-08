'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
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
  recentDraws: { drawnAt: string; prizeName?: string; winnerMaskedName?: string }[];
}

export default function JackpotFlask() {
  const { data } = useQuery<JackpotData>({
    queryKey: ['jackpot-public'],
    queryFn: async () => { const { data } = await api.get('/jackpot'); return data; },
    refetchInterval: 30000,
    staleTime: 30000,
  });

  if (!data) return null;

  const sortedTiers = [...(data.tiers ?? [])].sort((a, b) => a.minAmount - b.minAmount);
  const maxAmount = sortedTiers.length ? sortedTiers[sortedTiers.length - 1].minAmount * 1.5 : 100000;
  const pct = Math.min(100, Math.round((data.currentAmount / maxAmount) * 100));

  const lastDraw = data.recentDraws?.[0];
  const deadline = data.deadlineAt ? new Date(data.deadlineAt) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;

  const fillBottom = 280;
  const fillTop = 22;
  const fillRange = fillBottom - fillTop;
  const liquidY = fillBottom - (pct / 100) * fillRange;
  const liquidH = (pct / 100) * fillRange;

  return (
    <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2 hidden xl:flex flex-col items-center select-none" style={{ width: 140 }}>
      <div className="w-full rounded-2xl shadow-xl border border-blue-200 overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #eff6ff 0%, #dbeafe 100%)' }}>

        <div className="px-3 pt-3 pb-1 text-center">
          <p className="text-[11px] font-bold text-blue-700 tracking-wide">감사 펀드 추첨</p>
          <p className="text-[9px] text-blue-400 mt-0.5">매출의 1.5% 자동 적립</p>
        </div>

        {/* 플라스크 SVG */}
        <div className="flex justify-center py-1">
          <svg viewBox="0 0 100 290" width="88" height="255" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="vf-clip">
                <rect x="44" y="20" width="12" height="166" />
                <path d="M 44 185 Q 42 192, 28 204 Q 10 222, 10 246 Q 10 280, 50 280 Q 90 280, 90 246 Q 90 222, 72 204 Q 58 192, 56 185 Z" />
              </clipPath>
              <linearGradient id="vf-liq" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#1d4ed8" stopOpacity="0.82" />
                <stop offset="40%"  stopColor="#3b82f6" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.82" />
              </linearGradient>
              <linearGradient id="vf-shine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"  stopColor="white" stopOpacity="0.0" />
                <stop offset="25%" stopColor="white" stopOpacity="0.22" />
                <stop offset="55%" stopColor="white" stopOpacity="0.04" />
                <stop offset="100%" stopColor="white" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <rect x="40" y="4" width="20" height="9" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <rect x="43" y="6" width="8" height="3" rx="1.5" fill="white" opacity="0.55" />

            <rect x="44" y="19" width="12" height="167" fill="#dbeafe" fillOpacity="0.45" />
            <path d="M 44 185 Q 42 192, 28 204 Q 10 222, 10 246 Q 10 280, 50 280 Q 90 280, 90 246 Q 90 222, 72 204 Q 58 192, 56 185 Z" fill="#dbeafe" fillOpacity="0.5" />

            <rect x="0" y={liquidY} width="100" height={liquidH + 6} fill="url(#vf-liq)" clipPath="url(#vf-clip)" className="transition-all duration-1000" />

            {pct > 1 && (
              <ellipse cx="50" cy={liquidY} rx={liquidY > 185 ? 6 : 30} ry="3.5" fill="#60a5fa" opacity="0.75" clipPath="url(#vf-clip)" className="transition-all duration-1000" />
            )}
            {pct > 10 && (
              <>
                <circle cx="47" cy={Math.min(Math.max(liquidY + 20, 200), 265)} r="2.5" fill="white" opacity="0.35" clipPath="url(#vf-clip)">
                  <animateTransform attributeName="transform" type="translate" values="0,0;0,-18;0,0" dur="2.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="54" cy={Math.min(Math.max(liquidY + 35, 220), 270)} r="1.8" fill="white" opacity="0.28" clipPath="url(#vf-clip)">
                  <animateTransform attributeName="transform" type="translate" values="0,0;0,-14;0,0" dur="3.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            <rect x="44" y="19" width="12" height="167" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 44 185 Q 42 192, 28 204 Q 10 222, 10 246 Q 10 280, 50 280 Q 90 280, 90 246 Q 90 222, 72 204 Q 58 192, 56 185" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
            <rect x="46" y="20" width="4" height="162" fill="url(#vf-shine)" rx="2" />
          </svg>
        </div>

        {/* 현재 금액 */}
        <div className="px-3 pb-2 text-center">
          <p className="text-[15px] font-bold text-blue-700">{formatPrice(data.currentAmount)}</p>
          <div className="mt-1 h-1.5 rounded-full bg-blue-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* 현재 상품 */}
        {data.currentPrize && (
          <div className="border-t border-blue-100 bg-white/60 px-3 py-2 text-center">
            <p className="text-[9px] text-blue-400">🎁 현재 추첨 상품</p>
            <p className="text-[11px] font-bold text-blue-700 mt-0.5 truncate">{data.currentPrize.prizeName}</p>
          </div>
        )}

        {/* 마감일 */}
        {deadline && daysLeft !== null && daysLeft >= 0 && (
          <div className={`border-t px-3 py-2 text-center ${daysLeft <= 3 ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}>
            <p className={`text-[9px] font-medium ${daysLeft <= 3 ? 'text-red-500' : 'text-yellow-600'}`}>
              ⏰ 응모 마감 {daysLeft === 0 ? '오늘!' : `D-${daysLeft}`}
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5">{deadline.toLocaleDateString('ko-KR')}</p>
          </div>
        )}

        {/* 응모 인원 */}
        <div className="border-t border-blue-100 bg-white/40 px-3 py-2 text-center">
          <p className="text-[9px] text-gray-400">현재 응모 <span className="font-bold text-blue-600">{data.entryCount}명</span></p>
        </div>

        {/* 응모 버튼 */}
        <div className="px-3 pb-3 pt-1">
          <Link href="/my/raffle" className="block w-full rounded-lg bg-blue-600 py-1.5 text-center text-[10px] font-bold text-white hover:bg-blue-700">
            🎟️ 응모하기
          </Link>
        </div>

        {/* 최근 당첨 */}
        {lastDraw && (
          <div className="border-t border-blue-100 bg-white/50 px-3 py-2 text-center">
            <p className="text-[9px] font-semibold text-green-600">🎉 최근 당첨</p>
            <p className="text-[9px] text-gray-500 mt-0.5 truncate">{lastDraw.prizeName}</p>
            <p className="text-[9px] text-gray-400">{lastDraw.winnerMaskedName} · {new Date(lastDraw.drawnAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</p>
          </div>
        )}
      </div>
    </div>
  );
}
