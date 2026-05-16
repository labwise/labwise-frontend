'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const err = params.get('error');

    if (err) {
      setError(decodeURIComponent(err));
      return;
    }

    if (!accessToken || !refreshToken) {
      setError('인증 정보를 받지 못했습니다.');
      return;
    }

    api
      .get('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(({ data: user }) => {
        setAuth(user, accessToken, refreshToken);
        router.replace('/');
      })
      .catch(() => setError('사용자 정보를 불러오지 못했습니다.'));
  }, [params, setAuth, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <a href="/login" className="text-blue-600 hover:underline text-sm">
            로그인 페이지로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">로그인 처리 중...</p>
    </div>
  );
}

export default function SocialCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-gray-500 text-sm">로그인 처리 중...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
