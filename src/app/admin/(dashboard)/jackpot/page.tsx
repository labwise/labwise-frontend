'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '@/lib/admin-api';
import { Beaker, Trophy, AlertCircle, RefreshCw, Heart, Upload, Trash2, RotateCcw, Building2, Calendar } from 'lucide-react';
import { formatWise, formatPrice } from '@/lib/utils';

interface Winner { maskedName: string; pointsAwarded: number; user?: { name: string; email: string } }
interface Draw {
  id: string; drawnAt: string; totalAmount: number;
  winnerCount: number; pointsPerWinner: number;
  winners: Winner[];
}
interface Pool { currentAmount: number; threshold: number; updatedAt: string }
interface Certificate {
  id: string; orgName: string; amount: number;
  certificateDate: string; imageBase64: string | null;
  note: string | null; createdAt: string;
}

type Tab = 'jackpot' | 'donations';

export default function JackpotAdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('jackpot');
  const [drawConfirm, setDrawConfirm] = useState(false);
  const [drawResult, setDrawResult] = useState<Draw | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Certificate form
  const [certForm, setCertForm] = useState({ orgName: '', amount: '', certificateDate: '', note: '' });
  const [certImage, setCertImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<{ pool: Pool; history: Draw[] }>({
    queryKey: ['admin-jackpot'],
    queryFn: async () => { const { data } = await adminApi.get('/admin/jackpot'); return data; },
    refetchInterval: 10000,
  });

  const { data: certs = [], isLoading: certsLoading } = useQuery<Certificate[]>({
    queryKey: ['admin-jackpot-certs'],
    queryFn: async () => { const { data } = await adminApi.get('/admin/jackpot/certificates'); return data; },
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

  const createCert = useMutation({
    mutationFn: () => adminApi.post('/admin/jackpot/certificates', {
      orgName: certForm.orgName,
      amount: Number(certForm.amount),
      certificateDate: certForm.certificateDate,
      imageBase64: certImage ?? undefined,
      note: certForm.note || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-jackpot-certs'] });
      setCertForm({ orgName: '', amount: '', certificateDate: '', note: '' });
      setCertImage(null);
    },
    onError: (e: any) => alert(e.response?.data?.message ?? '등록에 실패했습니다.'),
  });

  const deleteCert = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/admin/jackpot/certificates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-jackpot-certs'] }),
  });

  const resetDonations = useMutation({
    mutationFn: () => adminApi.post('/admin/jackpot/reset-donations'),
    onSuccess: ({ data }) => {
      alert(`완료: ${data.affected}명의 누적 기부금이 초기화되었습니다.`);
      setResetConfirm(false);
    },
    onError: (e: any) => alert(e.response?.data?.message ?? '초기화에 실패했습니다.'),
  });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCertImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  const pool = data?.pool;
  const history = data?.history ?? [];
  const pct = pool ? Math.min(100, Math.round((pool.currentAmount / pool.threshold) * 100)) : 0;

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">연구자 감사 펀드 · 기부 관리</h1>
          <p className="mt-1 text-sm text-gray-500">매출의 1.5%가 감사 펀드로, 1.5%가 기부금으로 적립됩니다.</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit mb-6">
        {([['jackpot', '감사 펀드 추첨', Beaker], ['donations', '기부 증서 관리', Heart]] as [Tab, string, any][]).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── 감사 펀드 탭 ── */}
      {tab === 'jackpot' && (
        <>
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
        </>
      )}

      {/* ── 기부 증서 탭 ── */}
      {tab === 'donations' && (
        <div className="space-y-6">
          {/* 누적 기부금 초기화 */}
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700">누적 기부금 초기화</p>
              <p className="text-xs text-red-500 mt-0.5">기부 증서 등록 후, 전체 회원의 누적 기부금을 0으로 초기화합니다.</p>
            </div>
            {!resetConfirm ? (
              <button
                onClick={() => setResetConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                <RotateCcw size={14} />
                초기화
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">정말 초기화?</span>
                <button
                  onClick={() => resetDonations.mutate()}
                  disabled={resetDonations.isPending}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {resetDonations.isPending && <RefreshCw size={12} className="animate-spin" />}
                  확인
                </button>
                <button onClick={() => setResetConfirm(false)} className="text-xs text-gray-400 hover:underline">취소</button>
              </div>
            )}
          </div>

          {/* 증서 등록 폼 */}
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-5">
            <h2 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
              <Heart size={16} className="text-green-600" />
              기부 증서 등록
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">기부 단체명</label>
                <input
                  type="text"
                  value={certForm.orgName}
                  onChange={e => setCertForm(p => ({ ...p, orgName: e.target.value }))}
                  placeholder="예: 초록우산 어린이재단"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">기부 금액 (원)</label>
                <input
                  type="number"
                  value={certForm.amount}
                  onChange={e => setCertForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="예: 500000"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">기부 일자</label>
                <input
                  type="date"
                  value={certForm.certificateDate}
                  onChange={e => setCertForm(p => ({ ...p, certificateDate: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">비고 (선택)</label>
                <input
                  type="text"
                  value={certForm.note}
                  onChange={e => setCertForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="예: 2024년 하반기 기부"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">기부 증서 이미지 (선택)</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-dashed border-green-300 bg-white px-4 py-2.5 text-sm text-green-700 hover:bg-green-50"
              >
                <Upload size={14} />
                {certImage ? '이미지 변경' : '이미지 업로드'}
              </button>
              {certImage && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={certImage} alt="미리보기" className="h-16 rounded-lg object-contain border border-green-200" />
                  <button onClick={() => setCertImage(null)} className="text-xs text-red-400 hover:underline">제거</button>
                </div>
              )}
            </div>

            <button
              onClick={() => createCert.mutate()}
              disabled={createCert.isPending || !certForm.orgName || !certForm.amount || !certForm.certificateDate}
              className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800 disabled:opacity-50"
            >
              {createCert.isPending && <RefreshCw size={14} className="animate-spin" />}
              증서 등록
            </button>
          </div>

          {/* 등록된 증서 목록 */}
          <div>
            <h2 className="mb-3 font-semibold text-gray-900">등록된 기부 증서</h2>
            {certsLoading ? (
              <p className="text-sm text-gray-400">불러오는 중...</p>
            ) : certs.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-400">
                등록된 기부 증서가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {certs.map((cert) => (
                  <div key={cert.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        {cert.imageBase64 && (
                          <img src={cert.imageBase64} alt="증서" className="h-14 w-14 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Building2 size={13} className="text-green-600" />
                            <p className="font-semibold text-gray-900 text-sm">{cert.orgName}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Calendar size={12} />
                            <span>{cert.certificateDate}</span>
                          </div>
                          {cert.note && <p className="mt-1 text-xs text-gray-500">{cert.note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="font-bold text-green-700">{formatPrice(Number(cert.amount))}</p>
                        <button
                          onClick={() => {
                            if (confirm('삭제하시겠습니까?')) deleteCert.mutate(cert.id);
                          }}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
