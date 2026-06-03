'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import {
  Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, FolderOpen, Folder, Package, MessageSquare,
} from 'lucide-react';

interface Board { id: string; name: string; slug: string; type: string }
interface Category {
  id: string; name: string; slug: string; parentId: string | null;
  sortOrder: number; isActive: boolean; linkType: 'products' | 'board';
  boardId?: string; board?: Board; children?: Category[];
}

const EMPTY_FORM = {
  name: '', slug: '', parentId: null as string | null,
  sortOrder: 0, isActive: true, linkType: 'products' as 'products' | 'board', boardId: '',
};

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-가-힣]/g, '').replace(/-+/g, '-').trim();
}

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [catRes, boardRes] = await Promise.all([
        adminApi.get('/admin/categories'),
        adminApi.get('/admin/boards').catch(() => ({ data: [] })),
      ]);
      setTree(catRes.data);
      setBoards(boardRes.data ?? []);
      setExpanded(new Set(catRes.data.map((c: Category) => c.id)));
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function openCreate(parentId: string | null = null) {
    setEditing(null);
    setForm({ ...EMPTY_FORM, parentId });
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({
      name: cat.name, slug: cat.slug, parentId: cat.parentId,
      sortOrder: cat.sortOrder, isActive: cat.isActive,
      linkType: cat.linkType ?? 'products', boardId: cat.boardId ?? '',
    });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); }

  async function handleSave() {
    if (!form.name.trim()) return alert('카테고리 이름을 입력하세요.');
    if (!form.slug.trim()) return alert('슬러그를 입력하세요.');
    if (form.linkType === 'board' && !form.boardId) return alert('연결할 게시판을 선택하세요.');
    setSaving(true);
    try {
      const payload = {
        ...form,
        boardId: form.linkType === 'board' ? form.boardId : null,
      };
      if (editing) {
        await adminApi.put(`/admin/categories/${editing.id}`, payload);
      } else {
        await adminApi.post('/admin/categories', payload);
      }
      await load();
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if ((cat.children?.length ?? 0) > 0) {
      setDeleteError('서브 카테고리가 있는 카테고리는 삭제할 수 없습니다. 먼저 서브 카테고리를 삭제해주세요.');
      return;
    }
    setDeleteError('');
    try {
      await adminApi.delete(`/admin/categories/${cat.id}`);
      setDeletingId(null);
      await load();
    } catch (e: any) {
      setDeleteError(e.response?.data?.message ?? '삭제에 실패했습니다. 해당 카테고리에 연결된 상품이 있을 수 있습니다.');
    }
  }

  function CategoryRow({ cat, depth = 0 }: { cat: Category; depth?: number }) {
    const hasChildren = (cat.children?.length ?? 0) > 0;
    const isOpen = expanded.has(cat.id);
    return (
      <>
        <tr className="border-b border-gray-100 hover:bg-gray-50">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
              {hasChildren ? (
                <button onClick={() => toggle(cat.id)} className="text-gray-400 hover:text-gray-600">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : <span className="w-4" />}
              {depth === 0
                ? <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
                : <Folder className="h-4 w-4 text-gray-400 shrink-0" />}
              <span className={`text-sm ${depth === 0 ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                {cat.name}
              </span>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-gray-400 font-mono">{cat.slug}</td>
          <td className="px-4 py-3 text-center">
            {cat.linkType === 'board' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                <MessageSquare className="h-3 w-3" />
                {cat.board?.name ?? '게시판'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                <Package className="h-3 w-3" />
                상품 목록
              </span>
            )}
          </td>
          <td className="px-4 py-3 text-center text-sm text-gray-500">{cat.sortOrder}</td>
          <td className="px-4 py-3 text-center">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {cat.isActive ? '활성' : '비활성'}
            </span>
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              {depth === 0 && (
                <button onClick={() => openCreate(cat.id)} title="서브 카테고리 추가"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => openEdit(cat)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600">
                <Pencil className="h-4 w-4" />
              </button>
              {deletingId === cat.id ? (
                <span className="flex items-center gap-1 text-xs">
                  <button onClick={() => handleDelete(cat)} className="text-red-600 font-medium hover:underline">확인</button>
                  <button onClick={() => { setDeletingId(null); setDeleteError(''); }} className="text-gray-400 hover:underline">취소</button>
                </span>
              ) : (
                <button onClick={() => { setDeletingId(cat.id); setDeleteError(''); }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </td>
        </tr>
        {isOpen && cat.children?.map((child) => <CategoryRow key={child.id} cat={child} depth={depth + 1} />)}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {deleteError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{deleteError}</div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
          <p className="mt-1 text-sm text-gray-500">카테고리 클릭 시 상품 목록 또는 내가 만든 게시판으로 연결할 수 있습니다.</p>
        </div>
        <button onClick={() => openCreate(null)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> 메인 카테고리 추가
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">{[1,2,3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">카테고리명</th>
                <th className="px-4 py-3">슬러그</th>
                <th className="px-4 py-3 text-center">연결 대상</th>
                <th className="px-4 py-3 text-center">순서</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {tree.map((cat) => <CategoryRow key={cat.id} cat={cat} depth={0} />)}
              {tree.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">카테고리가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? '카테고리 수정' : form.parentId ? '서브 카테고리 추가' : '메인 카테고리 추가'}
              </h2>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">이름 <span className="text-red-500">*</span></label>
                <input type="text" value={form.name}
                  onChange={(e) => { const name = e.target.value; setForm((f) => ({ ...f, name, slug: editing ? f.slug : slugify(name) })); }}
                  placeholder="예: 소모품, 피펫류"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">슬러그 <span className="text-red-500">*</span> <span className="text-xs text-gray-400">(URL에 사용)</span></label>
                <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="예: consumables"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none" />
              </div>

              {/* 연결 방식 선택 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">카테고리 클릭 시 연결 대상</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, linkType: 'products', boardId: '' }))}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm transition-colors ${
                      form.linkType === 'products' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    <Package className="h-5 w-5" />
                    <span className="font-medium">상품 목록</span>
                    <span className="text-xs opacity-70">해당 카테고리 상품</span>
                  </button>
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, linkType: 'board' }))}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm transition-colors ${
                      form.linkType === 'board' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-medium">게시판</span>
                    <span className="text-xs opacity-70">내가 만든 게시판</span>
                  </button>
                </div>
              </div>

              {form.linkType === 'board' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">연결할 게시판 <span className="text-red-500">*</span></label>
                  <select value={form.boardId} onChange={(e) => setForm((f) => ({ ...f, boardId: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="">게시판 선택</option>
                    {boards.filter(b => !['QNA','FREE','PRODUCT_QNA'].includes(b.type)).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {boards.filter(b => !['QNA','FREE','PRODUCT_QNA'].includes(b.type)).length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">게시판 관리에서 게시판을 먼저 만들어주세요.</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">정렬 순서</label>
                  <input type="number" value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="h-4 w-4 rounded accent-blue-600" />
                    <span className="text-sm text-gray-700">활성화</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeForm}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">취소</button>
              <button onClick={handleSave} disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
