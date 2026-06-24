'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, CheckCircle, XCircle, Coins } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useInstitutionStore } from '@/store/institution.store';
import { formatWise } from '@/lib/utils';

interface Member {
  id: string;
  userId: string;
  role: 'admin' | 'member';
  status: 'pending' | 'active' | 'rejected';
  user: { name: string; email: string };
}

interface LedgerEntry {
  id: string;
  type: 'earn' | 'use';
  amount: number;
  description: string;
  createdAt: string;
}

interface PointData {
  balance: number;
  ledger: LedgerEntry[];
}

export default function InstitutionDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { institution, mode } = useInstitutionStore();
  const [tab, setTab] = useState<'members' | 'points'>('members');
  const [pending, setPending] = useState<Member[]>([]);
  const [active, setActive] = useState<Member[]>([]);
  const [pointData, setPointData] = useState<PointData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (mode !== 'institution') { router.push('/'); return; }
    loadData();
  }, [user, mode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, ptRes] = await Promise.all([
        api.get('/institution/members/pending'),
        api.get('/institution/members/active'),
        api.get('/institution/points'),
      ]);
      setPending(pRes.data);
      setActive(aRes.data);
      setPointData(ptRes.data);
    } catch {
      // 관리자가 아닌 경우 멤버 목록은 실패할 수 있음
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (memberId: string) => {
    await api.patch(`/institution/members/${memberId}/approve`);
    loadData();
  };

  const handleReject = async (memberId: string) => {
    if (!confirm('거절하시겠습니까?')) return;
    await api.patch(`/institution/members/${memberId}/reject`);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        {/* 헤더 */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{institution?.name ?? '기관 대시보드'}</h1>
            <p className="text-sm text-gray-500">기관 포인트 및 멤버 관리</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400">기관 포인트 잔액</p>
            <p className="text-xl font-bold text-indigo-600">{formatWise(pointData?.balance ?? 0)}</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="mb-4 flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setTab('members')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === 'members' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4" />
            멤버 관리
            {pending.length > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('points')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === 'points' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Coins className="h-4 w-4" />
            포인트 내역
          </button>
        </div>

        {tab === 'members' && (
          <div className="space-y-4">
            {/* 승인 대기 */}
            {pending.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h2 className="mb-3 text-sm font-semibold text-amber-800">승인 대기 ({pending.length})</h2>
                <ul className="space-y-2">
                  {pending.map((m) => (
                    <li key={m.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                        <p className="text-xs text-gray-500">{m.user.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(m.id)}
                          className="flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(m.id)}
                          className="flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          거절
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 활성 멤버 */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">활성 멤버 ({active.length})</h2>
              {active.length === 0 ? (
                <p className="text-sm text-gray-400">아직 멤버가 없습니다.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {active.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{m.user.name}</span>
                        <span className="ml-2 text-xs text-gray-500">{m.user.email}</span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {m.role === 'admin' ? '관리자' : '멤버'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === 'points' && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">기관 포인트 내역 (최근 50건)</h2>
            {!pointData?.ledger.length ? (
              <p className="text-sm text-gray-400">포인트 내역이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {pointData.ledger.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm text-gray-800">{entry.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(entry.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${
                      entry.type === 'earn' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {entry.type === 'earn' ? '+' : '-'}{formatWise(entry.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
