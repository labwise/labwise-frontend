'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, ChevronDown, ChevronUp, MessageCircle, CheckCircle, Clock, Building2, User } from 'lucide-react';
import { useInstitutionStore } from '@/store/institution.store';

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string } | null;
}

interface Inquiry {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  createdAt: string;
  replies: Reply[];
}

export default function InquiryPage() {
  const qc = useQueryClient();
  const { mode, institution } = useInstitutionStore();
  const isInstitution = mode === 'institution';
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [openId, setOpenId] = useState<string | null>(null);

  // 기관 모드 전환 시 폼 초기화
  const institutionPrefix = isInstitution && institution ? `[${institution.name}] ` : '';

  const { data, isLoading } = useQuery<{ items: Inquiry[]; total: number }>({
    queryKey: ['my-inquiries'],
    queryFn: async () => {
      const { data } = await api.get('/boards/inquiries/mine');
      return data;
    },
  });

  const create = useMutation({
    mutationFn: () => api.post('/boards/inquiries', {
      ...form,
      title: institutionPrefix + form.title,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-inquiries'] });
      setForm({ title: '', content: '' });
      setShowForm(false);
    },
  });

  const inquiries = data?.items ?? [];

  return (
    <div>
      {/* 모드 배너 */}
      <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
        isInstitution ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
      }`}>
        {isInstitution
          ? <><Building2 className="h-4 w-4" /> 기관 문의 — {institution?.name} 이름으로 접수됩니다</>
          : <><User className="h-4 w-4" /> 개인 문의</>
        }
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">1:1 문의</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={15} />
          문의하기
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="mb-4 font-semibold text-gray-800">새 문의 작성</h3>
          <div className="space-y-3">
            {isInstitution && institution && (
              <div className="flex items-center gap-1.5 rounded-lg bg-indigo-100 px-3 py-1.5 text-xs text-indigo-700">
                <Building2 className="h-3.5 w-3.5" />
                제목에 <strong>[{institution.name}]</strong> 가 자동으로 추가됩니다
              </div>
            )}
            <input
              type="text"
              placeholder="문의 제목"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              rows={5}
              placeholder="문의 내용을 자세히 작성해 주세요."
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => create.mutate()}
              disabled={!form.title.trim() || !form.content.trim() || create.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isPending ? '제출 중...' : '제출하기'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ title: '', content: '' }); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">등록된 문의가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inquiries.map((inq) => (
            <div key={inq.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <button
                className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-gray-50"
                onClick={() => setOpenId(openId === inq.id ? null : inq.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {inq.isAnswered ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle size={12} /> 답변 완료
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
                        <Clock size={12} /> 답변 대기
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(inq.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{inq.title}</p>
                </div>
                {openId === inq.id ? (
                  <ChevronUp size={16} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400 shrink-0" />
                )}
              </button>

              {openId === inq.id && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {inq.content}
                  </div>

                  {inq.replies?.length > 0 && (
                    <div className="space-y-2">
                      {inq.replies.map((reply) => (
                        <div key={reply.id} className="ml-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                          <p className="mb-1 text-xs font-semibold text-blue-600">관리자 답변</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(reply.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      ))}
                    </div>
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
