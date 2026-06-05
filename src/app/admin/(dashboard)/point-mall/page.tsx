'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { Plus, Pencil, Trash2, X, ExternalLink, Tag } from 'lucide-react';
import { formatWise } from '@/lib/utils';

interface WiseMallCategory { id: string; name: string }
interface PointProduct {
  id: string; name: string; brand?: string; wiseMallCategoryId?: string;
  wiseMallCategory?: { id: string; name: string };
  requiredPoints: number; referencePrice?: number;
  stockQuantity: number; isActive: boolean;
  description?: string; externalUrl?: string;
}

const EMPTY = {
  name: '', brand: '', wiseMallCategoryId: '',
  requiredPoints: '', referencePrice: '', stockQuantity: '0',
  description: '', externalUrl: '', isActive: true,
};

export default function PointMallProductsPage() {
  const [products, setProducts] = useState<PointProduct[]>([]);
  const [categories, setCategories] = useState<WiseMallCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      adminApi.get('/admin/point-mall/products', { params: { limit: 100 } }),
      adminApi.get('/admin/wisemall-categories').catch(() => ({ data: [] })),
    ]).then(([pRes, cRes]) => {
      setProducts(pRes.data.items ?? pRes.data);
      setCategories(cRes.data ?? []);
    }).finally(() => setLoading(false));
  }

  useEffect(load, []);

  function f(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openCreate() {
    setEditId(null); setForm({ ...EMPTY }); setError(''); setShowForm(true);
  }

  function openEdit(p: PointProduct) {
    setEditId(p.id);
    setForm({
      name: p.name, brand: p.brand ?? '',
      wiseMallCategoryId: p.wiseMallCategoryId ?? '',
      requiredPoints: String(p.requiredPoints),
      referencePrice: String(p.referencePrice ?? ''),
      stockQuantity: String(p.stockQuantity),
      description: p.description ?? '',
      externalUrl: p.externalUrl ?? '',
      isActive: p.isActive,
    });
    setError(''); setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload = {
        ...form,
        requiredPoints: Number(form.requiredPoints),
        referencePrice: form.referencePrice ? Number(form.referencePrice) : undefined,
        stockQuantity: Number(form.stockQuantity),
        wiseMallCategoryId: form.wiseMallCategoryId || undefined,
        externalUrl: form.externalUrl || undefined,
        brand: form.brand || undefined,
      };
      if (editId) {
        await adminApi.put(`/admin/point-mall/products/${editId}`, payload);
      } else {
        await adminApi.post('/admin/point-mall/products', payload);
      }
      setShowForm(false); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await adminApi.delete(`/admin/point-mall/products/${id}`);
      setDeletingId(null); load();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">와이즈몰 상품 관리</h1>
          <p className="mt-1 text-sm text-gray-500">삼성, LG 등 브랜드 제품을 와이즈 포인트로 교환할 수 있도록 등록합니다.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/wisemall-categories"
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Tag size={14} /> 카테고리 관리
          </Link>
          <Link href="/admin/point-mall/orders"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            주문 관리
          </Link>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus size={15} /> 상품 등록
          </button>
        </div>
      </div>

      {/* 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-semibold text-gray-800">{editId ? '상품 수정' : '상품 등록'}</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            {error && <div className="mx-6 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleSave} className="space-y-3 p-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">상품명 *</label>
                <input value={form.name} onChange={(e) => f('name', e.target.value)} required
                  placeholder="예: 삼성 갤럭시 S25"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">브랜드</label>
                  <input value={form.brand} onChange={(e) => f('brand', e.target.value)}
                    placeholder="예: 삼성, LG, 애플"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">와이즈몰 카테고리</label>
                  <select value={form.wiseMallCategoryId} onChange={(e) => f('wiseMallCategoryId', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">카테고리 없음</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">필요 와이즈(W) *</label>
                  <input type="number" value={form.requiredPoints} onChange={(e) => f('requiredPoints', e.target.value)} required
                    placeholder="예: 500000"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">참고 가격 (원)</label>
                  <input type="number" value={form.referencePrice} onChange={(e) => f('referencePrice', e.target.value)}
                    placeholder="공홈 판매가"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">재고 수량</label>
                  <input type="number" value={form.stockQuantity} onChange={(e) => f('stockQuantity', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">공식 사이트 링크 (관리자 주문 시 참고)</label>
                <input value={form.externalUrl} onChange={(e) => f('externalUrl', e.target.value)}
                  placeholder="https://www.samsung.com/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="mt-0.5 text-xs text-gray-400">교환 신청 시 이 링크에서 고객 주소로 직접 주문해주세요.</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">상품 설명</label>
                <textarea value={form.description} onChange={(e) => f('description', e.target.value)} rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => f('isActive', e.target.checked)} className="h-4 w-4 accent-blue-600" />
                <span className="text-sm text-gray-700">판매 활성화</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50">취소</button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">상품명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">브랜드</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">카테고리</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">필요 와이즈</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">재고</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">링크</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">상태</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-10 text-center text-gray-400">불러오는 중...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="py-10 text-center text-gray-400">등록된 상품이 없습니다.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.brand ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.wiseMallCategory?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">{formatWise(p.requiredPoints)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.stockQuantity}</td>
                  <td className="px-4 py-3 text-center">
                    {p.externalUrl ? (
                      <a href={p.externalUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                        <ExternalLink size={12} /> 링크
                      </a>
                    ) : <span className="text-xs text-gray-300">없음</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? '판매중' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(p)} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                        <Pencil size={14} />
                      </button>
                      {deletingId === p.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => handleDelete(p.id)} className="font-medium text-red-600 hover:underline">확인</button>
                          <button onClick={() => setDeletingId(null)} className="text-gray-400 hover:underline">취소</button>
                        </span>
                      ) : (
                        <button onClick={() => setDeletingId(p.id)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      )}
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
