'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function FailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get('message') ?? '결제가 취소되었거나 실패했습니다.';
  const code = searchParams.get('code');

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <XCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
        <h1 className="mb-2 text-xl font-bold text-gray-900">결제에 실패했습니다</h1>
        <p className="mb-2 text-sm text-gray-500">{message}</p>
        {code && <p className="mb-6 text-xs text-gray-400">오류 코드: {code}</p>}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.push('/cart')}>
            장바구니로 돌아가기
          </Button>
          <Button className="flex-1" onClick={() => router.back()}>
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <FailContent />
    </Suspense>
  );
}
