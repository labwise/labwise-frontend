'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface Coupon {
  id: string; name: string; code: string; type: string;
  discountAmount?: number; discountRate?: number; minOrderAmount: number;
  usageLimit?: number; usageCount: number; isActive: boolean;
  validFrom?: string; validTo?: string;
}

const COUPON_TYPES = [
  { value: 'FIXED', label: '정액 할인' },
  { value: 'PERCENTAGE', label: '정률 할인' },
];

const emptyForm = {
  name: '', code: '', type: 'FIXED', discountAmount: '', discountRate: '',
  maxDiscountAmount: '', minOrderAmount: '0', usageLimit: '', validFrom: '', validTo: '', isActive: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function loadCoupons() {
    setLoading(true);
    adminApi.get('/admin/coupons', { params: { limit: 100 } })
      .then(({ data }) => setCoupons(data.items ?? data))
      .finally(() => setLoading(false));
  }

  useEffect(loadCoupons, []);

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm });
    setError('');
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditId(c.id);
    setForm({
      name: c.name, code: c.code ?? '', type: c.type,
      discountAmount: String(c.discountAmount ?? ''), discountRate: String(c.discountRate ?? ''),
      maxDiscountAmount: '', minOrderAmount: String(c.minOrderAmount ?? 0),
      usageLimit: String(c.usageLimit ?? ''),
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : '',
      validTo: c.validTo ? c.validTo.slice(0, 10) : '',
      isActive: c.isActive,
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
        discountAmount: form.discountAmount ? Number(form.discountAmount) : undefined,
        discountRate: form.discountRate ? Number(form.discountRate) : undefined,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
        minOrderAmount: Number(form.minOrderAmount),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        validFrom: form.validFrom || undefined,
        validTo: form.validTo || undefined,
        code: form.code || undefined,
      };
      if (editId) {
        await adminApi.put(`/admin/coupons/${editId}`, payload);
      } else {
        await adminApi.post('/admin/coupons', payload);
      }
      setShowForm(false);
      loadCoupons();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(couponId: string, name: string) {
    if (!confirm(`"${name}" 쿠폰을 삭제하시겠습니까?`)) return;
    await adminApi.delete(`/admin/coupons/${couponId}`);
    loadCoupons();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">쿠폰 관리</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus size={16} /> 쿠폰 생성
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-800">{editId ? '쿠폰 수정' : '쿠폰 생성'}</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            {error && <div className="mx-6 mt-4 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">쿠폰명 *</label>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">쿠폰 코드</label>
                  <input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="자동 생성"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">할인 유형 *</label>
                  <select value={form.type} onChange={(e) => set('type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {COUPON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {form.type === 'FIXED' ? (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">할인 금액 (원)</label>
                    <input type="number" value={form.discountAmount} onChange={(e) => set('discountAmount', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">할인율 (%)</label>
                      <input type="number" value={form.discountRate} onChange={(e) => set('discountRate', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">최대 할인 (원)</label>
                      <input type="number" value={form.maxDiscountAmount} onChange={(e) => set('maxDiscountAmount', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">최소 주문 금액</label>
                  <input type="number" value={form.minOrderAmount} onChange={(e) => set('minOrderAmount', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">사용 한도</label>
                  <input type="number" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} placeholder="무제한"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">유효 시작일</label>
                  <input type="date" value={form.validFrom} onChange={(e) => set('validFrom', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">유효 종료일</label>
                  <input type="date" value={form.validTo} onChange={(e) => set('validTo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="couponActive" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="rounded" />
                  <label htmlFor="couponActive" className="text-sm text-gray-700">활성화</label>
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
              <th className="text-left px-4 py-3 text-gray-500 font-medium">쿠폰명</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">코드</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">혜택</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">사용</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">상태</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">불러오는 중...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">쿠폰이 없습니다</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.code || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.type === 'FIXED' ? `${c.discountAmount?.toLocaleString()}원` : `${c.discountRate}%`}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {c.usageCount}/{c.usageLimit ?? '∞'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
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
