'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Pin, Eye, ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });

interface Post {
  id: string; title: string; content: string; isSecret: boolean;
  isAnswered: boolean; isPinned: boolean; viewCount: number; createdAt: string;
  user?: { id: string; name: string };
  replies?: { id: string; content: string; createdAt: string; user: { name: string } | null }[];
}
interface Board { id: string; name: string; slug: string; type: string; requiresLogin: boolean }

const PAGE_SIZE = 20;

export default function BoardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const { data: board } = useQuery<Board>({
    queryKey: ['board', slug],
    queryFn: async () => { const { data } = await api.get(`/boards/${slug}`); return data; },
  });

  const { data: postsData, isLoading } = useQuery<{ items: Post[]; total: number }>({
    queryKey: ['board-posts', slug, page],
    queryFn: async () => {
      const { data } = await api.get(`/boards/${board!.id}/posts`, { params: { page, limit: PAGE_SIZE } });
      return data;
    },
    enabled: !!board,
  });

  const createPost = useMutation({
    mutationFn: () => api.post(`/boards/${board!.id}/posts`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board-posts', slug] });
      setShowWrite(false);
      setForm({ title: '', content: '' });
    },
  });

  async function openPost(post: Post) {
    const { data } = await api.get(`/boards/${board!.id}/posts/${post.id}`);
    setSelectedPost(data);
  }

  const posts = postsData?.items ?? [];
  const total = postsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{board?.name ?? '게시판'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">총 {total}개의 글</p>
        </div>
        {user && (
          <button
            onClick={() => setShowWrite(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Pencil size={14} /> 글쓰기
          </button>
        )}
      </div>

      {/* 글쓰기 폼 */}
      {showWrite && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">새 글 작성</h2>
            <button onClick={() => setShowWrite(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="제목을 입력하세요"
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mb-3">
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              placeholder="내용을 입력하세요"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createPost.mutate()}
              disabled={!form.title.trim() || !form.content || form.content === '<p></p>' || createPost.isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createPost.isPending ? '등록 중...' : '등록'}
            </button>
            <button onClick={() => setShowWrite(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              취소
            </button>
          </div>
        </div>
      )}

      {/* 게시글 목록 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="space-y-3 p-4">{[1,2,3].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />)}</div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">첫 번째 글을 작성해보세요!</div>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {posts.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 cursor-pointer ${p.isPinned ? 'bg-blue-50' : ''}`}
                  onClick={() => openPost(p)}>
                  <td className="w-8 px-4 py-3 text-center">
                    {p.isPinned && <Pin size={12} className="text-blue-500 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.isSecret && <span className="mr-1 text-xs text-orange-500">[비밀]</span>}
                    {p.title}
                    {(p.replies?.length ?? 0) > 0 && (
                      <span className="ml-1.5 text-xs text-blue-500 font-normal">[{p.replies!.length}]</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {p.user?.name ?? '익명'}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1 text-xs text-gray-400">
                      <Eye size={12} />{p.viewCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-8 w-8 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 게시글 상세 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedPost(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <h2 className="font-semibold text-gray-900">{selectedPost.title}</h2>
              <button onClick={() => setSelectedPost(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5">
              <p className="mb-4 text-xs text-gray-400">
                {selectedPost.user?.name ?? '익명'} · {formatDateTime(selectedPost.createdAt)} · 조회 {selectedPost.viewCount}
              </p>
              <div
                className="rich-content prose prose-sm max-w-none text-gray-700 mb-6"
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />

              {(selectedPost.replies?.length ?? 0) > 0 && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500">댓글 {selectedPost.replies!.length}개</p>
                  {selectedPost.replies!.map((r) => (
                    <div key={r.id} className="rounded-lg bg-blue-50 px-4 py-3">
                      <p className="mb-1 text-xs font-medium text-blue-600">
                        {r.user?.name ?? '관리자'}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
