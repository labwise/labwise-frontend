'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { Plus, Pencil, Trash2, MessageSquare } from 'lucide-react';

interface Category { id: string; name: string }
interface Board {
  id: string; name: string; slug: string; type: string;
  isPublic: boolean; requiresLogin: boolean; isActive: boolean;
  category?: { id: string; name: string };
}

const TYPE_LABELS: Record<string, string> = {
  NOTICE: '공지사항',
  GENERAL: '일반 게시판',
  GALLERY: '갤러리형',
  QNA: '1:1문의 (시스템)',
  FREE: '자유게시판 (레거시)',
  PRODUCT_QNA: '상품Q&A (레거시)',
};
const TYPE_COLORS: Record<string, string> = {
  NOTICE: 'bg-blue-100 text-blue-700',
  GENERAL: 'bg-gray-100 text-gray-700',
  GALLERY: 'bg-purple-100 text-purple-700',
  QNA: 'bg-amber-100 text-amber-700',
  FREE: 'bg-gray-100 text-gray-500',
  PRODUCT_QNA: 'bg-green-100 text-green-700',
};

// 어드민이 직접 생성할 수 있는 유형 (QNA/FREE/PRODUCT_QNA는 시스템/레거시)
const CREATABLE_TYPES = [
  { value: 'NOTICE', label: '공지사항' },
  { value: 'GENERAL', label: '일반 게시판' },
  { value: 'GALLERY', label: '갤러리형 (이미지 나열)' },
];

const INIT_FORM = { name: '', slug: '', type: 'GENERAL', categoryId: '', isPublic: true, requiresLogin: false };

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...INIT_FORM });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      adminApi.get('/admin/boards'),
      adminApi.get('/admin/categories').catch(() => ({ data: { items: [] } })),
    ]).then(([bRes, cRes]) => {
      setBoards(bRes.data ?? []);
      setCategories(cRes.data?.items ?? cRes.data ?? []);
    });
  };

  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, categoryId: form.categoryId || undefined };
      if (editId) {
        await adminApi.put(`/admin/boards/${editId}`, payload);
      } else {
        await adminApi.post('/admin/boards', payload);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ ...INIT_FORM });
      load();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(b: Board) {
    setForm({ name: b.name, slug: b.slug, type: b.type, categoryId: b.category?.id ?? '', isPublic: b.isPublic, requiresLogin: b.requiresLogin });
    setEditId(b.id);
    setShowForm(true);
  }

  async function del(id: string) {
    if (!confirm('게시판을 비활성화하시겠습니까?')) return;
    await adminApi.delete(`/admin/boards/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">게시판 관리</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ ...INIT_FORM }); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={15} />
          게시판 만들기
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">{editId ? '게시판 수정' : '새 게시판'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">게시판 이름</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="예: 공지사항"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">슬러그 (영문)</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="예: notice"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">게시판 유형</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {CREATABLE_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              <p className="mt-1 text-xs text-gray-400">1:1 문의는 시스템 기본 제공으로 별도 생성 불필요</p>
            </div>
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="rounded" />
                공개 게시판
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.requiresLogin} onChange={(e) => setForm({ ...form, requiresLogin: e.target.checked })} className="rounded" />
                로그인 필요
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
              취소
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">이름</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">슬러그</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">유형</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">카테고리</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">공개</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {boards.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">게시판이 없습니다</td></tr>
            ) : (
              boards.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{b.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[b.type] ?? 'bg-gray-100 text-gray-500'}`}>
                      {TYPE_LABELS[b.type] ?? b.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{b.category?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${b.isPublic ? 'text-green-600' : 'text-gray-400'}`}>
                      {b.isPublic ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <Link href={`/admin/boards/${b.id}`} title="게시글 보기">
                        <MessageSquare size={15} className="text-blue-500 hover:text-blue-700" />
                      </Link>
                      <button onClick={() => startEdit(b)} title="수정">
                        <Pencil size={15} className="text-gray-400 hover:text-gray-600" />
                      </button>
                      <button onClick={() => del(b.id)} title="삭제">
                        <Trash2 size={15} className="text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
