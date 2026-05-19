'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { CheckCircle, XCircle, AlertTriangle, Save, RefreshCw, Copy, Globe, ExternalLink } from 'lucide-react';

type Provider = 'COOLSMS' | 'GOOGLE' | 'KAKAO' | 'NAVER' | 'TOSSPAYMENTS' | 'BANK_TRANSFER';
type Tab = 'service' | 'domain';

interface IntegrationSetting {
  provider: string;
  isEnabled: boolean;
  updatedAt: string | null;
  config: Record<string, string>;
}

const PROVIDER_META: Record<Provider, {
  label: string; required?: boolean; color: string; description: string;
  fields: { key: string; label: string; placeholder: string; sensitive?: boolean }[];
}> = {
  TOSSPAYMENTS: {
    label: '토스페이먼츠 (신용카드 / 가상계좌)', required: true, color: 'blue',
    description: '토스페이먼츠 개발자센터(developers.tosspayments.com)에서 클라이언트 키와 시크릿 키를 발급받으세요.',
    fields: [
      { key: 'clientKey', label: '클라이언트 키 (프론트엔드용)', placeholder: 'test_ck_...' },
      { key: 'secretKey', label: '시크릿 키 (서버용)', placeholder: 'test_sk_...', sensitive: true },
      { key: 'webhookSecret', label: '웹훅 시크릿 (가상계좌 입금 알림)', placeholder: '토스 콘솔 웹훅 설정에서 발급', sensitive: true },
    ],
  },
  BANK_TRANSFER: {
    label: '무통장 입금 계좌', required: true, color: 'amber',
    description: '무통장 입금 결제 방식을 사용할 경우 입금 안내에 표시될 계좌 정보를 입력하세요.',
    fields: [
      { key: 'bankName', label: '은행명', placeholder: '예: 신한은행' },
      { key: 'accountNumber', label: '계좌번호', placeholder: '예: 110-123-456789' },
      { key: 'accountHolder', label: '예금주', placeholder: '예: (주)랩와이즈' },
    ],
  },
  COOLSMS: {
    label: 'CoolSMS (휴대폰 인증)', required: true, color: 'indigo',
    description: '회원가입 시 휴대폰 번호 인증에 사용됩니다. coolsms.co.kr에서 발급받으세요.',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'NCS...' },
      { key: 'apiSecret', label: 'API Secret', placeholder: '비밀키 입력', sensitive: true },
      { key: 'sender', label: '발신 번호', placeholder: '010-0000-0000' },
    ],
  },
  GOOGLE: {
    label: '구글 로그인', color: 'red',
    description: 'Google Cloud Console에서 OAuth 2.0 클라이언트를 생성하세요.',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: '123456789.apps.googleusercontent.com' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'GOCSPX-...', sensitive: true },
      { key: 'callbackUrl', label: '콜백 URL', placeholder: 'http://서버주소/auth/google/callback' },
    ],
  },
  KAKAO: {
    label: '카카오 로그인', color: 'yellow',
    description: 'Kakao Developers에서 앱을 생성하고 REST API 키를 사용하세요.',
    fields: [
      { key: 'clientId', label: 'REST API Key', placeholder: 'abc123def456...' },
      { key: 'clientSecret', label: 'Client Secret (선택)', placeholder: '카카오 보안 설정에서 발급', sensitive: true },
      { key: 'callbackUrl', label: '콜백 URL', placeholder: 'http://서버주소/auth/kakao/callback' },
    ],
  },
  NAVER: {
    label: '네이버 로그인', color: 'green',
    description: 'NAVER Developers에서 애플리케이션을 등록하세요.',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Client_ID 입력' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'Client_Secret 입력', sensitive: true },
      { key: 'callbackUrl', label: '콜백 URL', placeholder: 'http://서버주소/auth/naver/callback' },
    ],
  },
};

const ORDER: Provider[] = ['TOSSPAYMENTS', 'BANK_TRANSFER', 'COOLSMS', 'KAKAO', 'NAVER', 'GOOGLE'];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200',
  amber: 'bg-amber-50 border-amber-200',
  red: 'bg-red-50 border-red-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  green: 'bg-green-50 border-green-200',
  indigo: 'bg-indigo-50 border-indigo-200',
};

export default function IntegrationsPage() {
  const [tab, setTab] = useState<Tab>('service');
  const [settings, setSettings] = useState<Record<Provider, IntegrationSetting>>({} as any);
  const [forms, setForms] = useState<Record<Provider, Record<string, string>>>({} as any);
  const [enabled, setEnabled] = useState<Record<Provider, boolean>>({} as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [result, setResult] = useState<{ provider: string; ok: boolean; msg: string } | null>(null);

  // 도메인 탭 상태
  const [serverIp, setServerIp] = useState('');
  const [domain, setDomain] = useState('');
  const [domainSaved, setDomainSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    adminApi.get('/admin/integrations').then(({ data }) => {
      const map: Record<string, IntegrationSetting> = {};
      const fmap: Record<string, Record<string, string>> = {};
      const emap: Record<string, boolean> = {};
      for (const item of data as IntegrationSetting[]) {
        map[item.provider] = item;
        if (item.provider === 'DOMAIN_CONFIG') {
          setServerIp(item.config?.serverIp ?? '');
          setDomain(item.config?.domain ?? '');
        } else {
          fmap[item.provider] = {};
          emap[item.provider] = item.isEnabled;
        }
      }
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
    }).catch(() => {
      const map: Record<string, IntegrationSetting> = {};
      const fmap: Record<string, Record<string, string>> = {};
      const emap: Record<string, boolean> = {};
      for (const p of ORDER) {
        map[p] = { provider: p, isEnabled: false, updatedAt: null, config: {} };
        fmap[p] = {};
        emap[p] = false;
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
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setResult({ provider, ok: false, msg: msg ?? '저장에 실패했습니다.' });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveDomain = async () => {
    setSaving('DOMAIN_CONFIG');
    setDomainSaved(false);
    try {
      await adminApi.put('/admin/integrations/DOMAIN_CONFIG', {
        config: { serverIp, domain },
        isEnabled: true,
      });
      setDomainSaved(true);
      setTimeout(() => setDomainSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  };

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copy(text, id)}
      className="ml-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
    >
      {copied === id ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
      {copied === id ? '복사됨' : '복사'}
    </button>
  );

  const ip = serverIp || '서버IP';
  const dm = domain || 'yourdomain.com';

  if (loading) return <p className="text-gray-400 text-sm">불러오는 중...</p>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">연동 관리</h1>
        <p className="text-sm text-gray-500 mt-1">결제, 인증 서비스 및 도메인 연동 설정입니다.</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit mb-6">
        {([['service', '결제 / 서비스 연동'], ['domain', '도메인 연동']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── 서비스 연동 탭 ── */}
      {tab === 'service' && (
        <div className="space-y-6">
          {ORDER.map((provider) => {
            const meta = PROVIDER_META[provider];
            const s = settings[provider];
            const isConfigured = s.updatedAt !== null && Object.keys(s.config).length > 0;
            const isActive = enabled[provider];
            const colorCls = COLOR_MAP[meta.color] ?? 'bg-gray-50 border-gray-200';
            const isSaving = saving === provider;
            const thisResult = result?.provider === provider ? result : null;

            return (
              <div key={provider} className={`rounded-xl border p-5 ${colorCls}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{meta.label}</h2>
                    {meta.required && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">필수</span>
                    )}
                    {isConfigured
                      ? <CheckCircle size={16} className="text-green-500" />
                      : <XCircle size={16} className="text-gray-400" />}
                  </div>
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

                {provider === 'COOLSMS' && !isConfigured && (
                  <div className="flex items-center gap-2 mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700">CoolSMS 미설정 시 OTP가 서버 콘솔에만 출력됩니다. 운영 환경에서는 반드시 설정해주세요.</p>
                  </div>
                )}

                {isConfigured && (
                  <p className="mb-3 text-xs text-gray-500">마지막 업데이트: {new Date(s.updatedAt!).toLocaleString('ko-KR')}</p>
                )}

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
                    <p className={`text-sm ${thisResult.ok ? 'text-green-600' : 'text-red-500'}`}>{thisResult.msg}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 도메인 연동 탭 ── */}
      {tab === 'domain' && (
        <div className="space-y-6">
          {/* 서버 IP / 도메인 설정 */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-blue-900">서버 정보 설정</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">서버 IP (EC2 퍼블릭 IP)</label>
                <input
                  type="text"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  placeholder="예: 3.34.129.125"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">연동할 도메인</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="예: labwise.co.kr"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSaveDomain}
                disabled={saving === 'DOMAIN_CONFIG'}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving === 'DOMAIN_CONFIG' ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                저장
              </button>
              {domainSaved && <p className="text-sm text-green-600">저장되었습니다.</p>}
            </div>
            <p className="mt-2 text-xs text-blue-600">저장하면 아래 설정 가이드에 자동으로 반영됩니다.</p>
          </div>

          {/* Step 1: DNS */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
              <h2 className="font-semibold text-gray-900">DNS 레코드 설정</h2>
            </div>
            <p className="mb-3 text-sm text-gray-600">도메인 구매처(가비아, 후이즈, Cloudflare 등)에서 DNS 설정으로 이동한 후 아래 레코드를 추가하세요.</p>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">타입</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">호스트</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">값 (Value)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">TTL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[['@', dm], ['www', `www.${dm}`]].map(([host, label]) => (
                    <tr key={host}>
                      <td className="px-4 py-3 font-mono font-medium text-blue-600">A</td>
                      <td className="px-4 py-3 font-mono">{label}</td>
                      <td className="px-4 py-3 font-mono">
                        {ip}
                        <CopyBtn text={ip} id={`dns-${host}`} />
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-400">3600</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-400">⚠️ DNS 전파에 최대 24~48시간이 걸릴 수 있습니다.</p>
          </div>

          {/* Step 2: Nginx */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
              <h2 className="font-semibold text-gray-900">서버 Nginx 설정</h2>
            </div>
            <p className="mb-3 text-sm text-gray-600">EC2 서버에 접속한 후 아래 명령어를 실행하세요.</p>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">① Nginx 설치</p>
                <div className="relative rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-green-400">
                  sudo yum install nginx -y && sudo systemctl enable nginx
                  <CopyBtn text="sudo yum install nginx -y && sudo systemctl enable nginx" id="nginx-install" />
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">② 설정 파일 생성</p>
                <div className="relative rounded-lg bg-gray-900 px-4 py-3 font-mono text-xs text-green-400 leading-relaxed">
                  <CopyBtn
                    text={`sudo tee /etc/nginx/conf.d/labwise.conf << 'EOF'\nserver {\n    listen 80;\n    server_name ${dm} www.${dm};\n\n    location /api/ {\n        proxy_pass http://localhost:3000/api/;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n    }\n\n    location / {\n        proxy_pass http://localhost:3001;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n    }\n}\nEOF`}
                    id="nginx-conf"
                  />
                  <pre className="whitespace-pre-wrap">{`sudo tee /etc/nginx/conf.d/labwise.conf << 'EOF'
server {
    listen 80;
    server_name ${dm} www.${dm};

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF`}</pre>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">③ Nginx 재시작</p>
                <div className="rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-green-400">
                  sudo nginx -t && sudo systemctl restart nginx
                  <CopyBtn text="sudo nginx -t && sudo systemctl restart nginx" id="nginx-restart" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: HTTPS */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
              <h2 className="font-semibold text-gray-900">HTTPS (SSL) 적용</h2>
            </div>
            <p className="mb-3 text-sm text-gray-600">Let's Encrypt 무료 SSL 인증서 발급</p>
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-green-400">
                sudo yum install certbot python3-certbot-nginx -y
                <CopyBtn text="sudo yum install certbot python3-certbot-nginx -y" id="certbot-install" />
              </div>
              <div className="rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-green-400">
                {`sudo certbot --nginx -d ${dm} -d www.${dm}`}
                <CopyBtn text={`sudo certbot --nginx -d ${dm} -d www.${dm}`} id="certbot-run" />
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              <span>⚠️</span>
              <span>SSL 적용 전 반드시 DNS 설정이 완료되어 도메인이 서버 IP를 가리키고 있어야 합니다.</span>
            </div>
          </div>

          {/* Step 4: 환경변수 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">4</span>
              <h2 className="font-semibold text-gray-900">서버 환경변수 업데이트</h2>
            </div>
            <p className="mb-3 text-sm text-gray-600">
              EC2의 <code className="rounded bg-gray-100 px-1 font-mono text-xs">/home/ec2-user/labwise-frontend/.env.local</code> 에서 수정하세요.
            </p>
            <div className="rounded-lg bg-gray-900 px-4 py-3 font-mono text-xs text-green-400">
              {`NEXT_PUBLIC_API_URL=https://${dm}/api`}
              <CopyBtn text={`NEXT_PUBLIC_API_URL=https://${dm}/api`} id="env-url" />
            </div>
            <p className="mt-2 text-xs text-gray-500">수정 후 <code className="rounded bg-gray-100 px-1 font-mono text-xs">pm2 restart labwise-frontend</code>를 실행하세요.</p>
          </div>

          {domain && serverIp && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
              <span>모든 단계 완료 후 <strong>https://{domain}</strong>으로 접속할 수 있습니다.</span>
              <a href={`http://${domain}`} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-green-700 underline">
                바로가기 <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
