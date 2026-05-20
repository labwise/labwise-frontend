'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { Search, Trophy, UserX, Clock } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '정상', DORMANT: '휴면', SUSPENDED: '정지', WITHDRAWN: '탈퇴',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DORMANT: 'bg-orange-100 text-orange-600',
  SUSPENDED: 'bg-red-100 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-400',
};

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  pointBalance: number;
  createdAt: string;
  group?: { name: string };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [hasPurchase, setHasPurchase] = useState('');
  const [loading, setLoading] = useState(true);

  const limit = 20;

  useEffect(() => {
    setLoading(true);
    adminApi
      .get('/admin/users', {
        params: {
          page,
          limit,
          search: query || undefined,
          status: status || undefined,
          hasPurchase: hasPurchase || undefined,
        },
      })
      .then(({ data }) => {
        setUsers(data.items ?? data);
        setTotal(data.total ?? data.length);
      })
      .finally(() => setLoading(false));
  }, [page, query, status, hasPurchase]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">회원 관리</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/users/top-buyers"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100"
          >
            <Trophy size={13} />
            구매액 상위
          </Link>
          <Link
            href="/admin/users/dormant"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100"
          >
            <Clock size={13} />
            휴면 회원
          </Link>
          <Link
            href="/admin/users/withdrawn"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
          >
            <UserX size={13} />
            탈퇴 회원
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setQuery(search), setPage(1))}
            placeholder="이름, 이메일 검색"
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={hasPurchase}
          onChange={(e) => { setHasPurchase(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">전체 회원</option>
          <option value="true">구매 이력 있음</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">회원</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">그룹</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">와이즈</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">상태</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">가입일</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">상세</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">불러오는 중...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">회원이 없습니다</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.group?.name ?? '일반'}</td>
                  <td className="px-4 py-3 text-right font-medium">{(u.pointBalance ?? 0).toLocaleString()}W</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[u.status] ?? u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/admin/users/${u.id}`} className="text-blue-600 hover:underline text-xs">
                      보기
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
