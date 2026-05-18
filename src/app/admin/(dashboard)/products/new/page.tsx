'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import adminApi from '@/lib/admin-api';
import { Trash2, Upload, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });

interface Category { id: string; name: string; parentId: string | null; children?: Category[]; }
interface Group { id: string; name: string; pointRate: number; }
interface UploadedImage { url: string; isPrimary: boolean; uploading?: boolean; }

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedMainId, setSelectedMainId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [pointPolicy, setPointPolicy] = useState<'DEFAULT' | 'CUSTOM'>('DEFAULT');
  const [customPointRates, setCustomPointRates] = useState<Record<string, string>>({});

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
    costPrice: '',
    stockQuantity: '0',
    minOrderQty: '1',
    maxOrderQty: '',
    description: '',
    sdsFileUrl: '',
    countryOfOrigin: '',
    taxType: 'TAXABLE',
    isActive: true,
    isDisplayed: true,
    isOnSale: true,
  });

  const price = Number(form.price) || 0;
  const costPrice = Number(form.costPrice) || 0;
  const margin = price > 0 && costPrice > 0 ? ((price - costPrice) / price * 100).toFixed(1) : null;
  const profit = price > 0 && costPrice > 0 ? price - costPrice : null;

  useEffect(() => {
    Promise.all([
      adminApi.get('/admin/categories'),
      adminApi.get('/admin/groups'),
    ]).then(([catRes, grpRes]) => {
      setCategories(catRes.data);
      setGroups(grpRes.data);
    });
  }, []);

  const mainCategories = categories;
  const subCategories = categories.find((c) => c.id === selectedMainId)?.children ?? [];

  function handleMainCategoryChange(mainId: string) {
    setSelectedMainId(mainId);
    setSelectedSubId('');
    setForm((f) => ({ ...f, categoryId: mainId }));
  }

  function handleSubCategoryChange(subId: string) {
    setSelectedSubId(subId);
    setForm((f) => ({ ...f, categoryId: subId || selectedMainId }));
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (images.some((img) => img.uploading)) {
      return setError('이미지 업로드가 완료될 때까지 기다려주세요.');
    }
    if (!form.categoryId) return setError('카테고리를 선택해주세요.');
    setError('');
    setLoading(true);
    try {
      const rates: Record<string, number> = {};
      if (pointPolicy === 'CUSTOM') {
        for (const [gid, val] of Object.entries(customPointRates)) {
          if (val !== '') rates[gid] = Number(val);
        }
      }
      const { data } = await adminApi.post('/admin/products', {
        ...form,
        price: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        stockQuantity: Number(form.stockQuantity),
        minOrderQty: Number(form.minOrderQty),
        maxOrderQty: form.maxOrderQty ? Number(form.maxOrderQty) : null,
        pointPolicy,
        customPointRates: pointPolicy === 'CUSTOM' ? rates : null,
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

            {/* 2단계 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메인 카테고리 <span className="text-red-500">*</span>
              </label>
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
            {field('단위 (예: box, 개)', 'unit')}
            {field('사양', 'specifications')}
          </div>
        </div>

        {/* 가격/재고 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">가격 / 재고</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('판매가 (원)', 'price', 'number', true)}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">공급가 (원)</label>
              <input
                type="number"
                value={form.costPrice}
                onChange={(e) => set('costPrice', e.target.value)}
                placeholder="원가 입력 (내부 관리용)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {margin !== null && (
                <p className={`mt-1 text-xs font-medium ${Number(margin) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  마진율 {margin}% · 이익 {profit?.toLocaleString()}원
                </p>
              )}
            </div>
            {field('재고 수량', 'stockQuantity', 'number')}
            {field('최소 주문 수량', 'minOrderQty', 'number')}
            {field('최대 주문 수량 (미입력 시 무제한)', 'maxOrderQty', 'number')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">과세구분</label>
              <select
                value={form.taxType}
                onChange={(e) => set('taxType', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TAXABLE">과세 (VAT 10%)</option>
                <option value="ZERO_RATE">영세율 (0%)</option>
                <option value="TAX_EXEMPT">면세</option>
              </select>
            </div>
            {field('원산지 (예: 미국, 독일)', 'countryOfOrigin')}
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">상품 이미지</h2>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
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
                    className={`w-28 h-28 object-cover rounded-xl border-2 transition-colors ${img.isPrimary ? 'border-blue-500' : 'border-gray-200'}`}
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                  {!img.uploading && img.isPrimary && (
                    <span className="absolute top-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white">대표</span>
                  )}
                  {!img.uploading && (
                    <div className="absolute top-1 right-1 hidden gap-1 group-hover:flex">
                      {!img.isPrimary && (
                        <button type="button" onClick={() => setPrimary(idx)} className="rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white">대표</button>
                      )}
                      <button type="button" onClick={() => removeImage(idx)} className="rounded bg-red-500 p-0.5 text-white">
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">상품 상세 설명</label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '✦'}
                  {aiLoading ? 'AI 생성 중...' : 'AI로 설명 생성'}
                </button>
              </div>
              <RichTextEditor
                value={form.description}
                onChange={(html) => set('description', html)}
                onImageUpload={async (file) => {
                  const fd = new FormData();
                  fd.append('file', file);
                  const { data } = await adminApi.post('/admin/uploads/image', fd);
                  return data.url;
                }}
                placeholder="상품 상세 설명을 입력하세요. 이미지, 표, 링크 등을 삽입할 수 있습니다."
              />
            </div>
            {field('SDS 파일 URL', 'sdsFileUrl')}
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700">활성화 (전체)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDisplayed} onChange={(e) => set('isDisplayed', e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700">목록에 진열</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isOnSale} onChange={(e) => set('isOnSale', e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700">판매 가능</span>
              </label>
            </div>
          </div>
        </div>

        {/* 와이즈 적립률 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-1">와이즈 적립률</h2>
          <p className="text-xs text-gray-400 mb-4">배송 완료 시 구매 금액 기준으로 포인트를 적립합니다.</p>
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={pointPolicy === 'DEFAULT'} onChange={() => setPointPolicy('DEFAULT')} className="accent-blue-600" />
              <span className="text-sm text-gray-700">기본 설정 사용 <span className="text-gray-400">(그룹별 설정 따름)</span></span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={pointPolicy === 'CUSTOM'} onChange={() => setPointPolicy('CUSTOM')} className="accent-blue-600" />
              <span className="text-sm text-gray-700">개별 설정</span>
            </label>
          </div>
          {pointPolicy === 'CUSTOM' && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">그룹</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">그룹 기본 적립률</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">이 상품 개별 적립률 (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groups.map((g) => (
                    <tr key={g.id}>
                      <td className="px-4 py-2 font-medium text-gray-700">{g.name}</td>
                      <td className="px-4 py-2 text-gray-400">{g.pointRate}%</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={customPointRates[g.id] ?? ''}
                          onChange={(e) => setCustomPointRates((prev) => ({ ...prev, [g.id]: e.target.value }))}
                          placeholder={String(g.pointRate)}
                          className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</button>
          <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? '등록 중...' : '상품 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
