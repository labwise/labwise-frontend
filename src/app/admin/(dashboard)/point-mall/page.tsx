'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface PointProduct {
  id: string; name: string; category: string; requiredPoints: number;
  referencePrice?: number; stockQuantity: number; isActive: boolean; description?: string;
}

const emptyForm = {
  name: '', category: '', requiredPoints: '', referencePrice: '',
  stockQuantity: '0', description: '', isActive: true,
};

export default function PointMallProductsPage() {
  const [products, setProducts] = useState<PointProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    adminApi.get('/admin/point-mall/products', { params: { limit: 100 } })
      .then(({ data }) => setProducts(data.items ?? data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm });
    setError('');
    setShowForm(true);
  }

  function openEdit(p: PointProduct) {
    setEditId(p.id);
    setForm({
      name: p.name, category: p.category, requiredPoints: String(p.requiredPoints),
      referencePrice: String(p.referencePrice ?? ''), stockQuantity: String(p.stockQuantity),
      description: p.description ?? '', isActive: p.isActive,
    });
    setError('');
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        requiredPoints: Number(form.requiredPoints),
        referencePrice: form.referencePrice ? Number(form.referencePrice) : undefined,
        stockQuantity: Number(form.stockQuantity),
      };
      if (editId) {
        await adminApi.put(`/admin/point-mall/products/${editId}`, payload);
      } else {
        await adminApi.post('/admin/point-mall/products', payload);
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 상품을 삭제하시겠습니까?`)) return;
    await adminApi.delete(`/admin/point-mall/products/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">포인트몰 상품</h1>
        <div className="flex gap-2">
          <Link href="/admin/point-mall/orders"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            주문 관리
          </Link>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> 상품 등록
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-800">{editId ? '상품 수정' : '상품 등록'}</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            {error && <div className="mx-6 mt-4 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">상품명 *</label>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">카테고리 *</label>
                  <input value={form.category} onChange={(e) => set('category', e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">필요 포인트 *</label>
                  <input type="number" value={form.requiredPoints} onChange={(e) => set('requiredPoints', e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">참고 가격 (원)</label>
                  <input type="number" value={form.referencePrice} onChange={(e) => set('referencePrice', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">재고</label>
                  <input type="number" value={form.stockQuantity} onChange={(e) => set('stockQuantity', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">설명</label>
                  <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="pmActive" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="rounded" />
                  <label htmlFor="pmActive" className="text-sm text-gray-700">판매 활성화</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">상품명</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">카테고리</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">필요 포인트</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">재고</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">상태</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">불러오는 중...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">상품이 없습니다</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category}</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">{p.requiredPoints.toLocaleString()}P</td>
                  <td className="px-4 py-3 text-right">{p.stockQuantity}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? '판매중' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={15} />
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
