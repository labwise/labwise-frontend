'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface CustomerGroup {
  id: string;
  name: string;
  description?: string;
  pointRate: number;
  discountRate: number;
  pointmallAccess: boolean;
  taxInvoiceEnabled: boolean;
  postpayAllowed: boolean;
  minOrderAmount: number;
  isActive: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  pointRate: 1.0,
  discountRate: 0,
  pointmallAccess: false,
  taxInvoiceEnabled: false,
  postpayAllowed: false,
  minOrderAmount: 0,
  isActive: true,
};

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CustomerGroup | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/groups');
      setGroups(data);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(g: CustomerGroup) {
    setEditing(g);
    setForm({
      name: g.name,
      description: g.description ?? '',
      pointRate: Number(g.pointRate),
      discountRate: Number(g.discountRate),
      pointmallAccess: g.pointmallAccess,
      taxInvoiceEnabled: g.taxInvoiceEnabled,
      postpayAllowed: g.postpayAllowed,
      minOrderAmount: g.minOrderAmount,
      isActive: g.isActive,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSave() {
    if (!form.name.trim()) return alert('그룹 이름을 입력하세요.');
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put(`/admin/groups/${editing.id}`, form);
      } else {
        await adminApi.post('/admin/groups', form);
      }
      await load();
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(g: CustomerGroup) {
    if (!confirm(`"${g.name}" 그룹을 삭제하시겠습니까?`)) return;
    await adminApi.delete(`/admin/groups/${g.id}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">그룹 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            회원 그룹별 와이즈몰 접근 권한, 와이즈 적립율, 할인율을 설정합니다.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          그룹 추가
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">그룹명</th>
                <th className="px-5 py-3 text-center">와이즈몰</th>
                <th className="px-5 py-3 text-center">와이즈 적립율</th>
                <th className="px-5 py-3 text-center">할인율</th>
                <th className="px-5 py-3 text-center">세금계산서</th>
                <th className="px-5 py-3 text-center">후불결제</th>
                <th className="px-5 py-3 text-center">상태</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{g.name}</p>
                    {g.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{g.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {g.pointmallAccess ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        허용
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        차단
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center font-medium text-blue-600">
                    {Number(g.pointRate).toFixed(1)}배
                  </td>
                  <td className="px-5 py-4 text-center font-medium text-green-600">
                    {Number(g.discountRate).toFixed(1)}%
                  </td>
                  <td className="px-5 py-4 text-center">
                    {g.taxInvoiceEnabled ? (
                      <Check className="mx-auto h-4 w-4 text-green-500" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {g.postpayAllowed ? (
                      <Check className="mx-auto h-4 w-4 text-green-500" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        g.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {g.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(g)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(g)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                    등록된 그룹이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? '그룹 수정' : '그룹 추가'}
              </h2>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  그룹 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 인증회원, VIP, 기업회원"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">설명</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="그룹에 대한 설명 (선택)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    와이즈 적립율 <span className="text-xs text-gray-400">(배율)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={form.pointRate}
                    onChange={(e) => setForm({ ...form, pointRate: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">1.0 = 기본, 2.0 = 2배 적립</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    할인율 <span className="text-xs text-gray-400">(%)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.discountRate}
                    onChange={(e) => setForm({ ...form, discountRate: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">0 = 할인 없음, 10 = 10% 할인</p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">권한 설정</label>
                <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                  {([
                    { key: 'pointmallAccess', label: '와이즈몰 접근 허용' },
                    { key: 'taxInvoiceEnabled', label: '세금계산서 발행 허용' },
                    { key: 'postpayAllowed', label: '후불 결제 허용' },
                    { key: 'isActive', label: '그룹 활성화' },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="h-4 w-4 rounded accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeForm}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
