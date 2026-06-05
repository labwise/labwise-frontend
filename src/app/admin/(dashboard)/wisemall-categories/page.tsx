'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '@/lib/admin-api';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface WiseMallCategory {
  id: string; name: string; slug: string; sortOrder: number; isActive: boolean;
}

function slugify(t: string) {
  return t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-가-힣]/g, '').replace(/-+/g, '-').trim();
}

const EMPTY = { name: '', slug: '', sortOrder: 0, isActive: true };

export default function WiseMallCategoriesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<WiseMallCategory[]>({
    queryKey: ['wisemall-categories'],
    queryFn: async () => { const { data } = await adminApi.get('/admin/wisemall-categories'); return data; },
  });

  const save = useMutation({
    mutationFn: () => editId
      ? adminApi.put(`/admin/wisemall-categories/${editId}`, form)
      : adminApi.post('/admin/wisemall-categories', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wisemall-categories'] });
      setShowForm(false); setEditId(null); setForm({ ...EMPTY });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/admin/wisemall-categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wisemall-categories'] }); setDeletingId(null); },
  });

  function openEdit(c: WiseMallCategory) {
    setForm({ name: c.name, slug: c.slug, sortOrder: c.sortOrder, isActive: c.isActive });
    setEditId(c.id); setShowForm(true);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">와이즈몰 카테고리</h1>
          <p className="mt-1 text-sm text-gray-500">와이즈몰 전용 카테고리를 관리합니다.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY }); }}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={15} /> 카테고리 추가
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{editId ? '카테고리 수정' : '새 카테고리'}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">이름 *</label>
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: editId ? f.slug : slugify(name) }));
                }}
                placeholder="예: 전자기기, 스마트폰"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">슬러그 (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="electronics"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">정렬 순서</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700">활성화</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => save.mutate()}
              disabled={!form.name.trim() || !form.slug.trim() || save.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Check size={14} />{save.isPending ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="p-4 space-y-3">{[1,2,3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">카테고리명</th>
                <th className="px-4 py-3">슬러그</th>
                <th className="px-4 py-3 text-center">순서</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.slug}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{c.sortOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {c.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600">
                        <Pencil size={14} />
                      </button>
                      {deletingId === c.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => remove.mutate(c.id)} className="text-red-600 font-medium hover:underline">확인</button>
                          <button onClick={() => setDeletingId(null)} className="text-gray-400 hover:underline">취소</button>
                        </span>
                      ) : (
                        <button onClick={() => setDeletingId(c.id)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">카테고리가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
