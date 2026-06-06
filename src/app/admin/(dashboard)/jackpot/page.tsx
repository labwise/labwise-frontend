'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '@/lib/admin-api';
import { Beaker, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import { formatWise } from '@/lib/utils';

interface Winner { maskedName: string; pointsAwarded: number; user?: { name: string; email: string } }
interface Draw {
  id: string; drawnAt: string; totalAmount: number;
  winnerCount: number; pointsPerWinner: number;
  winners: Winner[];
}
interface Pool { currentAmount: number; threshold: number; updatedAt: string }

export default function JackpotAdminPage() {
  const qc = useQueryClient();
  const [drawConfirm, setDrawConfirm] = useState(false);
  const [drawResult, setDrawResult] = useState<Draw | null>(null);

  const { data, isLoading } = useQuery<{ pool: Pool; history: Draw[] }>({
    queryKey: ['admin-jackpot'],
    queryFn: async () => { const { data } = await adminApi.get('/admin/jackpot'); return data; },
    refetchInterval: 10000,
  });

  const draw = useMutation({
    mutationFn: () => adminApi.post('/admin/jackpot/draw'),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['admin-jackpot'] });
      setDrawResult(data);
      setDrawConfirm(false);
    },
    onError: (e: any) => {
      alert(e.response?.data?.message ?? '추첨에 실패했습니다.');
      setDrawConfirm(false);
    },
  });

  const pool = data?.pool;
  const history = data?.history ?? [];
  const pct = pool ? Math.min(100, Math.round((pool.currentAmount / pool.threshold) * 100)) : 0;

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">연구자 감사 펀드</h1>
          <p className="mt-1 text-sm text-gray-500">매출의 1.5%가 자동 적립되며, {formatWise(pool?.threshold ?? 100000)} 달성 시 추첨을 진행합니다.</p>
        </div>
      </div>

      {/* 현재 풀 현황 */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <Beaker className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-sm text-blue-600 font-medium">현재 적립 금액</p>
            <p className="text-3xl font-bold text-blue-800">
              {isLoading ? '...' : formatWise(pool?.currentAmount ?? 0)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-gray-500">목표</p>
            <p className="text-lg font-semibold text-gray-700">{formatWise(pool?.threshold ?? 100000)}</p>
          </div>
        </div>

        {/* 프로그래스바 */}
        <div className="mb-2 h-4 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-blue-500">
          <span>{pct}% 달성</span>
          <span>남은 금액: {formatWise((pool?.threshold ?? 100000) - (pool?.currentAmount ?? 0))}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            <AlertCircle size={14} />
            <span>추첨 시 최근 1년 구매자 중 <strong>10명</strong>에게 각 <strong>10,000W + 와이즈몰 접근권</strong> 지급</span>
          </div>
          {!drawConfirm ? (
            <button
              onClick={() => setDrawConfirm(true)}
              className="ml-4 flex-shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              추첨 실행
            </button>
          ) : (
            <div className="ml-4 flex-shrink-0 flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">정말 진행하시겠습니까?</span>
              <button
                onClick={() => draw.mutate()}
                disabled={draw.isPending}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {draw.isPending && <RefreshCw size={12} className="animate-spin" />}
                확인
              </button>
              <button onClick={() => setDrawConfirm(false)} className="text-xs text-gray-500 hover:underline">취소</button>
            </div>
          )}
        </div>
      </div>

      {/* 방금 실행한 추첨 결과 */}
      {drawResult && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold text-green-800">추첨 완료!</h2>
          </div>
          <p className="mb-3 text-sm text-green-700">
            총 {formatWise(drawResult.totalAmount)}에서 {drawResult.winnerCount}명에게 각 {formatWise(drawResult.pointsPerWinner)} + 와이즈몰 접근권을 지급했습니다.
          </p>
          <div className="grid grid-cols-2 gap-1">
            {drawResult.winners?.map((w, i) => (
              <div key={i} className="rounded-lg bg-white px-3 py-2 text-sm">
                <span className="font-medium text-gray-800">{w.user?.name ?? w.maskedName}</span>
                {w.user?.email && <span className="ml-1 text-xs text-gray-400">({w.user.email})</span>}
                <span className="ml-2 text-blue-600">+{formatWise(w.pointsAwarded)}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setDrawResult(null)} className="mt-3 text-xs text-gray-400 hover:underline">닫기</button>
        </div>
      )}

      {/* 추첨 이력 */}
      <div>
        <h2 className="mb-3 font-semibold text-gray-900">추첨 이력</h2>
        {history.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-400">
            아직 추첨 이력이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((d) => (
              <div key={d.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">
                    {new Date(d.drawnAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatWise(d.totalAmount)} → {d.winnerCount}명 × {formatWise(d.pointsPerWinner)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {d.winners?.map((w, i) => (
                    <span key={i} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">
                      {w.user?.name ?? w.maskedName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
