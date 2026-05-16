'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import adminApi from '@/lib/admin-api';
import { Trash2, Upload, Sparkles, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
}

interface UploadedImage {
  url: string;
  isPrimary: boolean;
  uploading?: boolean;
}

function flattenCategories(tree: Category[], depth = 0): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [];
  for (const cat of tree) {
    result.push({ id: cat.id, label: (depth > 0 ? '  └ ' : '') + cat.name });
    if (cat.children?.length) result.push(...flattenCategories(cat.children, depth + 1));
  }
  return result;
}

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    categoryId: '',
    sku: '',
    manufacturer: '',
    casNumber: '',
    unit: '',
    specifications: '',
    price: '',
    stockQuantity: '0',
    minOrderQty: '1',
    description: '',
    sdsFileUrl: '',
    isActive: true,
  });

  useEffect(() => {
    adminApi.get('/admin/categories').then(({ data }) => {
      setCategories(flattenCategories(data));
    });
  }, []);

  function set(field: string, value: string | boolean) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'name') {
        next.slug = (value as string)
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
      }
      return next;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    for (const file of files) {
      const id = Math.random().toString(36).slice(2);
      setImages((prev) => [
        ...prev,
        { url: URL.createObjectURL(file), isPrimary: prev.length === 0, uploading: true },
      ]);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await adminApi.post('/admin/uploads/image', fd);
        setImages((prev) =>
          prev.map((img) =>
            img.url.startsWith('blob:') && img.uploading
              ? { url: data.url, isPrimary: img.isPrimary, uploading: false }
              : img,
          ),
        );
      } catch {
        setImages((prev) => prev.filter((img) => !(img.url.startsWith('blob:') && img.uploading)));
        setError('이미지 업로드에 실패했습니다.');
      }
    }
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) next[0].isPrimary = true;
      return next;
    });
  }

  function setPrimary(index: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  }

  async function generateDescription() {
    if (!form.name.trim()) return alert('상품명을 먼저 입력해주세요.');
    setAiLoading(true);
    try {
      const categoryLabel = categories.find((c) => c.id === form.categoryId)?.label;
      const { data } = await adminApi.post('/admin/products/generate-description', {
        name: form.name,
        manufacturer: form.manufacturer,
        specifications: form.specifications,
        casNumber: form.casNumber,
        unit: form.unit,
        category: categoryLabel,
      });
      set('description', data.description);
    } catch {
      setError('AI 설명 생성에 실패했습니다. ANTHROPIC_API_KEY 설정을 확인해주세요.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (images.some((img) => img.uploading)) {
      return setError('이미지 업로드가 완료될 때까지 기다려주세요.');
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await adminApi.post('/admin/products', {
        ...form,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        minOrderQty: Number(form.minOrderQty),
      });
      for (const img of images) {
        await adminApi.post(`/admin/products/${data.id}/images`, {
          url: img.url,
          isPrimary: img.isPrimary,
        });
      }
      router.push('/admin/products');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const field = (label: string, key: keyof typeof form, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value)}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← 뒤로</button>
        <h1 className="text-xl font-bold text-gray-900">상품 등록</h1>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('상품명', 'name', 'text', true)}
            {field('슬러그 (URL)', 'slug', 'text', true)}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">카테고리 선택</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            {field('SKU', 'sku')}
            {field('제조사', 'manufacturer')}
            {field('CAS 번호', 'casNumber')}
            {field('단위 (예: box, 개)', 'unit')}
            {field('사양', 'specifications')}
          </div>
        </div>

        {/* 가격/재고 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">가격 / 재고</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('가격 (원)', 'price', 'number', true)}
            {field('재고 수량', 'stockQuantity', 'number')}
            {field('최소 주문 수량', 'minOrderQty', 'number')}
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">상품 이미지</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors mb-4"
          >
            <Upload className="h-5 w-5" />
            이미지 파일 선택 (여러 장 가능)
          </button>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className={`w-28 h-28 object-cover rounded-xl border-2 transition-colors ${
                      img.isPrimary ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                  {!img.uploading && img.isPrimary && (
                    <span className="absolute top-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                      대표
                    </span>
                  )}
                  {!img.uploading && (
                    <div className="absolute top-1 right-1 hidden gap-1 group-hover:flex">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimary(idx)}
                          className="rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white"
                        >
                          대표
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="rounded bg-red-500 p-0.5 text-white"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상세 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">상세 정보</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">상품 설명</label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {aiLoading ? 'AI 생성 중...' : 'AI로 설명 생성'}
                </button>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={6}
                placeholder="상품 설명을 직접 입력하거나 AI 생성 버튼을 사용하세요."
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
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            취소
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? '등록 중...' : '상품 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
