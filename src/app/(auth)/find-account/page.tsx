'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { CheckCircle, Smartphone } from 'lucide-react';

type Tab = 'email' | 'password';
// 비밀번호 재설정 4단계
// input → confirm (마스킹 전화번호 확인) → otp (인증+새비번) → done
type PwStep = 'input' | 'confirm' | 'otp' | 'done';

export default function FindAccountPage() {
  const [tab, setTab] = useState<Tab>('email');

  // ── 아이디 찾기 ──────────────────────────────────────────────────────────────
  const [phone, setPhone] = useState('');
  const [foundEmail, setFoundEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // ── 비밀번호 재설정 ───────────────────────────────────────────────────────────
  const [pwStep, setPwStep] = useState<PwStep>('input');
  const [pwEmail, setPwEmail] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [pwOtp, setPwOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // ── 아이디 찾기 핸들러 ────────────────────────────────────────────────────────
  async function handleFindEmail() {
    setEmailError('');
    setFoundEmail('');
    setEmailLoading(true);
    try {
      const { data } = await api.post('/auth/find-email', { phone });
      setFoundEmail(data.maskedEmail);
    } catch (e: any) {
      setEmailError(e.response?.data?.message ?? '조회에 실패했습니다.');
    } finally {
      setEmailLoading(false);
    }
  }

  // Step 1: 이메일로 마스킹된 전화번호 조회
  async function handleCheckEmail() {
    setPwError('');
    setPwLoading(true);
    try {
      const { data } = await api.post('/auth/password-reset/check-email', { email: pwEmail });
      setMaskedPhone(data.maskedPhone);
      setPwStep('confirm');
    } catch (e: any) {
      setPwError(e.response?.data?.message ?? '이메일 확인에 실패했습니다.');
    } finally {
      setPwLoading(false);
    }
  }

  // Step 2: 실제 OTP 발송
  async function handleSendOtp() {
    setPwError('');
    setPwLoading(true);
    try {
      await api.post('/auth/password-reset/send-otp', { email: pwEmail });
      setPwStep('otp');
    } catch (e: any) {
      setPwError(e.response?.data?.message ?? '발송에 실패했습니다.');
    } finally {
      setPwLoading(false);
    }
  }

  // Step 3: OTP 확인 + 비밀번호 변경
  async function handleResetPassword() {
    if (newPassword !== newPasswordConfirm) {
      setPwError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    setPwError('');
    setPwLoading(true);
    try {
      await api.post('/auth/password-reset/confirm', { email: pwEmail, otp: pwOtp, newPassword });
      setPwStep('done');
    } catch (e: any) {
      setPwError(e.response?.data?.message ?? '변경에 실패했습니다.');
    } finally {
      setPwLoading(false);
    }
  }

  function resetPw() {
    setPwStep('input');
    setPwEmail('');
    setMaskedPhone('');
    setPwOtp('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setPwError('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <Logo className="h-16 w-auto" />
          </Link>
          <h2 className="mt-5 text-xl font-semibold text-gray-700">아이디 · 비밀번호 찾기</h2>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
          {/* 탭 */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            {(['email', 'password'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'email' ? '아이디(이메일) 찾기' : '비밀번호 재설정'}
              </button>
            ))}
          </div>

          {/* ── 아이디 찾기 ── */}
          {tab === 'email' && (
            <div className="space-y-4">
              {!foundEmail ? (
                <>
                  <p className="text-sm text-gray-500">가입 시 등록한 휴대폰 번호를 입력하세요.</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">휴대폰 번호</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {emailError && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{emailError}</p>
                  )}
                  <button
                    onClick={handleFindEmail}
                    disabled={!phone.trim() || emailLoading}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {emailLoading ? '조회 중...' : '아이디 찾기'}
                  </button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">가입된 아이디(이메일)</p>
                    <p className="text-lg font-semibold text-gray-900">{foundEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setFoundEmail(''); setPhone(''); }}
                      className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      다시 찾기
                    </button>
                    <Link
                      href="/login"
                      className="flex-1 rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
                    >
                      로그인하기
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 비밀번호 재설정 ── */}
          {tab === 'password' && (
            <div className="space-y-4">

              {/* Step 1: 이메일 입력 */}
              {pwStep === 'input' && (
                <>
                  <p className="text-sm text-gray-500">
                    가입한 이메일을 입력하세요. 등록된 휴대폰 번호를 확인한 후 인증번호를 발송합니다.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <input
                      type="email"
                      value={pwEmail}
                      onChange={(e) => setPwEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !pwLoading && pwEmail.trim() && handleCheckEmail()}
                      placeholder="example@labwise.kr"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {pwError && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{pwError}</p>
                  )}
                  <button
                    onClick={handleCheckEmail}
                    disabled={!pwEmail.trim() || pwLoading}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {pwLoading ? '확인 중...' : '다음'}
                  </button>
                </>
              )}

              {/* Step 2: 마스킹 전화번호 확인 + 발송 */}
              {pwStep === 'confirm' && (
                <>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-5 text-center space-y-2">
                    <Smartphone className="mx-auto h-9 w-9 text-blue-500" />
                    <p className="text-base font-bold text-gray-900 tracking-widest">{maskedPhone}</p>
                    <p className="text-sm text-gray-500">
                      위 번호로 인증번호가 발송됩니다.<br />
                      본인 명의의 번호가 맞다면 발송 버튼을 눌러주세요.
                    </p>
                  </div>
                  {pwError && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{pwError}</p>
                  )}
                  <button
                    onClick={handleSendOtp}
                    disabled={pwLoading}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {pwLoading ? '발송 중...' : '인증번호 발송'}
                  </button>
                  <button
                    onClick={resetPw}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    이메일 다시 입력
                  </button>
                </>
              )}

              {/* Step 3: OTP + 새 비밀번호 */}
              {pwStep === 'otp' && (
                <>
                  <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
                    <span className="font-semibold">{maskedPhone}</span> 번호로 인증번호가 발송되었습니다.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">인증번호</label>
                    <input
                      type="text"
                      value={pwOtp}
                      onChange={(e) => setPwOtp(e.target.value)}
                      placeholder="6자리 숫자 입력"
                      maxLength={6}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="8자 이상"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                    <input
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="비밀번호 재입력"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {pwError && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{pwError}</p>
                  )}
                  <button
                    onClick={handleResetPassword}
                    disabled={!pwOtp.trim() || !newPassword || pwLoading}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {pwLoading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                  <button
                    onClick={() => { setPwStep('confirm'); setPwError(''); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    인증번호 재발송
                  </button>
                </>
              )}

              {/* Step 4: 완료 */}
              {pwStep === 'done' && (
                <div className="text-center space-y-4">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <div>
                    <p className="font-semibold text-gray-900">비밀번호가 변경되었습니다.</p>
                    <p className="text-sm text-gray-500 mt-1">새 비밀번호로 로그인해 주세요.</p>
                  </div>
                  <Link
                    href="/login"
                    className="block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
                  >
                    로그인하기
                  </Link>
                </div>
              )}

            </div>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/login" className="text-blue-600 hover:text-blue-700">← 로그인으로 돌아가기</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
