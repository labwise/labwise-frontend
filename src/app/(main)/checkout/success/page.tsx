'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Clock, Building2, Copy } from 'lucide-react';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface BankInfo { bankName: string; accountNumber: string; accountHolder: string; }
interface VirtualAccount { virtualAccountNumber: string; virtualAccountBank: string; virtualAccountExpiredAt: string; }

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'virtual_account' | 'bank_transfer' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [amount, setAmount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amountStr = searchParams.get('amount');
    const method = searchParams.get('method');

    if (method === 'BANK_TRANSFER') {
      clearCart();
      setAmount(Number(amountStr));
      api.get('/payments/bank-info').then(({ data }) => setBankInfo(data)).catch(() => {});
      setStatus('bank_transfer');
      return;
    }

    if (!paymentKey || !orderId || !amountStr) {
      setStatus('error');
      setMessage('결제 정보가 올바르지 않습니다.');
      return;
    }

    api
      .post('/payments/confirm', { paymentKey, orderId, amount: Number(amountStr) })
      .then(({ data }) => {
        clearCart();
        if (data.status === 'PENDING' && data.virtualAccountNumber) {
          setVirtualAccount({
            virtualAccountNumber: data.virtualAccountNumber,
            virtualAccountBank: data.virtualAccountBank,
            virtualAccountExpiredAt: data.virtualAccountExpiredAt,
          });
          setAmount(Number(amountStr));
          setStatus('virtual_account');
        } else {
          setStatus('success');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message ?? '결제 확인 중 오류가 발생했습니다.');
      });
  }, []);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-gray-500">결제 처리 중...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <p className="mb-4 text-red-600">{message}</p>
          <Button variant="outline" onClick={() => router.push('/cart')}>
            장바구니로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'bank_transfer') {
    const donationAmt = Math.floor(amount * 0.015);
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Clock className="mx-auto mb-4 h-16 w-16 text-amber-500" />
          <h1 className="mb-2 text-xl font-bold text-gray-900">주문이 접수되었습니다</h1>
          <p className="mb-6 text-sm text-gray-500">아래 계좌로 입금 후 관리자가 확인하면 처리됩니다.</p>
          {donationAmt > 0 && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              🌱 이 구매로 <span className="font-semibold">{formatPrice(donationAmt)}</span>이 기부 적립됩니다
            </div>
          )}

          {bankInfo && (
            <div className="mb-6 rounded-xl bg-amber-50 p-5 text-left">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
                <Building2 size={16} />
                무통장 입금 계좌
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">은행</span>
                  <span className="font-medium">{bankInfo.bankName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">계좌번호</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{bankInfo.accountNumber}</span>
                    <button
                      onClick={() => copyText(bankInfo.accountNumber)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">예금주</span>
                  <span className="font-medium">{bankInfo.accountHolder}</span>
                </div>
                <div className="flex justify-between border-t border-amber-200 pt-2">
                  <span className="text-gray-500">입금 금액</span>
                  <span className="font-bold text-amber-700">{formatPrice(amount)}</span>
                </div>
              </div>
              {copied && <p className="mt-2 text-center text-xs text-green-600">복사됨!</p>}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/products')}>
              쇼핑 계속하기
            </Button>
            <Button className="flex-1" onClick={() => router.push('/my/orders')}>
              주문 내역 보기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'virtual_account' && virtualAccount) {
    const expiry = virtualAccount.virtualAccountExpiredAt
      ? new Date(virtualAccount.virtualAccountExpiredAt).toLocaleString('ko-KR')
      : '24시간 이내';
    const donationAmt = Math.floor(amount * 0.015);
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Clock className="mx-auto mb-4 h-16 w-16 text-blue-500" />
          <h1 className="mb-2 text-xl font-bold text-gray-900">가상계좌가 발급되었습니다</h1>
          <p className="mb-6 text-sm text-gray-500">아래 계좌로 입금하시면 자동으로 처리됩니다.</p>
          {donationAmt > 0 && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              🌱 이 구매로 <span className="font-semibold">{formatPrice(donationAmt)}</span>이 기부 적립됩니다
            </div>
          )}

          <div className="mb-6 rounded-xl bg-blue-50 p-5 text-left">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-800">
              <Building2 size={16} />
              가상계좌 정보
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">은행</span>
                <span className="font-medium">{virtualAccount.virtualAccountBank}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">계좌번호</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{virtualAccount.virtualAccountNumber}</span>
                  <button
                    onClick={() => copyText(virtualAccount.virtualAccountNumber)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">입금 금액</span>
                <span className="font-bold text-blue-700">{formatPrice(amount)}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2 text-xs">
                <span className="text-gray-400">입금 기한</span>
                <span className="text-red-500 font-medium">{expiry}까지</span>
              </div>
            </div>
            {copied && <p className="mt-2 text-center text-xs text-green-600">복사됨!</p>}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/products')}>
              쇼핑 계속하기
            </Button>
            <Button className="flex-1" onClick={() => router.push('/my/orders')}>
              주문 내역 보기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 일반 카드 결제 완료
  const cardAmount = Number(searchParams.get('amount') ?? 0);
  const donationAmt = Math.floor(cardAmount * 0.015);
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">결제가 완료되었습니다!</h1>
        <p className="mb-6 text-gray-500">주문이 정상적으로 접수되었습니다.</p>
        {donationAmt > 0 && (
          <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            🌱 이 구매로 <span className="font-semibold">{formatPrice(donationAmt)}</span>이 기부 적립됩니다
          </div>
        )}
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => router.push('/products')}>
            쇼핑 계속하기
          </Button>
          <Button onClick={() => router.push('/my/orders')}>
            주문 내역 보기
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
