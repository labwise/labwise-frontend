'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useActiveIntegrations } from '@/hooks/useActiveIntegrations';

const schema = z
  .object({
    name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
    email: z.string().email('올바른 이메일을 입력하세요'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
    passwordConfirm: z.string(),
    phone: z.string().min(10, '휴대폰 번호를 입력하세요'),
    otpCode: z.string().length(6, '인증번호 6자리를 입력하세요'),
    postalCode: z.string().min(5, '우편번호를 입력하세요'),
    address: z.string().min(5, '주소를 입력하세요'),
    addressDetail: z.string().optional(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  });

type FormData = z.infer<typeof schema>;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function openDaumPostcode(onSelect: (postcode: string, address: string) => void) {
  const url = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
  const load = () => {
    new (window as any).daum.Postcode({
      oncomplete(data: any) {
        onSelect(data.zonecode, data.roadAddress || data.jibunAddress);
      },
    }).open();
  };

  if ((window as any).daum?.Postcode) {
    load();
    return;
  }
  const script = document.createElement('script');
  script.src = url;
  script.onload = load;
  document.head.appendChild(script);
}

interface Agreements {
  all: boolean;
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
  age: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [agreements, setAgreements] = useState<Agreements>({
    all: false, terms: false, privacy: false, marketing: false, age: false,
  });
  const { hasGoogle, hasKakao, hasNaver, hasSocial } = useActiveIntegrations();

  const toggleAll = (checked: boolean) => {
    setAgreements({ all: checked, terms: checked, privacy: checked, marketing: checked, age: checked });
  };

  const toggleOne = (key: keyof Omit<Agreements, 'all'>, checked: boolean) => {
    const next = { ...agreements, [key]: checked };
    next.all = next.terms && next.privacy && next.marketing && next.age;
    setAgreements(next);
  };

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleSendOtp = async () => {
    const phone = getValues('phone');
    if (!phone || phone.length < 10) {
      setOtpError('휴대폰 번호를 먼저 입력하세요.');
      return;
    }
    setOtpError('');
    setOtpLoading(true);
    try {
      await api.post('/auth/otp/send', { phone });
      setOtpSent(true);
      setOtpVerified(false);
    } catch (e: any) {
      setOtpError(e.response?.data?.message ?? '발송에 실패했습니다.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const phone = getValues('phone');
    const code = getValues('otpCode');
    if (!code || code.length !== 6) {
      setOtpError('인증번호 6자리를 입력하세요.');
      return;
    }
    setOtpError('');
    setOtpLoading(true);
    try {
      await api.post('/auth/otp/verify', { phone, code });
      setOtpVerified(true);
      setOtpError('');
    } catch (e: any) {
      setOtpError(e.response?.data?.message ?? '인증에 실패했습니다.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSearchPostcode = () => {
    openDaumPostcode((postcode, address) => {
      setValue('postalCode', postcode, { shouldValidate: true });
      setValue('address', address, { shouldValidate: true });
    });
  };

  const onSubmit = async (data: FormData) => {
    if (!otpVerified) {
      setError('휴대폰 인증을 완료해주세요.');
      return;
    }
    if (!agreements.terms || !agreements.privacy || !agreements.age) {
      setError('필수 약관에 모두 동의해주세요.');
      return;
    }
    setError('');
    try {
      const { data: res } = await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        postalCode: data.postalCode,
        address: data.address,
        addressDetail: data.addressDetail,
      });
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">랩와이즈</span>
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-gray-700">회원가입</h2>
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
                    카카오로 시작하기
                  </a>
                )}
                {hasNaver && (
                  <a
                    href={`${BACKEND_URL}/auth/naver`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#03C75A] py-2.5 text-sm font-medium text-white hover:bg-[#02b350]"
                  >
                    <NaverIcon />
                    네이버로 시작하기
                  </a>
                )}
                {hasGoogle && (
                  <a
                    href={`${BACKEND_URL}/auth/google`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <GoogleIcon />
                    구글로 시작하기
                  </a>
                )}
              </div>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-xs text-gray-400"><span className="bg-white px-2">또는 이메일로 가입</span></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="name"
              label="이름"
              placeholder="홍길동"
              {...register('name')}
              error={errors.name?.message}
            />
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
              placeholder="8자 이상"
              {...register('password')}
              error={errors.password?.message}
            />
            <Input
              id="passwordConfirm"
              label="비밀번호 확인"
              type="password"
              placeholder="비밀번호 재입력"
              {...register('passwordConfirm')}
              error={errors.passwordConfirm?.message}
            />

            {/* 휴대폰 인증 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                휴대폰 번호
              </label>
              <div className="flex gap-2">
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="010-1234-5678"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {otpSent ? '재발송' : '인증번호 발송'}
                </button>
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            {otpSent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  인증번호{' '}
                  {otpVerified && <span className="text-green-600 font-normal text-xs">✓ 인증완료</span>}
                </label>
                <div className="flex gap-2">
                  <input
                    {...register('otpCode')}
                    type="text"
                    maxLength={6}
                    placeholder="6자리 입력"
                    disabled={otpVerified}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading}
                      className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      확인
                    </button>
                  )}
                </div>
              </div>
            )}

            {otpError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{otpError}</p>
            )}

            {/* 배송지 */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">기본 배송지</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">우편번호</label>
                  <div className="flex gap-2">
                    <input
                      {...register('postalCode')}
                      readOnly
                      placeholder="우편번호"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSearchPostcode}
                      className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      주소 검색
                    </button>
                  </div>
                  {errors.postalCode && <p className="mt-1 text-xs text-red-500">{errors.postalCode.message}</p>}
                </div>
                <div>
                  <input
                    {...register('address')}
                    readOnly
                    placeholder="기본 주소"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 focus:outline-none"
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
                </div>
                <input
                  {...register('addressDetail')}
                  placeholder="상세 주소 (동, 호수 등)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">약관 동의</p>
              <div className="space-y-2">
                {/* 전체 동의 */}
                <label className="flex items-center gap-3 cursor-pointer rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={agreements.all}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-900">전체 동의</span>
                  <span className="ml-auto text-xs text-gray-400">필수 + 선택 포함</span>
                </label>

                <div className="pl-1 space-y-2">
                  {/* 이용약관 */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.terms}
                      onChange={(e) => toggleOne('terms', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      <span className="text-blue-600 font-medium text-xs mr-1">[필수]</span>
                      이용약관 동의
                    </span>
                    <Link
                      href="/terms/service"
                      target="_blank"
                      className="flex items-center text-xs text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      내용 보기 <ChevronRight className="h-3 w-3" />
                    </Link>
                  </label>

                  {/* 개인정보처리방침 */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.privacy}
                      onChange={(e) => toggleOne('privacy', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      <span className="text-blue-600 font-medium text-xs mr-1">[필수]</span>
                      개인정보 수집 및 이용 동의
                    </span>
                    <Link
                      href="/terms/privacy"
                      target="_blank"
                      className="flex items-center text-xs text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      내용 보기 <ChevronRight className="h-3 w-3" />
                    </Link>
                  </label>

                  {/* 만 14세 */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.age}
                      onChange={(e) => toggleOne('age', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      <span className="text-blue-600 font-medium text-xs mr-1">[필수]</span>
                      만 14세 이상입니다
                    </span>
                  </label>

                  {/* 마케팅 */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.marketing}
                      onChange={(e) => toggleOne('marketing', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      <span className="text-gray-400 font-medium text-xs mr-1">[선택]</span>
                      마케팅 정보 수신 동의 (이메일·SMS)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              회원가입
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
              로그인
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
