'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { Pin, Trash2, MessageCircle, Plus, X } from 'lucide-react';

interface Post {
  id: string; title: string; content: string; isSecret: boolean;
  isAnswered: boolean; isPinned: boolean; viewCount: number; createdAt: string;
  user?: { name: string; email: string };
  replies?: { id: string; content: string; createdAt: string }[];
}
interface Board { id: string; name: string; type: string }

export default function BoardPostsPage() {
  const { id } = useParams<{ id: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', isPinned: false });
  const [posting, setPosting] = useState(false);
  const limit = 20;

  const loadPosts = () => {
    adminApi.get(`/admin/boards/${id}/posts`, { params: { page, limit } })
      .then(({ data }) => { setPosts(data.items ?? []); setTotal(data.total ?? 0); });
  };

  useEffect(() => {
    adminApi.get('/admin/boards').then(({ data }) => {
      const b = (data as Board[]).find((b) => b.id === id);
      setBoard(b ?? null);
    });
    loadPosts();
  }, [id, page]);

  async function openPost(post: Post) {
    const { data } = await adminApi.get(`/admin/posts/${post.id}`);
    setSelectedPost(data);
    setReplyContent('');
  }

  async function sendReply() {
    if (!replyContent.trim() || !selectedPost) return;
    setReplying(true);
    try {
      await adminApi.post(`/admin/posts/${selectedPost.id}/reply`, { content: replyContent });
      setPosts((prev) => prev.map((p) => p.id === selectedPost.id ? { ...p, isAnswered: true } : p));
      setSelectedPost(null);
      setReplyContent('');
    } finally {
      setReplying(false);
    }
  }

  async function togglePin(postId: string) {
    await adminApi.put(`/admin/posts/${postId}/pin`);
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, isPinned: !p.isPinned } : p));
  }

  async function deletePost(postId: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await adminApi.delete(`/admin/posts/${postId}`);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setTotal((t) => t - 1);
  }

  async function createPost() {
    if (!newPost.title || !newPost.content) return;
    setPosting(true);
    try {
      await adminApi.post(`/admin/boards/${id}/posts`, newPost);
      setShowNewPost(false);
      setNewPost({ title: '', content: '', isPinned: false });
      loadPosts();
    } finally {
      setPosting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/boards" className="text-gray-400 hover:text-gray-600 text-sm">← 게시판 목록</Link>
        <h1 className="text-xl font-bold text-gray-900">{board?.name ?? '게시판'}</h1>
        <button onClick={() => setShowNewPost(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={14} /> 글쓰기
        </button>
      </div>

      {showNewPost && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <h2 className="font-semibold mb-3">새 글 작성</h2>
          <input value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            placeholder="제목"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            placeholder="내용" rows={5}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
            <input type="checkbox" checked={newPost.isPinned} onChange={(e) => setNewPost({ ...newPost, isPinned: e.target.checked })} />
            고정글
          </label>
          <div className="flex gap-2">
            <button onClick={createPost} disabled={posting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {posting ? '등록 중...' : '등록'}
            </button>
            <button onClick={() => setShowNewPost(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              취소
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium w-8"></th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">제목</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">작성자</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">답변</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">조회</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">작성일</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">게시글이 없습니다</td></tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${p.isPinned ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    {p.isPinned && <Pin size={12} className="text-blue-500 mx-auto" />}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openPost(p)} className="text-gray-900 hover:text-blue-600 text-left">
                      {p.isSecret && <span className="text-xs text-orange-500 mr-1">[비밀]</span>}
                      {p.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.user?.name ?? '관리자'}</td>
                  <td className="px-4 py-3 text-center">
                    {p.isAnswered
                      ? <span className="text-xs text-green-600 font-medium">완료</span>
                      : <span className="text-xs text-orange-500">대기</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{p.viewCount}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openPost(p)} title="답변">
                        <MessageCircle size={14} className="text-blue-400 hover:text-blue-600" />
                      </button>
                      <button onClick={() => togglePin(p.id)} title="고정">
                        <Pin size={14} className={p.isPinned ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'} />
                      </button>
                      <button onClick={() => deletePost(p.id)} title="삭제">
                        <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                      </button>
                    </div>
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
              className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* 게시글 상세 / 답변 패널 */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{selectedPost.title}</h2>
              <button onClick={() => setSelectedPost(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-400 mb-3">{selectedPost.user?.name} · {new Date(selectedPost.createdAt).toLocaleString('ko-KR')}</p>
              <p className="text-gray-700 whitespace-pre-wrap mb-6">{selectedPost.content}</p>

              {selectedPost.replies && selectedPost.replies.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-xs font-semibold text-blue-600 mb-2">관리자 답변</p>
                  {selectedPost.replies.map((r) => (
                    <p key={r.id} className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</p>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">답변 작성</label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="답변 내용을 입력하세요"
                />
                <button onClick={sendReply} disabled={replying || !replyContent.trim()}
                  className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {replying ? '등록 중...' : '답변 등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
