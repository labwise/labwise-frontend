'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import adminApi from '@/lib/admin-api';

interface Group { id: string; name: string }
interface User {
  id: string; name: string; email: string; phone: string;
  status: string; pointBalance: number; createdAt: string;
  group?: Group; businessName?: string; businessNumber?: string;
}

const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'WITHDRAWN'];
const STATUS_LABELS: Record<string, string> = { ACTIVE: '정상', SUSPENDED: '정지', WITHDRAWN: '탈퇴' };

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [reason, setReason] = useState('');
  const [pointAmount, setPointAmount] = useState('');
  const [pointReason, setPointReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [pointSaving, setPointSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.get(`/admin/users/${id}`),
      adminApi.get('/admin/groups').catch(() => ({ data: [] })),
    ]).then(([userRes, groupRes]) => {
      const u = userRes.data;
      setUser(u);
      setGroupId(u.group?.id ?? '');
      setUserStatus(u.status);
      setGroups(groupRes.data?.items ?? groupRes.data ?? []);
    });
  }, [id]);

  async function handleUserUpdate() {
    setSaving(true);
    try {
      await adminApi.put(`/admin/users/${id}`, {
        groupId: groupId || undefined,
        status: userStatus,
        reason: reason || undefined,
      });
      setMsg('저장되었습니다.');
      setUser((u) => u ? { ...u, status: userStatus } : u);
    } finally {
      setSaving(false);
    }
  }

  async function handlePointAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!pointAmount || !pointReason) return;
    setPointSaving(true);
    try {
      await adminApi.post(`/admin/users/${id}/points`, {
        amount: Number(pointAmount),
        reason: pointReason,
      });
      setMsg(`포인트 ${Number(pointAmount) > 0 ? '+' : ''}${pointAmount}P 조정 완료`);
      setUser((u) => u ? { ...u, pointBalance: (u.pointBalance ?? 0) + Number(pointAmount) } : u);
      setPointAmount('');
      setPointReason('');
    } finally {
      setPointSaving(false);
    }
  }

  if (!user) return <p className="text-gray-400 text-sm">불러오는 중...</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← 뒤로</button>
        <h1 className="text-xl font-bold text-gray-900">회원 상세</h1>
      </div>

      {msg && (
        <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">{msg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">회원 정보</h2>
          <dl className="space-y-3 text-sm">
            {[
              ['이름', user.name], ['이메일', user.email], ['전화번호', user.phone],
              ['사업자명', user.businessName], ['사업자번호', user.businessNumber],
              ['포인트 잔액', `${(user.pointBalance ?? 0).toLocaleString()}P`],
              ['가입일', new Date(user.createdAt).toLocaleString('ko-KR')],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-medium text-gray-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* User Management */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">회원 관리</h2>
            <div className="space-y-3">
              {groups.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">고객 그룹</label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">그룹 없음</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">상태</label>
                <select
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {USER_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">사유</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="정지 사유 등"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleUserUpdate}
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          {/* Point Adjustment */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-1">포인트 조정</h2>
            <p className="text-xs text-gray-400 mb-4">
              현재 잔액: <strong>{(user.pointBalance ?? 0).toLocaleString()}P</strong>
              &nbsp;| 음수 입력 시 차감
            </p>
            <form onSubmit={handlePointAdjust} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">조정 포인트</label>
                <input
                  type="number"
                  value={pointAmount}
                  onChange={(e) => setPointAmount(e.target.value)}
                  placeholder="예: 1000 또는 -500"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">사유</label>
                <input
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  placeholder="이벤트 지급, 오류 수정 등"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={pointSaving}
                className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {pointSaving ? '처리 중...' : '포인트 조정'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
