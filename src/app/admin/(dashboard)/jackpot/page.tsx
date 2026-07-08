'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '@/lib/admin-api';
import { Ticket, Trophy, Gift, Trash2, Plus, RefreshCw, Users, Calendar, AlertCircle, Upload, Heart, RotateCcw, Building2 } from 'lucide-react';
import { formatPrice, formatWise } from '@/lib/utils';

interface Tier { id: string; minAmount: number; prizeName: string; prizeDescription?: string; prizeImageUrl?: string; sortOrder: number }
interface Draw {
  id: string; drawnAt: string; totalAmount: number;
  winnerType?: 'PERSONAL' | 'INSTITUTION';
  prizeName?: string; winnerMaskedName?: string;
  winnerInstitutionMaskedName?: string; pointsPerWinner?: number;
  totalTickets?: number; winnerTicketIndex?: number; seed?: string;
}
interface DrawVerification { recomputedTotalTickets: number; recomputedWinnerIndex: number | null; matches: boolean }
interface Pool { currentAmount: number; status: 'OPEN' | 'CLOSED' | 'DRAWN'; deadlineAt: string | null; periodStartedAt: string }
interface Entry {
  id: string; ticketCount: number; appliedAt: string;
  user: { name: string; email: string };
  institutionId?: string;
  institution?: { name: string };
}
interface Certificate { id: string; orgName: string; amount: number; certificateDate: string; imageBase64: string | null; note: string | null }

type Tab = 'draw' | 'tiers' | 'history' | 'donations';

export default function JackpotAdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('draw');

  // 추첨 관리
  const [deadline, setDeadline] = useState('');
  const [drawConfirm, setDrawConfirm] = useState(false);
  const [drawResult, setDrawResult] = useState<Draw | null>(null);

  // 구간 설정
  const [editTier, setEditTier] = useState<Partial<Tier> | null>(null);

  // 추첨 검증
  const [verifyResults, setVerifyResults] = useState<Record<string, DrawVerification | 'loading' | 'error'>>({});

  // 기부 증서
  const [certForm, setCertForm] = useState({ orgName: '', amount: '', certificateDate: '', note: '' });
  const [certImage, setCertImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── 쿼리 ───────────────────────────────────────────────────────────────

  const { data: status, isLoading: statusLoading } = useQuery<{ pool: Pool; tiers: Tier[]; currentPrize: Tier | null; entryCount: number; recentDraws: Draw[] }>({
    queryKey: ['admin-jackpot-status'],
    queryFn: async () => { const { data } = await adminApi.get('/jackpot'); return data; },
    refetchInterval: 10000,
  });

  const { data: entriesData } = useQuery<{ pool: Pool; entries: Entry[] }>({
    queryKey: ['admin-jackpot-entries'],
    queryFn: async () => { const { data } = await adminApi.get('/jackpot/admin/entries'); return data; },
    enabled: tab === 'draw',
  });

  const { data: tiers = [] } = useQuery<Tier[]>({
    queryKey: ['jackpot-tiers'],
    queryFn: async () => { const { data } = await adminApi.get('/jackpot/tiers'); return data; },
    enabled: tab === 'tiers',
  });

  const { data: drawHistory = [] } = useQuery<Draw[]>({
    queryKey: ['admin-jackpot-history'],
    queryFn: async () => { const { data } = await adminApi.get('/jackpot/admin/history'); return data; },
    enabled: tab === 'history',
  });

  const { data: certs = [] } = useQuery<Certificate[]>({
    queryKey: ['admin-jackpot-certs'],
    queryFn: async () => { const { data } = await adminApi.get('/jackpot/certificates'); return data; },
    enabled: tab === 'donations',
  });

  // ─── 뮤테이션 ────────────────────────────────────────────────────────────

  const setDeadlineMut = useMutation({
    mutationFn: () => adminApi.post('/jackpot/admin/deadline', { deadlineAt: deadline }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-jackpot-status'] }); alert('마감일이 설정됐습니다.'); },
  });

  const closeMut = useMutation({
    mutationFn: () => adminApi.post('/jackpot/admin/close'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-jackpot-status'] }); },
  });

  const drawMut = useMutation({
    mutationFn: () => adminApi.post('/jackpot/admin/draw'),
    onSuccess: ({ data }) => {
      setDrawResult(data);
      setDrawConfirm(false);
      qc.invalidateQueries({ queryKey: ['admin-jackpot-status'] });
      qc.invalidateQueries({ queryKey: ['admin-jackpot-entries'] });
    },
  });

  const saveTierMut = useMutation({
    mutationFn: (tier: Partial<Tier>) => tier.id
      ? adminApi.put(`/jackpot/admin/tiers/${tier.id}`, tier)
      : adminApi.post('/jackpot/admin/tiers', tier),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jackpot-tiers'] }); setEditTier(null); },
  });

  const deleteTierMut = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/jackpot/admin/tiers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jackpot-tiers'] }),
  });

  const saveCertMut = useMutation({
    mutationFn: () => adminApi.post('/jackpot/admin/certificates', { ...certForm, amount: Number(certForm.amount), imageBase64: certImage }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-jackpot-certs'] }); setCertForm({ orgName: '', amount: '', certificateDate: '', note: '' }); setCertImage(null); },
  });

  const deleteCertMut = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/jackpot/admin/certificates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-jackpot-certs'] }),
  });

  const pool = status?.pool;
  const currentPrize = status?.currentPrize;
  const sortedTiers = [...(status?.tiers ?? [])].sort((a, b) => a.minAmount - b.minAmount);
  const tiersLocked = pool ? pool.status !== 'OPEN' : false;

  async function handleVerify(drawId: string) {
    setVerifyResults((prev) => ({ ...prev, [drawId]: 'loading' }));
    try {
      const { data } = await adminApi.get(`/jackpot/admin/draws/${drawId}/verify`);
      setVerifyResults((prev) => ({ ...prev, [drawId]: data }));
    } catch {
      setVerifyResults((prev) => ({ ...prev, [drawId]: 'error' }));
    }
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">감사 펀드 관리</h1>
        {pool && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2">
            <span className="text-sm text-blue-600">현재 펀드</span>
            <span className="text-lg font-bold text-blue-700">{formatPrice(pool.currentAmount)}</span>
            {currentPrize && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                🎁 {currentPrize.prizeName}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              pool.status === 'OPEN' ? 'bg-green-100 text-green-700' :
              pool.status === 'CLOSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {pool.status === 'OPEN' ? '응모 중' : pool.status === 'CLOSED' ? '응모 마감' : '추첨 완료'}
            </span>
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        <button className={tabClass('draw')} onClick={() => setTab('draw')}><Ticket className="inline h-4 w-4 mr-1" />추첨 관리</button>
        <button className={tabClass('tiers')} onClick={() => setTab('tiers')}><Gift className="inline h-4 w-4 mr-1" />상품 구간</button>
        <button className={tabClass('history')} onClick={() => setTab('history')}><Trophy className="inline h-4 w-4 mr-1" />추첨 이력</button>
        <button className={tabClass('donations')} onClick={() => setTab('donations')}><Heart className="inline h-4 w-4 mr-1" />기부 증서</button>
      </div>

      {/* ── 추첨 관리 탭 ── */}
      {tab === 'draw' && (
        <div className="space-y-4">
          {/* 마감일 설정 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-800 flex items-center gap-2"><Calendar className="h-4 w-4" />응모 마감일 설정</h2>
            <p className="mb-3 text-sm text-gray-500">설정하면 메인 페이지에 마감일이 표시됩니다.</p>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                onClick={() => setDeadlineMut.mutate()}
                disabled={!deadline || setDeadlineMut.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                설정
              </button>
            </div>
            {pool?.deadlineAt && (
              <p className="mt-2 text-xs text-gray-400">
                현재 마감일: {new Date(pool.deadlineAt).toLocaleString('ko-KR')}
              </p>
            )}
          </div>

          {/* 응모 현황 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Users className="h-4 w-4" />응모 현황
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{entriesData?.entries?.length ?? 0}명 응모</span>
              </h2>
              {pool?.status === 'OPEN' && (
                <button
                  onClick={() => { if (confirm('응모를 마감하시겠습니까?')) closeMut.mutate(); }}
                  className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
                >
                  응모 마감 처리
                </button>
              )}
            </div>

            {entriesData?.entries?.length === 0 ? (
              <p className="text-sm text-gray-400">아직 응모자가 없습니다.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500">
                    <tr>
                      <th className="pb-2 text-left">구분</th>
                      <th className="pb-2 text-left">회원 / 기관</th>
                      <th className="pb-2 text-center">응모권</th>
                      <th className="pb-2 text-right">응모일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {entriesData?.entries?.map((e) => (
                      <tr key={e.id}>
                        <td className="py-1.5">
                          {e.institutionId ? (
                            <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                              <Building2 className="h-3 w-3" />기관
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">개인</span>
                          )}
                        </td>
                        <td className="py-1.5">
                          <p className="font-medium text-gray-800">{e.institutionId ? (e.institution?.name ?? '기관') : e.user?.name}</p>
                          <p className="text-xs text-gray-400">{e.institutionId ? `대표 응모: ${e.user?.name}` : e.user?.email}</p>
                        </td>
                        <td className="py-1.5 text-center">
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">{e.ticketCount}장</span>
                        </td>
                        <td className="py-1.5 text-right text-xs text-gray-400">
                          {new Date(e.appliedAt).toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 추첨 실행 */}
          <div className="rounded-xl border border-red-100 bg-red-50 p-5">
            <h2 className="mb-2 font-semibold text-red-800 flex items-center gap-2"><Trophy className="h-4 w-4" />추첨 실행</h2>
            <p className="mb-3 text-sm text-red-600">추첨 후 펀드는 0원으로 리셋되고, 모든 응모권이 초기화됩니다.</p>
            {!drawConfirm ? (
              <button
                onClick={() => setDrawConfirm(true)}
                disabled={!entriesData?.entries?.length}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                추첨하기
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => drawMut.mutate()}
                  disabled={drawMut.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
                >
                  {drawMut.isPending ? '추첨 중...' : '⚠️ 확인 — 지금 추첨'}
                </button>
                <button onClick={() => setDrawConfirm(false)} className="rounded-lg border px-4 py-2 text-sm">취소</button>
              </div>
            )}
          </div>

          {/* 추첨 결과 */}
          {drawResult && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
              <Trophy className="mx-auto mb-2 h-10 w-10 text-yellow-500" />
              <h3 className="text-lg font-bold text-green-800">🎉 추첨 완료!</h3>
              {drawResult.winnerType === 'INSTITUTION' ? (
                <>
                  <p className="mt-1 text-sm text-green-700">
                    기관 당첨: <strong>{drawResult.winnerInstitutionMaskedName}</strong>
                  </p>
                  <p className="text-sm text-green-600">지급 포인트: {formatWise(drawResult.pointsPerWinner ?? drawResult.totalAmount)}</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-green-700">당첨자: <strong>{drawResult.winnerMaskedName}</strong></p>
                  {drawResult.prizeName && <p className="text-sm text-green-600">상품: {drawResult.prizeName}</p>}
                </>
              )}
              <p className="mt-1 text-xs text-green-500">펀드 및 응모권이 초기화됐습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* ── 상품 구간 탭 ── */}
      {tab === 'tiers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">금액 구간마다 상품을 등록하세요. 펀드 금액에 따라 자동으로 상품이 결정됩니다.</p>
            <button
              onClick={() => setEditTier({ minAmount: 0, prizeName: '', prizeDescription: '', prizeImageUrl: '' })}
              disabled={tiersLocked}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> 구간 추가
            </button>
          </div>

          {tiersLocked && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              응모가 마감된 회차는 추첨 직전/직후 상품이 바뀌는 걸 막기 위해 상품 구간을 변경할 수 없습니다. 다음 회차가 시작되면 다시 편집할 수 있습니다.
            </div>
          )}

          {/* 편집 폼 */}
          {editTier && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-3 font-semibold text-blue-800">{editTier.id ? '구간 수정' : '새 구간 추가'}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">최소 금액 (원) *</label>
                  <input
                    type="number"
                    value={editTier.minAmount ?? ''}
                    onChange={(e) => setEditTier({ ...editTier, minAmount: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">상품명 *</label>
                  <input
                    value={editTier.prizeName ?? ''}
                    onChange={(e) => setEditTier({ ...editTier, prizeName: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="기계식 키보드"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">설명</label>
                  <input
                    value={editTier.prizeDescription ?? ''}
                    onChange={(e) => setEditTier({ ...editTier, prizeDescription: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="레오폴드 FC900R (시가 15만원)"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">이미지 URL</label>
                  <input
                    value={editTier.prizeImageUrl ?? ''}
                    onChange={(e) => setEditTier({ ...editTier, prizeImageUrl: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => saveTierMut.mutate(editTier)}
                  disabled={!editTier.prizeName || saveTierMut.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  저장
                </button>
                <button onClick={() => setEditTier(null)} className="rounded-lg border px-4 py-2 text-sm">취소</button>
              </div>
            </div>
          )}

          {/* 구간 목록 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">최소 금액</th>
                  <th className="px-4 py-3 text-left">상품명</th>
                  <th className="px-4 py-3 text-left">설명</th>
                  <th className="px-4 py-3 text-center">이미지</th>
                  <th className="px-4 py-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...tiers].sort((a, b) => a.minAmount - b.minAmount).map((tier) => (
                  <tr key={tier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-blue-600">{formatPrice(tier.minAmount)}</td>
                    <td className="px-4 py-3 font-medium">{tier.prizeName}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{tier.prizeDescription ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {tier.prizeImageUrl
                        ? <img src={tier.prizeImageUrl} alt="" className="mx-auto h-8 w-8 rounded object-cover" />
                        : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => setEditTier(tier)}
                          disabled={tiersLocked}
                          className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => { if (confirm('삭제하시겠습니까?')) deleteTierMut.mutate(tier.id); }}
                          disabled={tiersLocked}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tiers.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">등록된 구간이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 추첨 이력 탭 ── */}
      {tab === 'history' && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">추첨일</th>
                <th className="px-4 py-3 text-left">상품</th>
                <th className="px-4 py-3 text-right">펀드 금액</th>
                <th className="px-4 py-3 text-center">당첨자</th>
                <th className="px-4 py-3 text-center">검증</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drawHistory.map((d) => {
                const result = verifyResults[d.id];
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{new Date(d.drawnAt).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-3 font-medium">
                      {d.winnerType === 'INSTITUTION' ? (
                        <span className="inline-flex items-center gap-1 text-indigo-600">
                          <Building2 className="h-3.5 w-3.5" />기관 포인트 {formatWise(d.pointsPerWinner ?? d.totalAmount)}
                        </span>
                      ) : (d.prizeName ?? '-')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">{formatPrice(d.totalAmount)}</td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {d.winnerType === 'INSTITUTION' ? (d.winnerInstitutionMaskedName ?? '-') : (d.winnerMaskedName ?? '-')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!d.seed ? (
                        <span className="text-xs text-gray-300">검증데이터 없음</span>
                      ) : !result ? (
                        <button onClick={() => handleVerify(d.id)} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">
                          재계산
                        </button>
                      ) : result === 'loading' ? (
                        <span className="text-xs text-gray-400">계산 중...</span>
                      ) : result === 'error' ? (
                        <span className="text-xs text-red-500">오류</span>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${result.matches ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {result.matches ? '✓ 일치' : '✗ 불일치'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {drawHistory.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">추첨 이력이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 기부 증서 탭 ── */}
      {tab === 'donations' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-800">기부 증서 등록</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">기관명 *</label>
                <input value={certForm.orgName} onChange={(e) => setCertForm({ ...certForm, orgName: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">금액 *</label>
                <input type="number" value={certForm.amount} onChange={(e) => setCertForm({ ...certForm, amount: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">기부일 *</label>
                <input type="date" value={certForm.certificateDate} onChange={(e) => setCertForm({ ...certForm, certificateDate: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">비고</label>
                <input value={certForm.note} onChange={(e) => setCertForm({ ...certForm, note: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-3">
              <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const r = new FileReader(); r.onload = (ev) => setCertImage(ev.target?.result as string); r.readAsDataURL(f);
              }} />
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                <Upload className="h-4 w-4" /> {certImage ? '이미지 변경' : '이미지 업로드'}
              </button>
              {certImage && <img src={certImage} alt="" className="mt-2 h-20 rounded object-cover" />}
            </div>
            <button
              onClick={() => saveCertMut.mutate()}
              disabled={!certForm.orgName || !certForm.amount || !certForm.certificateDate || saveCertMut.isPending}
              className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              등록
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">기관명</th>
                  <th className="px-4 py-3 text-right">금액</th>
                  <th className="px-4 py-3 text-center">기부일</th>
                  <th className="px-4 py-3 text-center">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {certs.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">{c.orgName}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(c.amount)}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{new Date(c.certificateDate).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { if (confirm('삭제?')) deleteCertMut.mutate(c.id); }} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
