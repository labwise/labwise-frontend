'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  recipientName: z.string().min(2, '받는 분 이름을 입력하세요'),
  phone: z.string().min(10, '연락처를 입력하세요'),
  zipCode: z.string().min(5, '우편번호를 입력하세요'),
  address: z.string().min(5, '주소를 입력하세요'),
  addressDetail: z.string().optional(),
  memo: z.string().optional(),
  pointAmount: z.number().min(0).optional(),
  paymentMethod: z.enum(['CARD', 'VIRTUAL_ACCOUNT', 'BANK_TRANSFER', 'KAKAOPAY']),
  taxInvoiceRequested: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface SavedAddress {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  postalCode: string;
  address: string;
  addressDetail: string | null;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const [pointInput, setPointInput] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: 'CARD',
      taxInvoiceRequested: false,
      pointAmount: 0,
    },
  });

  const paymentMethod = watch('paymentMethod');

  const productTotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const shippingFee = productTotal >= 50000 ? 0 : 3000;
  const appliedPoints = Math.min(pointInput, user?.pointBalance ?? 0, productTotal);
  const finalAmount = productTotal - appliedPoints + shippingFee;

  useEffect(() => {
    if (!user) router.push('/login');
    if (items.length === 0) router.push('/cart');
  }, [user, items]);

  useEffect(() => {
    api.get('/shipping-addresses').then(({ data }) => {
      setSavedAddresses(data);
      const def = data.find((a: SavedAddress) => a.isDefault) ?? data[0];
      if (def) fillFromAddress(def);
    }).catch(() => {});
  }, []);

  const fillFromAddress = (addr: SavedAddress) => {
    setValue('recipientName', addr.recipientName);
    setValue('phone', addr.phone);
    setValue('zipCode', addr.postalCode);
    setValue('address', addr.address);
    setValue('addressDetail', addr.addressDetail ?? '');
    setSelectedAddressId(addr.id);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError('');
    try {
      const { data: order } = await api.post('/orders', {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: {
          recipientName: data.recipientName,
          phone: data.phone,
          zipCode: data.zipCode,
          address: data.address,
          addressDetail: data.addressDetail,
        },
        pointAmount: appliedPoints,
        paymentMethod: data.paymentMethod,
        taxInvoiceRequested: data.taxInvoiceRequested ?? false,
        memo: data.memo,
      });

      if (data.paymentMethod === 'BANK_TRANSFER') {
        await clearCart();
        router.push(`/my/orders/${order.id}?success=1`);
        return;
      }

      const tossPayments = (window as any).TossPayments;
      if (!tossPayments) {
        setError('결제 모듈 로드에 실패했습니다.');
        return;
      }

      const payments = tossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
      await payments.requestPayment(data.paymentMethod, {
        amount: finalAmount,
        orderId: order.id,
        orderName: `랩와이즈 주문 (${items.length}개 상품)`,
        customerName: user?.name,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (err: any) {
      setError(err.response?.data?.message ?? '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">주문 / 결제</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* 배송지 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">배송지 정보</h2>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker((v) => !v)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <MapPin className="h-4 w-4" />
                    배송지 선택
                  </button>
                )}
              </div>

              {showAddressPicker && savedAddresses.length > 0 && (
                <div className="mb-4 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${selectedAddressId === addr.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        checked={selectedAddressId === addr.id}
                        onChange={() => { fillFromAddress(addr); setShowAddressPicker(false); }}
                        className="mt-0.5"
                      />
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {addr.label ?? addr.recipientName}
                          {addr.isDefault && <span className="ml-2 text-xs text-blue-600 font-normal">기본</span>}
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
                <div className="col-span-2">
                  <Input label="주소" {...register('address')} error={errors.address?.message} />
                </div>
                <div className="col-span-2">
                  <Input label="상세 주소" {...register('addressDetail')} placeholder="동, 호수 등" />
                </div>
                <div className="col-span-2">
                  <Input label="배송 메모 (선택)" {...register('memo')} placeholder="문앞에 놓아주세요" />
                </div>
              </div>
            </div>

            {/* 포인트 */}
            {user && user.pointBalance > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 font-semibold text-gray-900">와이즈 사용</h2>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-500">보유 와이즈: <span className="font-medium text-blue-600">{formatPrice(user.pointBalance)}W</span></p>
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="number"
                      value={pointInput}
                      onChange={(e) => setPointInput(Number(e.target.value))}
                      min={0}
                      max={Math.min(user.pointBalance, productTotal)}
                      className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPointInput(Math.min(user.pointBalance, productTotal))}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      전액 사용
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 결제 수단 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-gray-900">결제 수단</h2>
              <div className="grid grid-cols-2 gap-3">
                {(['CARD', 'VIRTUAL_ACCOUNT', 'KAKAOPAY', 'BANK_TRANSFER'] as const).map((method) => {
                  const labels: Record<string, string> = {
                    CARD: '신용/체크카드',
                    VIRTUAL_ACCOUNT: '가상계좌',
                    KAKAOPAY: '카카오페이',
                    BANK_TRANSFER: '무통장 입금',
                  };
                  return (
                    <label
                      key={method}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${paymentMethod === method ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <input type="radio" value={method} {...register('paymentMethod')} className="sr-only" />
                      <span className="text-sm font-medium">{labels[method]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-gray-900">주문 상품 ({items.length})</h2>
              <div className="mb-4 space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-600">
                    <span className="line-clamp-1 flex-1">{item.productName}</span>
                    <span className="ml-2 flex-shrink-0">×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">상품 금액</span>
                  <span>{formatPrice(productTotal)}</span>
                </div>
                {appliedPoints > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>와이즈 할인</span>
                    <span>-{formatPrice(appliedPoints)}</span>
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
                </div>
              </div>

              {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

              <Button type="submit" className="mt-4 w-full" loading={submitting}>
                결제하기
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
