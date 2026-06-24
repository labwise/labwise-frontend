'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Search, Plus, Trash2, FileText, X } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

interface EstimateItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

function EstimateNewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 즐겨찾기에서 자동 진입 시 상품 미리 세팅
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    if (!prefill) return;
    try {
      const products: Product[] = JSON.parse(decodeURIComponent(prefill));
      setItems(products.map((p) => ({
        productId: p.id,
        productName: p.name,
        quantity: 1,
        unitPrice: p.effectivePrice ?? p.price,
        subtotal: p.effectivePrice ?? p.price,
        imageUrl: p.images?.find((i) => i.isPrimary)?.url ?? p.images?.[0]?.url,
      })));
    } catch {}
  }, [searchParams]);

  function handleKeywordChange(val: string) {
    setKeyword(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get('/products', { params: { keyword: val, limit: 8 } });
        setSearchResults(data.items ?? data);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function addProduct(product: Product) {
    const exists = items.find((i) => i.productId === product.id);
    if (exists) {
      updateQty(items.indexOf(exists), exists.quantity + 1);
      return;
    }
    const price = product.effectivePrice ?? product.price;
    setItems((prev) => [...prev, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: price,
      subtotal: price,
      imageUrl: product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url,
    }]);
    setKeyword('');
    setSearchResults([]);
  }

  function updateQty(idx: number, qty: number) {
    if (qty < 1) return;
    setItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, quantity: qty, subtotal: item.unitPrice * qty } : item
    ));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);

  async function handleSave() {
    if (!buyerCompany.trim()) { setError('상호명을 입력해주세요.'); return; }
    if (items.length === 0) { setError('상품을 1개 이상 추가해주세요.'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/estimates', {
        buyerCompany: buyerCompany.trim(),
        buyerContact: buyerContact.trim() || undefined,
        buyerPhone: buyerPhone.trim() || undefined,
        items: items.map(({ imageUrl: _img, ...i }) => i),
        totalAmount,
      });
      router.push(`/my/estimates?highlight=${data.id}`);
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <FileText className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">견적서 만들기</h1>
      </div>

      {/* 상품 검색 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">상품 추가</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="상품명으로 검색..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {keyword && (
            <button onClick={() => { setKeyword(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {(searching || searchResults.length > 0) && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-lg">
            {searching ? (
              <div className="p-4 text-center text-sm text-gray-400">검색 중...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">검색 결과가 없습니다.</div>
            ) : (
              searchResults.map((product) => {
                const img = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
                return (
                  <button key={product.id} onClick={() => addProduct(product)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {img && <Image src={img.url} alt={product.name} width={40} height={40} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">{formatPrice(product.effectivePrice ?? product.price)}</p>
                    </div>
                    <Plus className="h-4 w-4 flex-shrink-0 text-blue-500" />
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 품목 목록 */}
      {items.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">품목 목록 ({items.length}개)</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-5 py-3">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} width={40} height={40} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{item.productName}</p>
                  <p className="text-xs text-gray-500">{formatPrice(item.unitPrice)} / 개</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQty(idx, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50">-</button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQty(idx, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50">+</button>
                </div>
                <p className="w-24 text-right text-sm font-bold text-blue-600">{formatPrice(item.subtotal)}</p>
                <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3 rounded-b-xl">
            <span className="text-sm text-gray-500">총 합계 (VAT 포함)</span>
            <span className="text-lg font-bold text-blue-600">{formatPrice(totalAmount)}</span>
          </div>
        </div>
      )}

      {/* 공급받는자 정보 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">공급받는자 정보</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">상호명 *</label>
            <input value={buyerCompany} onChange={(e) => setBuyerCompany(e.target.value)}
              placeholder="예: OO대학교 OO연구실"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">담당자</label>
              <input value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">연락처</label>
              <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="예: 02-0000-0000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button onClick={() => router.back()}
          className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
          취소
        </button>
        <button onClick={handleSave} disabled={saving || items.length === 0}
          className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? '저장 중...' : '견적서 저장'}
        </button>
      </div>
    </div>
  );
}

export default function EstimateNewPage() {
  return (
    <Suspense>
      <EstimateNewInner />
    </Suspense>
  );
}
