'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Link2, History } from 'lucide-react';

interface SourcingProduct {
  id: string;
  sourcingCode?: string;
  name: string;
  supplierName?: string;
  supplierPartNumber?: string;
  manufacturer?: string;
  originCountry?: string;
  hsCode?: string;
  purchaseUnit?: string;
  salesUnit?: string;
  purchaseToSalesRatio?: number;
  linkedProductId?: string;
  linkedProduct?: { id: string; name: string } | null;
  status: 'ACTIVE' | 'DISCONTINUED' | 'PENDING';
  memo?: string;
  batches?: { id: string }[];
  createdAt: string;
}

const emptyForm = {
  name: '',
  sourcingCode: '',
  supplierName: '',
  supplierPartNumber: '',
  manufacturer: '',
  originCountry: '',
  hsCode: '',
  purchaseUnit: '',
  salesUnit: '',
  purchaseToSalesRatio: '1',
  linkedProductId: '',
  status: 'ACTIVE' as 'ACTIVE' | 'DISCONTINUED' | 'PENDING',
  memo: '',
};

const STATUS_LABEL = { ACTIVE: '활성', DISCONTINUED: '단종', PENDING: '검토중' };
const STATUS_COLOR = { ACTIVE: 'bg-green-100 text-green-700', DISCONTINUED: 'bg-gray-100 text-gray-500', PENDING: 'bg-yellow-100 text-yellow-700' };

export default function SourcingProductsPage() {
  const [items, setItems] = useState<SourcingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await adminApi.get('/sourcing-products');
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  }

  function openEdit(item: SourcingProduct) {
    setEditId(item.id);
    setForm({
      name: item.name,
      sourcingCode: item.sourcingCode ?? '',
      supplierName: item.supplierName ?? '',
      supplierPartNumber: item.supplierPartNumber ?? '',
      manufacturer: item.manufacturer ?? '',
      originCountry: item.originCountry ?? '',
      hsCode: item.hsCode ?? '',
      purchaseUnit: item.purchaseUnit ?? '',
      salesUnit: item.salesUnit ?? '',
      purchaseToSalesRatio: String(item.purchaseToSalesRatio ?? 1),
      linkedProductId: item.linkedProductId ?? '',
      status: item.status,
      memo: item.memo ?? '',
    });
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('소싱 상품명을 입력하세요.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        purchaseToSalesRatio: Number(form.purchaseToSalesRatio) || 1,
        linkedProductId: form.linkedProductId || undefined,
      };
      if (editId) {
        await adminApi.put(`/sourcing-products/${editId}`, payload);
      } else {
        await adminApi.post('/sourcing-products', payload);
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 소싱 상품을 삭제하시겠습니까?\n연결된 배치가 있으면 삭제할 수 없습니다.`)) return;
    try {
      await adminApi.delete(`/sourcing-products/${id}`);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '삭제 중 오류');
    }
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">소싱 상품 마스터</h1>
          <p className="text-sm text-gray-500 mt-1">소싱처별 상품 정보를 관리합니다. 판매 상품(Products)과 연결하여 배치 원가를 계산합니다.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={15} /> 신규 소싱 상품
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">{editId ? '소싱 상품 수정' : '신규 소싱 상품'}</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">상품명 *</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="예: 파란 비커 500mL" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">소싱 코드</label>
              <input className={inputClass} value={form.sourcingCode} onChange={(e) => setForm((f) => ({ ...f, sourcingCode: e.target.value }))} placeholder="내부 관리 코드" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">공급사</label>
              <input className={inputClass} value={form.supplierName} onChange={(e) => setForm((f) => ({ ...f, supplierName: e.target.value }))} placeholder="예: 상해 실험 무역" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">공급사 품번</label>
              <input className={inputClass} value={form.supplierPartNumber} onChange={(e) => setForm((f) => ({ ...f, supplierPartNumber: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">제조사</label>
              <input className={inputClass} value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">원산지</label>
              <input className={inputClass} value={form.originCountry} onChange={(e) => setForm((f) => ({ ...f, originCountry: e.target.value }))} placeholder="예: CN, JP, KR" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">HS코드</label>
              <input className={inputClass} value={form.hsCode} onChange={(e) => setForm((f) => ({ ...f, hsCode: e.target.value }))} placeholder="예: 7017.10-0000" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">구매 단위</label>
              <input className={inputClass} value={form.purchaseUnit} onChange={(e) => setForm((f) => ({ ...f, purchaseUnit: e.target.value }))} placeholder="예: PCS, 박스" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">판매 단위</label>
              <input className={inputClass} value={form.salesUnit} onChange={(e) => setForm((f) => ({ ...f, salesUnit: e.target.value }))} placeholder="예: 개, 세트" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">구매→판매 환산 비율</label>
              <input className={inputClass} type="number" min="0" step="0.01" value={form.purchaseToSalesRatio} onChange={(e) => setForm((f) => ({ ...f, purchaseToSalesRatio: e.target.value }))} placeholder="1" />
              <p className="text-xs text-gray-400 mt-0.5">예: 1박스=12개이면 12 입력</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">연결 판매 상품 ID</label>
              <input className={inputClass} value={form.linkedProductId} onChange={(e) => setForm((f) => ({ ...f, linkedProductId: e.target.value }))} placeholder="UUID 직접 입력" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">상태</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}>
                <option value="ACTIVE">활성</option>
                <option value="PENDING">검토중</option>
                <option value="DISCONTINUED">단종</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">메모</label>
            <textarea className={inputClass} rows={2} value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">취소</button>
            <button onClick={handleSave} disabled={saving} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 p-6">로딩 중...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 p-6">소싱 상품이 없습니다. 신규 소싱 상품을 추가하세요.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">코드</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">상품명</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">공급사</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">원산지 / HS</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">연결 상품</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">배치</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sourcingCode ?? '-'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.supplierName ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{[item.originCountry, item.hsCode].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="px-4 py-3">
                    {item.linkedProduct ? (
                      <span className="flex items-center gap-1 text-blue-600 text-xs"><Link2 size={12} />{item.linkedProduct.name}</span>
                    ) : <span className="text-gray-300 text-xs">미연결</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.batches?.length ?? 0}건</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/sourcing/products/${item.id}`} className="text-gray-400 hover:text-blue-600" title="가격 이력 보기"><History size={14} /></Link>
                      <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-gray-700"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(item.id, item.name)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
