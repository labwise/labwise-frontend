'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useActiveIntegrations } from '@/hooks/useActiveIntegrations';
import { Logo } from '@/components/Logo';

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

type FormData = z.infer<typeof schema>;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const { hasGoogle, hasKakao, hasNaver, hasSocial } = useActiveIntegrations();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const { data: res } = await api.post('/auth/login', data);
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? '로그인에 실패했습니다.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <Logo className="h-14 w-auto" />
          </Link>
          <h2 className="mt-5 text-xl font-semibold text-gray-700">로그인</h2>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
          {hasSocial && (
            <>
              <div className="space-y-2 mb-6">
                {hasKakao && (
                  <a
                    href={`${BACKEND_URL}/auth/kakao`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-[#FEE500] py-2.5 text-sm font-medium text-gray-900 hover:bg-[#f0d800]"
                  >
                    <KakaoIcon />
                    카카오로 로그인
                  </a>
                )}
                {hasNaver && (
                  <a
                    href={`${BACKEND_URL}/auth/naver`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#03C75A] py-2.5 text-sm font-medium text-white hover:bg-[#02b350]"
                  >
                    <NaverIcon />
                    네이버로 로그인
                  </a>
                )}
                {hasGoogle && (
                  <a
                    href={`${BACKEND_URL}/auth/google`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <GoogleIcon />
                    구글로 로그인
                  </a>
                )}
              </div>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-xs text-gray-400"><span className="bg-white px-2">또는 이메일로 로그인</span></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="email"
              label="이메일"
              type="email"
              placeholder="example@labwise.kr"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              id="password"
              label="비밀번호"
              type="password"
              placeholder="비밀번호 입력"
              {...register('password')}
              error={errors.password?.message}
            />

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              로그인
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.64 1.68 4.97 4.24 6.32l-.85 3.14 3.65-2.4C10.65 17.84 11.32 18 12 18c4.97 0 9-3.36 9-7.5S16.97 3 12 3z" fill="#3C1E1E"/>
    </svg>
  );
}

function NaverIcon() {
  return <span className="font-bold text-base leading-none">N</span>;
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
