'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import adminApi from '@/lib/admin-api';
import { api } from '@/lib/api';
import { Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}
interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', slug: '', categoryId: '', sku: '', manufacturer: '',
    casNumber: '', unit: '', specifications: '', price: '',
    stockQuantity: '0', minOrderQty: '1', description: '', sdsFileUrl: '', isActive: true,
  });

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      adminApi.get(`/admin/products/${id}`),
    ]).then(([catRes, prodRes]) => {
      setCategories(catRes.data);
      const p = prodRes.data;
      setImages(p.images ?? []);
      setForm({
        name: p.name ?? '', slug: p.slug ?? '', categoryId: p.categoryId ?? '',
        sku: p.sku ?? '', manufacturer: p.manufacturer ?? '', casNumber: p.casNumber ?? '',
        unit: p.unit ?? '', specifications: p.specifications ?? '', price: String(p.price ?? ''),
        stockQuantity: String(p.stockQuantity ?? 0), minOrderQty: String(p.minOrderQty ?? 1),
        description: p.description ?? '', sdsFileUrl: p.sdsFileUrl ?? '', isActive: p.isActive ?? true,
      });
    });
  }, [id]);

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminApi.put(`/admin/products/${id}`, {
        ...form,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        minOrderQty: Number(form.minOrderQty),
      });
      router.push('/admin/products');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function addImage() {
    if (!newImageUrl.trim()) return;
    setLoading(true);
    try {
      const { data } = await adminApi.post(`/admin/products/${id}/images`, {
        url: newImageUrl.trim(),
        isPrimary: images.length === 0,
      });
      setImages((prev) => [...prev, data]);
      setNewImageUrl('');
    } finally {
      setLoading(false);
    }
  }

  async function deleteImage(imageId: string) {
    await adminApi.delete(`/admin/products/images/${imageId}`);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-gray-900">상품 수정</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('상품명', 'name')}
            {field('슬러그', 'slug')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">카테고리 선택</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {field('SKU', 'sku')}
            {field('제조사', 'manufacturer')}
            {field('CAS 번호', 'casNumber')}
            {field('단위', 'unit')}
            {field('사양', 'specifications')}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">가격 / 재고</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('가격 (원)', 'price', 'number')}
            {field('재고 수량', 'stockQuantity', 'number')}
            {field('최소 주문 수량', 'minOrderQty', 'number')}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">이미지 관리</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="이미지 URL 입력"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addImage}
              disabled={loading}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900 disabled:opacity-50"
            >
              추가
            </button>
          </div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.url}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  {img.isPrimary && (
                    <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                      대표
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteImage(img.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">상세 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {field('SDS 파일 URL', 'sdsFileUrl')}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">판매 활성화</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
