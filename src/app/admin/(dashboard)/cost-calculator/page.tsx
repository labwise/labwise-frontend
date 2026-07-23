'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CostCalculatorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/sourcing/batches');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">
        원가 계산기(구)는 소싱 배치 화면으로 이전되었습니다. 이동 중...
      </p>
    </div>
  );
}
