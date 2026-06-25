'use client';

import { useEffect, useState } from 'react';
import { Building2, ChevronDown, ChevronRight, Users, Coins } from 'lucide-react';
import adminApi from '@/lib/admin-api';

interface Institution {
  id: string;
  name: string;
  department?: string;
  emailDomain?: string;
  businessNumber?: string;
  pointBalance: number;
  memberCount: number;
  createdAt: string;
}

interface Member {
  id: string;
  role: 'admin' | 'member';
  status: 'pending' | 'active' | 'rejected';
  joinedAt: string;
  user: { name: string; email: string };
}

const STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  active: '활성',
  rejected: '거절',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-500',
};

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [membersLoading, setMembersLoading] = useState<string | null>(null);

  useEffect(() => {
    adminApi.get('/admin/institutions').then(({ data }) => {
      setInstitutions(data);
    }).finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (members[id]) return;
    setMembersLoading(id);
    try {
      const { data } = await adminApi.get(`/admin/institutions/${id}`);
      setMembers((prev) => ({ ...prev, [id]: data.members }));
    } finally {
      setMembersLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Building2 className="h-5 w-5 text-indigo-600" />
        <h1 className="text-xl font-bold text-gray-900">기관 관리</h1>
        <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
          {institutions.length}개 기관
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">불러오는 중...</div>
      ) : institutions.length === 0 ? (
        <div className="py-16 text-center text-gray-400">등록된 기관이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {institutions.map((inst) => (
            <div key={inst.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* 기관 헤더 행 */}
              <button
                onClick={() => toggleExpand(inst.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{inst.name}</p>
                  <p className="text-xs text-gray-400">
                    {inst.department && `${inst.department} · `}
                    {inst.emailDomain ?? inst.businessNumber ?? '도메인 없음'}
                  </p>
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      <span>{inst.memberCount}명</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-indigo-600 font-semibold">
                      <Coins className="h-3.5 w-3.5" />
                      <span>{inst.pointBalance.toLocaleString()}W</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(inst.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  {expanded === inst.id
                    ? <ChevronDown className="h-4 w-4 text-gray-400" />
                    : <ChevronRight className="h-4 w-4 text-gray-400" />
                  }
                </div>
              </button>

              {/* 펼쳐진 멤버 목록 */}
              {expanded === inst.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                  {membersLoading === inst.id ? (
                    <p className="py-4 text-center text-sm text-gray-400">멤버 불러오는 중...</p>
                  ) : !members[inst.id]?.length ? (
                    <p className="py-4 text-center text-sm text-gray-400">멤버가 없습니다.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
                          <th className="pb-2 font-medium">이름</th>
                          <th className="pb-2 font-medium">이메일</th>
                          <th className="pb-2 font-medium">역할</th>
                          <th className="pb-2 font-medium">상태</th>
                          <th className="pb-2 font-medium">가입일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members[inst.id].map((m) => (
                          <tr key={m.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 font-medium text-gray-800">{m.user.name}</td>
                            <td className="py-2 text-gray-500">{m.user.email}</td>
                            <td className="py-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {m.role === 'admin' ? '관리자' : '멤버'}
                              </span>
                            </td>
                            <td className="py-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                                {STATUS_LABELS[m.status]}
                              </span>
                            </td>
                            <td className="py-2 text-gray-400 text-xs">
                              {new Date(m.joinedAt).toLocaleDateString('ko-KR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
