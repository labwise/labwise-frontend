'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Plus, Minus } from 'lucide-react';
import { useCartStore, type CartItem } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { formatPrice, formatWise } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  recipientName: z.string().min(2, '받는 분 이름을 입력하세요'),
  phone: z.string().min(10, '연락처를 입력하세요'),
  zipCode: z.string().min(5, '우편번호를 입력하세요'),
  address: z.string().min(5, '주소를 입력하세요'),
  addressDetail: z.string().optional(),
  memo: z.string().optional(),
  paymentMethod: z.enum(['CARD', 'VIRTUAL_ACCOUNT', 'BANK_TRANSFER']),
  taxInvoiceRequested: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface SavedAddress {
  id: string; label: string | null;
  recipientName: string; phone: string;
  postalCode: string; address: string;
  addressDetail: string | null; isDefault: boolean;
}

interface MyCoupon {
  id: string;
  couponId: string;
  usedAt: string | null;
  coupon: {
    id: string; name: string; type: 'FIXED' | 'PERCENT' | 'FREE_SHIPPING';
    discountAmount?: number; discountRate?: number; maxDiscountAmount?: number;
    minOrderAmount: number; isActive: boolean;
    validFrom?: string | null; validTo?: string | null;
  };
}

export interface BuyNowItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  stockQuantity: number;
  minOrderQty: number;
  maxOrderQty?: number;
}

const PAYMENT_METHODS = [
  { value: 'CARD', label: '신용/체크카드', desc: '' },
  { value: 'VIRTUAL_ACCOUNT', label: '가상계좌', desc: '24시간 내 입금 필요' },
  { value: 'BANK_TRANSFER', label: '무통장 입금', desc: '관리자 확인 후 처리' },
] as const;

function QtyControl({
  qty, min, max, onChange,
}: { qty: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center rounded-md border border-gray-300">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, qty - 1))}
        disabled={qty <= min}
        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-8 text-center text-sm font-medium">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, qty + 1))}
        disabled={qty >= max}
        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

interface EstimateCheckoutItem {
  key: string; productId: string; productName: string;
  unitPrice: number; quantity: number;
  stockQuantity: number; minQty: number; maxQty: number;
}

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get('mode') === 'buyNow';
  const estimateId = searchParams.get('estimateId');

  const { user } = useAuthStore();
  const { items: cartItems, clearCart, fetchCart, updateItem } = useCartStore();

  const [cartReady, setCartReady] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
  const [estimateItems, setEstimateItems] = useState<EstimateCheckoutItem[]>([]);
  // local qty overrides (productId → qty)
  const [localQtys, setLocalQtys] = useState<Record<string, number>>({});

  const [pointInput, setPointInput] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const [myCoupons, setMyCoupons] = useState<MyCoupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const loadMyCoupons = useCallback(() => {
    api.get('/coupons/my').then(({ data }) => setMyCoupons(data)).catch(() => {});
  }, []);

  useEffect(() => { loadMyCoupons(); }, [loadMyCoupons]);

  const handleRedeemCode = async () => {
    if (!couponCode.trim()) return;
    setRedeeming(true);
    setCouponError('');
    try {
      await api.post('/coupons/redeem', { code: couponCode.trim() });
      setCouponCode('');
      loadMyCoupons();
    } catch (err: any) {
      setCouponError(err.response?.data?.message ?? '쿠폰 등록에 실패했습니다.');
    } finally {
      setRedeeming(false);
    }
  };

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'CARD', taxInvoiceRequested: false },
  });

  const paymentMethod = watch('paymentMethod');

  // ── 초기화 ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { router.push('/login'); return; }

    if (estimateId) {
      // 견적서 결제 모드
      api.get(`/estimates/${estimateId}`).then(({ data }) => {
        const items: EstimateCheckoutItem[] = (data.items ?? []).map((item: any, idx: number) => ({
          key: `est-${idx}`,
          productId: item.productId ?? '',
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          stockQuantity: 9999,
          minQty: 1,
          maxQty: 9999,
        }));
        setEstimateItems(items);
        setCartReady(true);
      }).catch(() => {
        router.push('/my/estimates');
      });
    } else if (isBuyNow) {
      try {
        const raw = sessionStorage.getItem('labwise_buy_now');
        if (raw) {
          const item: BuyNowItem = JSON.parse(raw);
          setBuyNowItem(item);
          setLocalQtys({ [item.productId]: item.quantity });
        } else {
          router.push('/products');
          return;
        }
      } catch {
        router.push('/products');
        return;
      }
      setCartReady(true);
    } else {
      fetchCart().then(() => setCartReady(true));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cartReady) return;
    if (!isBuyNow && !estimateId && cartItems.length === 0) router.push('/cart');
  }, [cartReady, cartItems, isBuyNow, estimateId, router]);

  useEffect(() => {
    api.get('/shipping-addresses').then(({ data }) => {
      setSavedAddresses(data);
      const def = data.find((a: SavedAddress) => a.isDefault) ?? data[0];
      if (def) fillFromAddress(def);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 수량 변경 ──────────────────────────────────────────────────────────────
  const handleQtyChange = useCallback(async (item: { productId: string; key?: string }, newQty: number) => {
    const productId = item.productId;
    setLocalQtys((prev) => ({ ...prev, [productId]: newQty }));

    // 장바구니 모드: 서버 동기화
    if (!isBuyNow) {
      const cartItem = cartItems.find((ci) => ci.productId === productId);
      if (cartItem) {
        try { await updateItem(cartItem.id, newQty); } catch {}
      }
    }
  }, [isBuyNow, cartItems, updateItem]);

  // ── 실제 결제 아이템 목록 ──────────────────────────────────────────────────
  const displayItems: EstimateCheckoutItem[] = estimateId
    ? estimateItems
    : isBuyNow && buyNowItem
      ? [{
          key: buyNowItem.productId,
          productId: buyNowItem.productId,
          productName: buyNowItem.productName,
          unitPrice: buyNowItem.unitPrice,
          quantity: localQtys[buyNowItem.productId] ?? buyNowItem.quantity,
          stockQuantity: buyNowItem.stockQuantity,
          minQty: buyNowItem.minOrderQty,
          maxQty: Math.min(buyNowItem.maxOrderQty ?? 9999, buyNowItem.stockQuantity),
        }]
      : cartItems.map((ci) => ({
          key: ci.id,
          productId: ci.productId,
          productName: ci.productName,
          unitPrice: ci.unitPrice,
          quantity: localQtys[ci.productId] ?? ci.quantity,
          stockQuantity: 9999,
          minQty: 1,
          maxQty: 9999,
        }));

  const productTotal = displayItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const now = Date.now();
  const usableCoupons = myCoupons.filter((uc) => {
    if (uc.usedAt || !uc.coupon.isActive) return false;
    if (uc.coupon.validFrom && now < new Date(uc.coupon.validFrom).getTime()) return false;
    if (uc.coupon.validTo && now > new Date(uc.coupon.validTo).getTime()) return false;
    return true;
  });
  const selectedCoupon = usableCoupons.find((uc) => uc.couponId === selectedCouponId) ?? null;
  const couponMeetsMin = !selectedCoupon || productTotal >= selectedCoupon.coupon.minOrderAmount;

  let couponDiscount = 0;
  let couponFreeShipping = false;
  if (selectedCoupon && couponMeetsMin) {
    const c = selectedCoupon.coupon;
    if (c.type === 'FIXED') {
      couponDiscount = Math.min(c.discountAmount ?? 0, productTotal);
    } else if (c.type === 'PERCENT') {
      couponDiscount = Math.floor((productTotal * (c.discountRate ?? 0)) / 100);
      if (c.maxDiscountAmount) couponDiscount = Math.min(couponDiscount, c.maxDiscountAmount);
    } else if (c.type === 'FREE_SHIPPING') {
      couponFreeShipping = true;
    }
  }

  const shippingFee = couponFreeShipping ? 0 : productTotal >= 50000 ? 0 : 3000;
  const appliedPoints = Math.min(pointInput, user?.pointBalance ?? 0, productTotal - couponDiscount);
  const finalAmount = Math.max(0, productTotal - couponDiscount - appliedPoints) + shippingFee;

  // ── 주소 자동 입력 ─────────────────────────────────────────────────────────
  const fillFromAddress = (addr: SavedAddress) => {
    setValue('recipientName', addr.recipientName);
    setValue('phone', addr.phone);
    setValue('zipCode', addr.postalCode);
    setValue('address', addr.address);
    setValue('addressDetail', addr.addressDetail ?? '');
    setSelectedAddressId(addr.id);
  };

  // ── 주문 제출 ──────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError('');

    const orderPayload = {
      items: displayItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      shippingAddress: {
        recipientName: data.recipientName, phone: data.phone,
        zipCode: data.zipCode, address: data.address, addressDetail: data.addressDetail ?? '',
      },
      pointAmount: appliedPoints,
      paymentMethod: data.paymentMethod,
      taxInvoiceRequested: data.taxInvoiceRequested ?? false,
      memo: data.memo,
      ...(selectedCoupon && couponMeetsMin ? { couponId: selectedCoupon.couponId } : {}),
      ...(estimateId ? { estimateId } : {}),
    };

    try {
      // ── 무통장 입금: 주문 먼저 생성 ─────────────────────────────────────
      if (data.paymentMethod === 'BANK_TRANSFER') {
        const { data: order } = await api.post('/orders', orderPayload);
        if (isBuyNow) sessionStorage.removeItem('labwise_buy_now');
        else if (!estimateId) await clearCart();
        router.push(`/checkout/success?orderId=${order.id}&method=BANK_TRANSFER&amount=${finalAmount}`);
        return;
      }

      // ── 카드 / 가상계좌: Toss 먼저 → 성공 시 주문 생성 ─────────────────
      const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');
      const { data: payConfig } = await api.get('/payments/config');
      const clientKey: string = payConfig.clientKey;
      if (!clientKey) {
        setError('결제 설정 오류: 관리자 페이지에서 토스페이먼츠 클라이언트 키를 설정해주세요.');
        return;
      }

      // 임시 tossOrderId 생성 (DB 주문 없이 Toss 호출)
      const tossOrderId = crypto.randomUUID();
      // 결제 성공 후 success 페이지에서 주문 생성에 필요한 데이터 저장
      sessionStorage.setItem(
        `labwise_toss_order_${tossOrderId}`,
        JSON.stringify({ ...orderPayload, amount: finalAmount }),
      );

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: user?.id ?? ANONYMOUS });
      const orderName =
        displayItems.length === 1
          ? displayItems[0].productName
          : `${displayItems[0].productName} 외 ${displayItems.length - 1}개`;

      await payment.requestPayment({
        method: data.paymentMethod as any,
        amount: { currency: 'KRW', value: finalAmount },
        orderId: tossOrderId,
        orderName,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: user?.email,
        customerName: user?.name,
      });

      // 여기까지 오면 결제 성공 (Toss가 successUrl로 redirect함)
      // 카트/buyNow 정리는 success 페이지에서 처리
    } catch (err: any) {
      if (err?.code === 'USER_CANCEL') {
        // 취소 시 주문이 생성되지 않았으므로 DB 정리 불필요
        setError('결제를 취소하셨습니다.');
        return;
      }
      setError(err.response?.data?.message ?? err?.message ?? '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cartReady) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">주문 / 결제</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* 배송지 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">배송지 정보</h2>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker((v) => !v)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <MapPin className="h-4 w-4" /> 배송지 선택
                  </button>
                )}
              </div>
              {showAddressPicker && savedAddresses.length > 0 && (
                <div className="mb-4 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                        selectedAddressId === addr.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio" name="savedAddress"
                        checked={selectedAddressId === addr.id}
                        onChange={() => { fillFromAddress(addr); setShowAddressPicker(false); }}
                        className="mt-0.5"
                      />
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {addr.label ?? addr.recipientName}
                          {addr.isDefault && <span className="ml-2 text-xs font-normal text-blue-600">기본</span>}
                        </p>
                        <p className="text-gray-500">{addr.recipientName} · {addr.phone}</p>
                        <p className="text-gray-500">[{addr.postalCode}] {addr.address} {addr.addressDetail ?? ''}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input label="받는 분" {...register('recipientName')} error={errors.recipientName?.message} />
                <Input label="연락처" {...register('phone')} placeholder="010-1234-5678" error={errors.phone?.message} />
                <Input label="우편번호" {...register('zipCode')} error={errors.zipCode?.message} />
                <div className="col-span-2"><Input label="주소" {...register('address')} error={errors.address?.message} /></div>
                <div className="col-span-2"><Input label="상세 주소" {...register('addressDetail')} placeholder="동, 호수 등" /></div>
                <div className="col-span-2"><Input label="배송 메모 (선택)" {...register('memo')} placeholder="문앞에 놓아주세요" /></div>
              </div>
            </div>

            {/* 쿠폰 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-gray-900">쿠폰 사용</h2>
              <div className="mb-3 flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="쿠폰 코드 입력"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={handleRedeemCode}
                  disabled={redeeming}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  {redeeming ? '등록 중...' : '코드 등록'}
                </button>
              </div>
              {couponError && <p className="mb-3 text-xs text-red-500">{couponError}</p>}

              {usableCoupons.length === 0 ? (
                <p className="text-sm text-gray-400">사용 가능한 쿠폰이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-500">
                    <input type="radio" checked={selectedCouponId === null} onChange={() => setSelectedCouponId(null)} />
                    쿠폰 사용 안 함
                  </label>
                  {usableCoupons.map((uc) => {
                    const belowMin = productTotal < uc.coupon.minOrderAmount;
                    const benefit =
                      uc.coupon.type === 'FIXED' ? `${uc.coupon.discountAmount?.toLocaleString()}원 할인`
                      : uc.coupon.type === 'PERCENT' ? `${uc.coupon.discountRate}% 할인`
                      : '무료배송';
                    return (
                      <label
                        key={uc.id}
                        className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                          selectedCouponId === uc.couponId ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                        } ${belowMin ? 'opacity-50' : ''}`}
                      >
                        <input
                          type="radio"
                          className="mt-0.5"
                          disabled={belowMin}
                          checked={selectedCouponId === uc.couponId}
                          onChange={() => setSelectedCouponId(uc.couponId)}
                        />
                        <span>
                          <span className="block font-medium text-gray-900">{uc.coupon.name}</span>
                          <span className="block text-xs text-gray-500">
                            {benefit}
                            {uc.coupon.minOrderAmount > 0 && ` · ${uc.coupon.minOrderAmount.toLocaleString()}원 이상`}
                            {belowMin && ' (최소 주문금액 미달)'}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 와이즈 포인트 */}
            {user && user.pointBalance > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 font-semibold text-gray-900">와이즈 사용</h2>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-500">
                    보유 와이즈: <span className="font-medium text-blue-600">{formatWise(user.pointBalance)}</span>
                  </p>
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="number" value={pointInput}
                      onChange={(e) => setPointInput(Number(e.target.value))}
                      min={0} max={Math.min(user.pointBalance, productTotal)}
                      className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <button type="button" onClick={() => setPointInput(Math.min(user.pointBalance, productTotal))} className="text-sm text-blue-600 hover:text-blue-700">
                      전액 사용
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 결제 수단 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-gray-900">결제 수단</h2>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 transition-colors ${
                      paymentMethod === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" value={value} {...register('paymentMethod')} className="sr-only" />
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    {desc && <span className="text-xs text-gray-400">{desc}</span>}
                  </label>
                ))}
              </div>
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 space-y-1">
                  <p className="font-medium">⚠️ 주문 후 24시간 내 입금이 확인되지 않으면 주문이 자동 취소됩니다.</p>
                  <p>주문 완료 후 안내되는 계좌로 입금하시면 관리자가 확인 후 처리합니다.</p>
                  <p>예약된 재고·사용 포인트·쿠폰은 자동 취소 시 복구됩니다.</p>
                </div>
              )}
              {paymentMethod === 'VIRTUAL_ACCOUNT' && (
                <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                  결제 완료 후 발급된 가상계좌로 24시간 내 입금하시면 자동으로 처리됩니다.
                </div>
              )}
            </div>

            {/* 세금계산서 */}
            {user?.taxInvoiceEnabled && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" {...register('taxInvoiceRequested')} className="h-4 w-4 rounded accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">세금계산서 발행 요청</span>
                </label>
              </div>
            )}
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-gray-900">주문 상품 ({displayItems.length})</h2>
              <div className="mb-4 space-y-3 text-sm">
                {displayItems.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <p className="line-clamp-2 text-gray-700 font-medium text-xs leading-tight">{item.productName}</p>
                    <div className="flex items-center justify-between">
                      <QtyControl
                        qty={item.quantity}
                        min={item.minQty}
                        max={item.maxQty}
                        onChange={(n) => handleQtyChange(item, n)}
                      />
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                    {item.quantity >= item.stockQuantity && item.stockQuantity < 9999 && (
                      <p className="text-xs text-red-500">재고 최대 수량입니다</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">상품 금액</span>
                  <span>{formatPrice(productTotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>쿠폰 할인</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                {couponFreeShipping && (
                  <div className="flex justify-between text-blue-600">
                    <span>쿠폰</span>
                    <span>무료배송 적용</span>
                  </div>
                )}
                {appliedPoints > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>와이즈 할인</span>
                    <span>-{formatWise(appliedPoints)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">배송비</span>
                  <span>{shippingFee === 0 ? '무료' : formatPrice(shippingFee)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <div className="flex justify-between font-bold">
                    <span>총 결제 금액</span>
                    <span className="text-blue-600">{formatPrice(finalAmount)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                    <span>이 구매로 기부 적립</span>
                    <span className="font-semibold">{formatPrice(Math.floor(finalAmount * 0.015))}</span>
                  </div>
                </div>
              </div>

              {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
              <Button type="submit" className="mt-4 w-full" loading={submitting}>
                {paymentMethod === 'BANK_TRANSFER' ? '주문 완료' : '결제하기'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  );
}
