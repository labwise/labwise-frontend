'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '@/lib/admin-api';
import { CheckCircle, Clock, ChevronDown, ChevronUp, Send } from 'lucide-react';

interface Reply {
  id: string;
  content: string;
  createdAt: string;
}

interface Inquiry {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  replies: Reply[];
}

type StatusFilter = 'all' | 'pending' | 'answered';

export default function AdminInquiriesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<{ items: Inquiry[]; total: number }>({
    queryKey: ['admin-inquiries', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const { data } = await adminApi.get(`/admin/inquiries?${params}`);
      return data;
    },
  });

  const reply = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      adminApi.post(`/admin/posts/${postId}/reply`, { content }),
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ['admin-inquiries'] });
      setReplyText((prev) => ({ ...prev, [postId]: '' }));
    },
  });

  const inquiries = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const pendingCount = inquiries.filter((i) => !i.isAnswered).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">1:1 문의 관리</h1>
          {statusFilter === 'all' && pendingCount > 0 && (
            <p className="mt-1 text-sm text-amber-600">답변 대기 {pendingCount}건</p>
          )}
        </div>

        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(['all', 'pending', 'answered'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' ? '전체' : s === 'pending' ? '미답변' : '답변완료'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          문의가 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {inquiries.map((inq) => (
            <div key={inq.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* 헤더 */}
              <button
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50"
                onClick={() => setOpenId(openId === inq.id ? null : inq.id)}
              >
                <div className="w-5 shrink-0">
                  {inq.isAnswered ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <Clock size={18} className="text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{inq.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inq.user ? `${inq.user.name} (${inq.user.email})` : '탈퇴 회원'} ·{' '}
                    {new Date(inq.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  inq.isAnswered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {inq.isAnswered ? '답변완료' : '미답변'}
                </span>
                {openId === inq.id
                  ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
              </button>

              {/* 상세 */}
              {openId === inq.id && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                  {/* 문의 내용 */}
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {inq.content}
                  </div>

                  {/* 기존 답변들 */}
                  {inq.replies?.length > 0 && (
                    <div className="space-y-2">
                      {inq.replies.map((r) => (
                        <div key={r.id} className="ml-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                          <p className="mb-1 text-xs font-semibold text-blue-600">관리자 답변</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 답변 입력 */}
                  {!inq.isAnswered && (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        placeholder="답변 내용을 입력하세요..."
                        value={replyText[inq.id] ?? ''}
                        onChange={(e) => setReplyText((prev) => ({ ...prev, [inq.id]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <button
                        onClick={() => reply.mutate({ postId: inq.id, content: replyText[inq.id] ?? '' })}
                        disabled={!replyText[inq.id]?.trim() || reply.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Send size={14} />
                        {reply.isPending ? '전송 중...' : '답변 등록'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded text-sm ${
                page === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
