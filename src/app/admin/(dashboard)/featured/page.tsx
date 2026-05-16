'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface FeaturedConfig {
  id: number;
  mode: 'LATEST' | 'MANUAL';
  limit: number;
}

interface FeaturedItem {
  id: string;
  productId: string;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    price: number;
    effectivePrice?: number;
    images: { url: string; isPrimary: boolean }[];
  };
}

interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  sku?: string;
}

export default function FeaturedAdminPage() {
  const [config, setConfig] = useState<FeaturedConfig | null>(null);
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [mode, setMode] = useState<'LATEST' | 'MANUAL'>('LATEST');
  const [limit, setLimit] = useState(8);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadConfig();
    loadItems();
  }, []);

  async function loadConfig() {
    const { data } = await adminApi.get('/admin/featured/config');
    setConfig(data);
    setMode(data.mode);
    setLimit(data.limit);
  }

  async function loadItems() {
    const { data } = await adminApi.get('/admin/featured/products');
    setItems(data);
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await adminApi.put('/admin/featured/config', { mode, limit });
      await loadConfig();
      alert('설정이 저장되었습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    try {
      const { data } = await adminApi.get('/admin/products', { params: { search, limit: 10 } });
      setSearchResults(data.items ?? data);
    } finally {
      setSearching(false);
    }
  }

  async function addProduct(productId: string) {
    await adminApi.post('/admin/featured/products', { productId });
    await loadItems();
    setSearchResults([]);
    setSearch('');
  }

  async function removeProduct(id: string) {
    await adminApi.delete(`/admin/featured/products/${id}`);
    await loadItems();
  }

  async function moveItem(index: number, direction: 'up' | 'down') {
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    const reordered = newItems.map((item, i) => ({ ...item, sortOrder: i }));
    setItems(reordered);
    await adminApi.put('/admin/featured/products/order', {
      items: reordered.map((item) => ({ id: item.id, sortOrder: item.sortOrder })),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">추천 상품 관리</h1>
        <p className="mt-1 text-sm text-gray-500">메인 화면에 노출할 추천 상품을 설정합니다.</p>
      </div>

      {/* Config Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800">노출 방식 설정</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">노출 방식</label>
            <div className="flex gap-3">
              {(['LATEST', 'MANUAL'] as const).map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    {m === 'LATEST' ? '최신 상품 자동 노출' : '직접 선택'}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">최대 노출 수</label>
            <input
              type="number"
              min={1}
              max={20}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* Manual selection */}
      {mode === 'MANUAL' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">추천 상품 목록</h2>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품명으로 검색..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={searching}
              className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              검색 후 추가
            </button>
          </form>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mb-4 rounded-lg border border-gray-200">
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    {p.sku && <p className="text-xs text-gray-400">{p.sku}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-blue-600">
                      {formatPrice(p.price)}원
                    </span>
                    <button
                      onClick={() => addProduct(p.id)}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      추가
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current list */}
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              추천 상품을 추가해주세요. 위에서 상품을 검색하여 추가할 수 있습니다.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {items.map((item, idx) => {
                const img = item.product?.images?.find((i) => i.isPrimary) ?? item.product?.images?.[0];
                const price = item.product?.effectivePrice ?? item.product?.price;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-6 text-center text-xs font-bold text-gray-400">
                      {idx + 1}
                    </span>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.url}
                        alt={item.product?.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-lg">
                        📦
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {item.product?.name}
                      </p>
                      {price !== undefined && (
                        <p className="text-xs text-blue-600 font-semibold">{formatPrice(price)}원</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveItem(idx, 'down')}
                        disabled={idx === items.length - 1}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeProduct(item.id)}
                        className="rounded p-1 text-red-400 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {mode === 'LATEST' && config && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          현재 <strong>최신 상품 자동 노출</strong> 모드입니다. 최근 등록된 상품 상위{' '}
          <strong>{config.limit}개</strong>가 메인 화면에 자동으로 표시됩니다.
        </div>
      )}
    </div>
  );
}
