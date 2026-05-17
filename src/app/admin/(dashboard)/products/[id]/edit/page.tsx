'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import adminApi from '@/lib/admin-api';
import { Trash2, Upload, Sparkles, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
}
interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedMainId, setSelectedMainId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');

  const [form, setForm] = useState({
    name: '', slug: '', categoryId: '', sku: '', manufacturer: '',
    casNumber: '', unit: '', specifications: '', price: '',
    stockQuantity: '0', minOrderQty: '1', description: '', sdsFileUrl: '', isActive: true,
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.get('/admin/categories'),
      adminApi.get(`/admin/products/${id}`),
    ]).then(([catRes, prodRes]) => {
      const cats: Category[] = catRes.data;
      setCategories(cats);
      const p = prodRes.data;
      setImages(p.images ?? []);

      // Determine main/sub from categoryId
      const catId = p.categoryId ?? '';
      let mainId = catId;
      let subId = '';
      const isSubCat = cats.some((c) => c.children?.some((ch) => ch.id === catId));
      if (isSubCat) {
        const parent = cats.find((c) => c.children?.some((ch) => ch.id === catId));
        mainId = parent?.id ?? '';
        subId = catId;
      }
      setSelectedMainId(mainId);
      setSelectedSubId(subId);

      setForm({
        name: p.name ?? '', slug: p.slug ?? '', categoryId: p.categoryId ?? '',
        sku: p.sku ?? '', manufacturer: p.manufacturer ?? '', casNumber: p.casNumber ?? '',
        unit: p.unit ?? '', specifications: p.specifications ?? '', price: String(p.price ?? ''),
        stockQuantity: String(p.stockQuantity ?? 0), minOrderQty: String(p.minOrderQty ?? 1),
        description: p.description ?? '', sdsFileUrl: p.sdsFileUrl ?? '', isActive: p.isActive ?? true,
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const mainCategories = categories;
  const subCategories = categories.find((c) => c.id === selectedMainId)?.children ?? [];

  function handleMainCategoryChange(mainId: string) {
    setSelectedMainId(mainId);
    setSelectedSubId('');
    set('categoryId', mainId);
  }

  function handleSubCategoryChange(subId: string) {
    setSelectedSubId(subId);
    set('categoryId', subId || selectedMainId);
  }

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await adminApi.post('/admin/uploads/image', fd);
        const { data: imgData } = await adminApi.post(`/admin/products/${id}/images`, {
          url: data.url,
          isPrimary: images.length === 0,
        });
        setImages((prev) => [...prev, imgData]);
      } catch {
        setError('이미지 업로드에 실패했습니다.');
      }
    }
    setUploading(false);
    e.target.value = '';
  }

  async function deleteImage(imageId: string) {
    await adminApi.delete(`/admin/products/images/${imageId}`);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  async function generateDescription() {
    if (!form.name.trim()) return alert('상품명을 먼저 입력해주세요.');
    setAiLoading(true);
    try {
      const mainCat = categories.find((c) => c.id === selectedMainId);
      const subCat = mainCat?.children?.find((c) => c.id === selectedSubId);
      const categoryLabel = subCat?.name ?? mainCat?.name;
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

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← 뒤로</button>
        <h1 className="text-xl font-bold text-gray-900">상품 수정</h1>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('상품명', 'name')}
            {field('슬러그', 'slug')}

            {/* 메인 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">메인 카테고리</label>
              <select
                value={selectedMainId}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">메인 카테고리 선택</option>
                {mainCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 서브 카테고리 */}
            {subCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">서브 카테고리</label>
                <select
                  value={selectedSubId}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">서브 카테고리 선택 (선택 안 하면 메인으로 등록)</option>
                  {subCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {field('SKU', 'sku')}
            {field('제조사', 'manufacturer')}
            {field('CAS 번호', 'casNumber')}
            {field('단위', 'unit')}
            {field('사양', 'specifications')}
          </div>
        </div>

        {/* 가격/재고 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">가격 / 재고</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('가격 (원)', 'price', 'number')}
            {field('재고 수량', 'stockQuantity', 'number')}
            {field('최소 주문 수량', 'minOrderQty', 'number')}
          </div>
        </div>

        {/* 이미지 관리 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">상품 이미지</h2>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors mb-4 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {uploading ? '업로드 중...' : '이미지 파일 선택 (여러 장 가능)'}
          </button>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className={`w-28 h-28 object-cover rounded-xl border-2 ${img.isPrimary ? 'border-blue-500' : 'border-gray-200'}`} />
                  {img.isPrimary && (
                    <span className="absolute top-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white">대표</span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteImage(img.id)}
                    className="absolute top-1 right-1 rounded bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
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
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
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
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="rounded" />
              <label htmlFor="isActive" className="text-sm text-gray-700">판매 활성화</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</button>
          <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
