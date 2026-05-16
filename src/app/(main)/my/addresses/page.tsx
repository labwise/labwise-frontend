'use client';

import { useEffect, useState } from 'react';
import { Plus, Star, Pencil, Trash2, X, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Address {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  postalCode: string;
  address: string;
  addressDetail: string | null;
  isDefault: boolean;
}

interface AddressForm {
  label: string;
  recipientName: string;
  phone: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  label: '',
  recipientName: '',
  phone: '',
  postalCode: '',
  address: '',
  addressDetail: '',
  isDefault: false,
};

function openDaumPostcode(onSelect: (postcode: string, address: string) => void) {
  const load = () => {
    new (window as any).daum.Postcode({
      oncomplete(data: any) {
        onSelect(data.zonecode, data.roadAddress || data.jibunAddress);
      },
    }).open();
  };
  if ((window as any).daum?.Postcode) { load(); return; }
  const script = document.createElement('script');
  script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
  script.onload = load;
  document.head.appendChild(script);
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/shipping-addresses');
      setAddresses(data);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label ?? '',
      recipientName: addr.recipientName,
      phone: addr.phone,
      postalCode: addr.postalCode,
      address: addr.address,
      addressDetail: addr.addressDetail ?? '',
      isDefault: addr.isDefault,
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.recipientName || !form.phone || !form.postalCode || !form.address) {
      setError('받는 분, 연락처, 주소는 필수입니다.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.patch(`/shipping-addresses/${editingId}`, form);
      } else {
        await api.post('/shipping-addresses', form);
      }
      await fetchAddresses();
      setShowForm(false);
    } catch (e: any) {
      setError(e.response?.data?.message ?? '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 배송지를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/shipping-addresses/${id}`);
      await fetchAddresses();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/shipping-addresses/${id}/default`);
      await fetchAddresses();
    } catch {
      alert('기본 배송지 설정에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-sm text-gray-400">불러오는 중...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">배송지 관리</h2>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" />
          새 배송지 추가
        </Button>
      </div>

      {addresses.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">등록된 배송지가 없습니다.</p>
          <button onClick={openNew} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
            + 배송지 추가하기
          </button>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`rounded-xl border p-4 ${addr.isDefault ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      <Star className="h-3 w-3" /> 기본
                    </span>
                  )}
                  {addr.label && (
                    <span className="text-sm font-medium text-gray-900">{addr.label}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700">
                  {addr.recipientName} · {addr.phone}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  [{addr.postalCode}] {addr.address}
                  {addr.addressDetail ? ` ${addr.addressDetail}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    title="기본 배송지로 설정"
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => openEdit(addr)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {editingId ? '배송지 수정' : '새 배송지 추가'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">별칭 (선택)</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="예: 집, 회사"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">받는 분 *</label>
                <input
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  placeholder="홍길동"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">연락처 *</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="010-1234-5678"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">우편번호 *</label>
              <div className="flex gap-2">
                <input
                  value={form.postalCode}
                  readOnly
                  placeholder="우편번호"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => openDaumPostcode((postcode, address) =>
                    setForm((f) => ({ ...f, postalCode: postcode, address }))
                  )}
                  className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
                >
                  주소 검색
                </button>
              </div>
            </div>

            <div>
              <input
                value={form.address}
                readOnly
                placeholder="기본 주소"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50"
              />
            </div>

            <div>
              <input
                value={form.addressDetail}
                onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                placeholder="상세 주소 (동, 호수 등)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">기본 배송지로 설정</span>
            </label>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} loading={saving} className="flex-1">
                <Check className="h-4 w-4 mr-1" />
                저장
              </Button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
