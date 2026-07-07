'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { Plus, Pencil, Trash2, X, Send, Search } from 'lucide-react';

interface CouponTargetRow { id: string; targetType: 'CATEGORY' | 'PRODUCT'; targetId: string; }
interface Coupon {
  id: string; name: string; code: string; type: string;
  discountAmount?: number; discountRate?: number; minOrderAmount: number;
  usageLimit?: number; usageCount: number; isActive: boolean;
  validFrom?: string; validTo?: string; autoIssueOnSignup?: boolean;
  scope?: 'ALL' | 'CATEGORY' | 'PRODUCT'; targets?: CouponTargetRow[];
}

interface Group { id: string; name: string; }
interface UserRow { id: string; name: string; email: string; }
interface CategoryRow { id: string; name: string; children?: CategoryRow[]; }
interface ProductSearchResult { id: string; name: string; price: number; sku?: string; }
interface TargetPick { targetId: string; label: string; }

const COUPON_TYPES = [
  { value: 'FIXED', label: '정액 할인' },
  { value: 'PERCENT', label: '정률 할인' },
  { value: 'FREE_SHIPPING', label: '무료배송' },
];

const SCOPE_OPTIONS = [
  { value: 'ALL', label: '전체 상품' },
  { value: 'CATEGORY', label: '특정 카테고리' },
  { value: 'PRODUCT', label: '특정 상품' },
];

function flattenCategories(nodes: CategoryRow[], depth = 0): { id: string; label: string }[] {
  return nodes.flatMap((n) => [
    { id: n.id, label: `${'　'.repeat(depth)}${depth > 0 ? '└ ' : ''}${n.name}` },
    ...flattenCategories(n.children ?? [], depth + 1),
  ]);
}

const emptyForm = {
  name: '', code: '', type: 'FIXED', discountAmount: '', discountRate: '',
  maxDiscountAmount: '', minOrderAmount: '0', usageLimit: '', validFrom: '', validTo: '',
  isActive: true, autoIssueOnSignup: false, scope: 'ALL' as 'ALL' | 'CATEGORY' | 'PRODUCT',
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [issueCoupon, setIssueCoupon] = useState<Coupon | null>(null);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [targetPicks, setTargetPicks] = useState<TargetPick[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);

  function loadCoupons() {
    setLoading(true);
    adminApi.get('/admin/coupons', { params: { limit: 100 } })
      .then(({ data }) => setCoupons(data.items ?? data))
      .finally(() => setLoading(false));
  }

  useEffect(loadCoupons, []);
  useEffect(() => {
    adminApi.get('/admin/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const flatCategories = flattenCategories(categories);

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm });
    setTargetPicks([]);
    setProductSearch('');
    setProductResults([]);
    setError('');
    setShowForm(true);
  }

  async function openEdit(c: Coupon) {
    setEditId(c.id);
    setForm({
      name: c.name, code: c.code ?? '', type: c.type,
      discountAmount: String(c.discountAmount ?? ''), discountRate: String(c.discountRate ?? ''),
      maxDiscountAmount: '', minOrderAmount: String(c.minOrderAmount ?? 0),
      usageLimit: String(c.usageLimit ?? ''),
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : '',
      validTo: c.validTo ? c.validTo.slice(0, 10) : '',
      isActive: c.isActive,
      autoIssueOnSignup: c.autoIssueOnSignup ?? false,
      scope: c.scope ?? 'ALL',
    });
    setProductSearch('');
    setProductResults([]);

    const targets = c.targets ?? [];
    if (c.scope === 'CATEGORY') {
      const flat = flattenCategories(categories);
      setTargetPicks(targets.map((t) => ({
        targetId: t.targetId,
        label: flat.find((f) => f.id === t.targetId)?.label.trim() ?? t.targetId,
      })));
    } else if (c.scope === 'PRODUCT' && targets.length) {
      try {
        const results = await Promise.all(
          targets.map((t) => adminApi.get(`/admin/products/${t.targetId}`).then(({ data }) => data).catch(() => null)),
        );
        setTargetPicks(
          targets.map((t, i) => ({ targetId: t.targetId, label: results[i]?.name ?? t.targetId })),
        );
      } catch {
        setTargetPicks(targets.map((t) => ({ targetId: t.targetId, label: t.targetId })));
      }
    } else {
      setTargetPicks([]);
    }
    setError('');
    setShowForm(true);
  }

  function toggleCategoryPick(id: string, label: string) {
    setTargetPicks((prev) =>
      prev.some((p) => p.targetId === id) ? prev.filter((p) => p.targetId !== id) : [...prev, { targetId: id, label }],
    );
  }

  async function handleProductSearch() {
    if (!productSearch.trim()) return;
    const { data } = await adminApi.get('/admin/products', { params: { search: productSearch, limit: 10 } });
    setProductResults(data.items ?? data);
  }

  function addProductPick(p: ProductSearchResult) {
    setTargetPicks((prev) => (prev.some((t) => t.targetId === p.id) ? prev : [...prev, { targetId: p.id, label: p.name }]));
  }

  function removePick(id: string) {
    setTargetPicks((prev) => prev.filter((p) => p.targetId !== id));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.scope !== 'ALL' && targetPicks.length === 0) {
      setError(form.scope === 'CATEGORY' ? '카테고리를 1개 이상 선택해주세요.' : '상품을 1개 이상 선택해주세요.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const targets = form.scope === 'ALL' ? [] : targetPicks.map((p) => ({ targetType: form.scope, targetId: p.targetId }));
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
        targets,
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
                  <input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="사용자가 등록할 코드 (선택)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">할인 유형 *</label>
                  <select value={form.type} onChange={(e) => set('type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {COUPON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {form.type === 'FIXED' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">할인 금액 (원)</label>
                    <input type="number" value={form.discountAmount} onChange={(e) => set('discountAmount', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                {form.type === 'PERCENT' && (
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

                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">적용 범위</label>
                  <select
                    value={form.scope}
                    onChange={(e) => { set('scope', e.target.value); setTargetPicks([]); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SCOPE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                {form.scope === 'CATEGORY' && (
                  <div className="col-span-2 space-y-2">
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
                      {flatCategories.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={targetPicks.some((p) => p.targetId === c.id)}
                            onChange={() => toggleCategoryPick(c.id, c.label)}
                          />
                          <span className="whitespace-pre">{c.label}</span>
                        </label>
                      ))}
                    </div>
                    {targetPicks.length === 0 && (
                      <p className="text-xs text-amber-600">카테고리를 1개 이상 선택해주세요.</p>
                    )}
                  </div>
                )}

                {form.scope === 'PRODUCT' && (
                  <div className="col-span-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="상품명 검색"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="button" onClick={handleProductSearch}
                        className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                        <Search size={14} /> 검색
                      </button>
                    </div>
                    {productResults.length > 0 && (
                      <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-32 overflow-y-auto">
                        {productResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addProductPick(p)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between"
                          >
                            <span>{p.name}</span>
                            <span className="text-xs text-gray-400">{p.sku}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {targetPicks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {targetPicks.map((p) => (
                          <span key={p.targetId} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                            {p.label}
                            <button type="button" onClick={() => removePick(p.targetId)}><X size={11} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    {targetPicks.length === 0 && (
                      <p className="text-xs text-amber-600">상품을 1개 이상 선택해주세요.</p>
                    )}
                  </div>
                )}

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
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="couponAutoIssue" checked={form.autoIssueOnSignup} onChange={(e) => set('autoIssueOnSignup', e.target.checked)} className="rounded" />
                  <label htmlFor="couponAutoIssue" className="text-sm text-gray-700">신규 회원가입 시 자동 발급 (웰컴쿠폰)</label>
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

      {issueCoupon && (
        <IssueModal coupon={issueCoupon} onClose={() => setIssueCoupon(null)} onIssued={loadCoupons} />
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">쿠폰명</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">코드</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">혜택</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">발급/사용</th>
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
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.name}
                    {c.autoIssueOnSignup && (
                      <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600">웰컴</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.code || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.type === 'FIXED' ? `${c.discountAmount?.toLocaleString()}원`
                      : c.type === 'PERCENT' ? `${c.discountRate}%`
                      : '무료배송'}
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
                      <button onClick={() => setIssueCoupon(c)} className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50" title="발급">
                        <Send size={15} />
                      </button>
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

function IssueModal({ coupon, onClose, onIssued }: { coupon: Coupon; onClose: () => void; onIssued: () => void }) {
  const [target, setTarget] = useState<'all' | 'group' | 'users'>('all');
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<UserRow[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get('/admin/groups').then(({ data }) => setGroups(data.items ?? data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (target !== 'users' || !search.trim()) { setResults([]); return; }
    const timer = setTimeout(() => {
      adminApi.get('/admin/users', { params: { search, limit: 10 } })
        .then(({ data }) => setResults(data.items ?? data))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, target]);

  function toggleSelect(u: UserRow) {
    setSelected((prev) =>
      prev.some((p) => p.id === u.id) ? prev.filter((p) => p.id !== u.id) : [...prev, u],
    );
  }

  async function handleIssue() {
    setError('');
    setIssuing(true);
    try {
      const payload =
        target === 'all' ? { target: 'all' }
        : target === 'group' ? { target: 'group', groupId }
        : { target: 'users', userIds: selected.map((s) => s.id) };
      const { data } = await adminApi.post(`/admin/coupons/${coupon.id}/issue`, payload);
      setResult(`${data.issued}명에게 발급했습니다.`);
      onIssued();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || '발급 실패');
    } finally {
      setIssuing(false);
    }
  }

  const canIssue =
    target === 'all' ? true : target === 'group' ? !!groupId : selected.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">쿠폰 발급 · {coupon.name}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          {result && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3">{result}</div>}

          <div className="flex gap-2">
            {[
              { v: 'all', label: '전체 회원' },
              { v: 'group', label: '그룹' },
              { v: 'users', label: '개별 회원' },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setTarget(t.v as typeof target)}
                className={`flex-1 py-2 rounded-lg text-sm border ${
                  target === t.v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {target === 'group' && (
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">그룹 선택</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}

          {target === 'users' && (
            <div className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="이름 또는 이메일 검색"
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm"
                />
              </div>
              {results.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-50">
                  {results.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => toggleSelect(u)}
                      className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center hover:bg-gray-50 ${
                        selected.some((s) => s.id === u.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span>{u.name}</span>
                      <span className="text-xs text-gray-400">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {s.name}
                      <button onClick={() => toggleSelect(s)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleIssue}
            disabled={!canIssue || issuing}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {issuing ? '발급 중...' : '발급하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
