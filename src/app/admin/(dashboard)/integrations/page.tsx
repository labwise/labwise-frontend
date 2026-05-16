'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { CheckCircle, XCircle, AlertTriangle, Save, RefreshCw } from 'lucide-react';

type Provider = 'COOLSMS' | 'GOOGLE' | 'KAKAO' | 'NAVER';

interface IntegrationSetting {
  provider: Provider;
  isEnabled: boolean;
  updatedAt: string | null;
  config: Record<string, string>;
}

const PROVIDER_META: Record<
  Provider,
  {
    label: string;
    required?: boolean;
    color: string;
    description: string;
    fields: { key: string; label: string; placeholder: string; sensitive?: boolean }[];
  }
> = {
  COOLSMS: {
    label: 'CoolSMS (휴대폰 인증)',
    required: true,
    color: 'blue',
    description: '회원가입 시 휴대폰 번호 인증에 사용됩니다. coolsms.co.kr에서 발급받으세요.',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'NCS...' },
      { key: 'apiSecret', label: 'API Secret', placeholder: '비밀키 입력', sensitive: true },
      { key: 'sender', label: '발신 번호', placeholder: '010-0000-0000' },
    ],
  },
  GOOGLE: {
    label: '구글 로그인',
    color: 'red',
    description: 'Google Cloud Console에서 OAuth 2.0 클라이언트를 생성하세요.',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: '123456789.apps.googleusercontent.com' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'GOCSPX-...', sensitive: true },
      { key: 'callbackUrl', label: '콜백 URL', placeholder: 'http://서버주소/auth/google/callback' },
    ],
  },
  KAKAO: {
    label: '카카오 로그인',
    color: 'yellow',
    description: 'Kakao Developers에서 앱을 생성하고 REST API 키를 사용하세요.',
    fields: [
      { key: 'clientId', label: 'REST API Key', placeholder: 'abc123def456...' },
      { key: 'clientSecret', label: 'Client Secret (선택)', placeholder: '카카오 보안 설정에서 발급', sensitive: true },
      { key: 'callbackUrl', label: '콜백 URL', placeholder: 'http://서버주소/auth/kakao/callback' },
    ],
  },
  NAVER: {
    label: '네이버 로그인',
    color: 'green',
    description: 'NAVER Developers에서 애플리케이션을 등록하세요.',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Client_ID 입력' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'Client_Secret 입력', sensitive: true },
      { key: 'callbackUrl', label: '콜백 URL', placeholder: 'http://서버주소/auth/naver/callback' },
    ],
  },
};

const ORDER: Provider[] = ['COOLSMS', 'KAKAO', 'NAVER', 'GOOGLE'];

const COLOR_MAP = {
  blue: 'bg-blue-50 border-blue-200',
  red: 'bg-red-50 border-red-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  green: 'bg-green-50 border-green-200',
};

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<Record<Provider, IntegrationSetting>>({} as any);
  const [forms, setForms] = useState<Record<Provider, Record<string, string>>>({} as any);
  const [enabled, setEnabled] = useState<Record<Provider, boolean>>({} as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Provider | null>(null);
  const [result, setResult] = useState<{ provider: Provider; ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    adminApi.get('/admin/integrations').then(({ data }) => {
      const map: Record<string, IntegrationSetting> = {};
      const fmap: Record<string, Record<string, string>> = {};
      const emap: Record<string, boolean> = {};
      for (const item of data as IntegrationSetting[]) {
        map[item.provider] = item;
        fmap[item.provider] = {};
        emap[item.provider] = item.isEnabled;
      }
      // 미설정 provider는 빈 객체로
      for (const p of ORDER) {
        if (!map[p]) {
          map[p] = { provider: p, isEnabled: false, updatedAt: null, config: {} };
          fmap[p] = {};
          emap[p] = false;
        }
      }
      setSettings(map as any);
      setForms(fmap as any);
      setEnabled(emap as any);
    }).finally(() => setLoading(false));
  }, []);

  const handleChange = (provider: Provider, key: string, value: string) => {
    setForms((prev) => ({ ...prev, [provider]: { ...prev[provider], [key]: value } }));
  };

  const handleSave = async (provider: Provider) => {
    setSaving(provider);
    setResult(null);
    try {
      const { data } = await adminApi.put(`/admin/integrations/${provider}`, {
        config: forms[provider] ?? {},
        isEnabled: enabled[provider],
      });
      setSettings((prev) => ({ ...prev, [provider]: data }));
      setForms((prev) => ({ ...prev, [provider]: {} }));
      setResult({ provider, ok: true, msg: '저장되었습니다.' });
    } catch (e: any) {
      setResult({ provider, ok: false, msg: e.response?.data?.message ?? '저장에 실패했습니다.' });
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-gray-400 text-sm">불러오는 중...</p>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">연동 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          CoolSMS는 필수 연동입니다. 소셜 로그인은 설정 후 자동으로 로그인/회원가입 버튼에 노출됩니다.
        </p>
      </div>

      <div className="space-y-6">
        {ORDER.map((provider) => {
          const meta = PROVIDER_META[provider];
          const s = settings[provider];
          const isConfigured = s.updatedAt !== null && Object.keys(s.config).length > 0;
          const isActive = enabled[provider];
          const colorCls = COLOR_MAP[meta.color as keyof typeof COLOR_MAP];
          const isSaving = saving === provider;
          const thisResult = result?.provider === provider ? result : null;

          return (
            <div key={provider} className={`rounded-xl border p-5 ${colorCls}`}>
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{meta.label}</h2>
                  {meta.required && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">필수</span>
                  )}
                  {isConfigured ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-gray-400" />
                  )}
                </div>

                {/* 활성화 토글 */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-sm text-gray-600">{isActive ? '활성화' : '비활성화'}</span>
                  <div
                    onClick={() => setEnabled((prev) => ({ ...prev, [provider]: !prev[provider] }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </label>
              </div>

              <p className="text-xs text-gray-500 mb-4">{meta.description}</p>

              {/* CoolSMS 미설정 경고 */}
              {provider === 'COOLSMS' && !isConfigured && (
                <div className="flex items-center gap-2 mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">CoolSMS 미설정 시 OTP가 서버 콘솔에만 출력됩니다. 운영 환경에서는 반드시 설정해주세요.</p>
                </div>
              )}

              {/* 기존 설정 표시 */}
              {isConfigured && (
                <div className="mb-3 text-xs text-gray-500">
                  마지막 업데이트: {new Date(s.updatedAt!).toLocaleString('ko-KR')}
                </div>
              )}

              {/* 입력 폼 */}
              <div className="space-y-3">
                {meta.fields.map((field) => {
                  const existingValue = s.config?.[field.key];
                  const isMasked = existingValue === '●●●●●●●●';
                  const currentInput = forms[provider]?.[field.key] ?? '';

                  return (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                      <input
                        type={field.sensitive ? 'password' : 'text'}
                        value={currentInput}
                        onChange={(e) => handleChange(provider, field.key, e.target.value)}
                        placeholder={isMasked ? '●●●●●●●● (변경하려면 새 값 입력)' : existingValue || field.placeholder}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  );
                })}
              </div>

              {/* 저장 버튼 */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => handleSave(provider)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  저장
                </button>
                {thisResult && (
                  <p className={`text-sm ${thisResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {thisResult.msg}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
