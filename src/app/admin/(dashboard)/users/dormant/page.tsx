'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { Search, Clock } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastLoginAt: string | null;
  createdAt: string;
  group?: { name: string };
}

const MONTH_OPTIONS = [3, 6, 12, 24];

export default function DormantUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    adminApi
      .get('/admin/users/dormant', { params: { page, limit, months, search: query || undefined } })
      .then(({ data }) => {
        setUsers(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, query, months]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600 text-sm">← 회원 관리</Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Clock size={20} className="text-orange-400" />
          휴면 회원 관리
        </h1>
        <span className="ml-auto text-sm text-gray-500">총 {total.toLocaleString()}명</span>
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
          value={months}
          onChange={(e) => { setMonths(Number(e.target.value)); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          {MONTH_OPTIONS.map((m) => (
            <option key={m} value={m}>{m}개월 이상 미접속</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">회원</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">그룹</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">마지막 접속</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">가입일</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">상세</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">불러오는 중...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">해당 조건의 휴면 회원이 없습니다</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.group?.name ?? '일반'}</td>
                  <td className="px-4 py-3 text-orange-500">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString('ko-KR')
                      : <span className="text-gray-300">접속 기록 없음</span>
                    }
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
