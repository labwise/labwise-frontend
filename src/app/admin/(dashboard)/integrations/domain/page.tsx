'use client';

import { useState } from 'react';
import { Globe, CheckCircle, Copy, ExternalLink } from 'lucide-react';

const EC2_IP = '3.34.129.125';

export default function DomainIntegrationPage() {
  const [domain, setDomain] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="ml-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
    >
      {copied === id ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
      {copied === id ? '복사됨' : '복사'}
    </button>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">도메인 연동</h1>
        <p className="mt-1 text-sm text-gray-500">
          구매한 도메인을 랩와이즈 서버에 연결하는 방법을 안내합니다.
        </p>
      </div>

      {/* 현재 서버 정보 */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-blue-900">현재 서버 IP</h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-lg font-bold text-blue-800">
          {EC2_IP}
          <CopyButton text={EC2_IP} id="ip" />
        </div>
        <p className="mt-2 text-xs text-blue-600">도메인 DNS 설정 시 이 IP 주소를 사용하세요.</p>
      </div>

      {/* 도메인 미리 입력 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-gray-900">연동할 도메인 입력</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="예: labwise.co.kr"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">입력하면 아래 안내에 도메인이 자동으로 적용됩니다.</p>
      </div>

      {/* Step 1: DNS */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
          <h2 className="font-semibold text-gray-900">DNS 레코드 설정</h2>
        </div>
        <p className="mb-3 text-sm text-gray-600">
          도메인 구매처(가비아, 후이즈, Cloudflare 등)에서 DNS 설정으로 이동한 후 아래 레코드를 추가하세요.
        </p>
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
              <tr>
                <td className="px-4 py-3 font-mono font-medium text-blue-600">A</td>
                <td className="px-4 py-3 font-mono">{domain || 'yourdomain.com'}</td>
                <td className="px-4 py-3 font-mono">
                  {EC2_IP}
                  <CopyButton text={EC2_IP} id="dns-ip" />
                </td>
                <td className="px-4 py-3 font-mono text-gray-400">3600</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-medium text-blue-600">A</td>
                <td className="px-4 py-3 font-mono">www.{domain || 'yourdomain.com'}</td>
                <td className="px-4 py-3 font-mono">
                  {EC2_IP}
                  <CopyButton text={EC2_IP} id="dns-ip-www" />
                </td>
                <td className="px-4 py-3 font-mono text-gray-400">3600</td>
              </tr>
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
        <p className="mb-3 text-sm text-gray-600">
          EC2 서버에 SSH로 접속한 후 아래 명령어를 실행하세요.
        </p>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">① Nginx 설치 (미설치 시)</p>
            <div className="group relative rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-green-400">
              sudo yum install nginx -y && sudo systemctl enable nginx
              <CopyButton text="sudo yum install nginx -y && sudo systemctl enable nginx" id="nginx-install" />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">② 설정 파일 생성</p>
            <div className="rounded-lg bg-gray-900 px-4 py-3 font-mono text-xs text-green-400 leading-relaxed whitespace-pre">
{`sudo tee /etc/nginx/conf.d/labwise.conf << 'EOF'
server {
    listen 80;
    server_name ${domain || 'yourdomain.com'} www.${domain || 'yourdomain.com'};

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
EOF`}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">③ Nginx 재시작</p>
            <div className="rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-green-400">
              sudo nginx -t && sudo systemctl restart nginx
              <CopyButton text="sudo nginx -t && sudo systemctl restart nginx" id="nginx-restart" />
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: HTTPS */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
          <h2 className="font-semibold text-gray-900">HTTPS (SSL) 적용 — 선택사항</h2>
        </div>
        <p className="mb-3 text-sm text-gray-600">Let's Encrypt를 사용해 무료 SSL 인증서를 발급받으세요.</p>
        <div className="space-y-3">
          <div className="rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-green-400">
            sudo yum install certbot python3-certbot-nginx -y
          </div>
          <div className="rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-green-400">
            sudo certbot --nginx -d {domain || 'yourdomain.com'} -d www.{domain || 'yourdomain.com'}
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
          <span className="shrink-0">⚠️</span>
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
          EC2의 <code className="rounded bg-gray-100 px-1 font-mono text-xs">/home/ec2-user/labwise-frontend/.env.local</code> 파일에서 API URL을 수정하세요.
        </p>
        <div className="rounded-lg bg-gray-900 px-4 py-3 font-mono text-xs text-green-400 leading-relaxed">
          NEXT_PUBLIC_API_URL=https://{domain || 'yourdomain.com'}/api
        </div>
        <p className="mt-2 text-xs text-gray-500">수정 후 <code className="rounded bg-gray-100 px-1 font-mono text-xs">pm2 restart labwise-frontend</code>를 실행하세요.</p>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-800">
        <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
        <span>모든 단계 완료 후 <strong>{domain ? `https://${domain}` : '설정한 도메인'}</strong>으로 접속할 수 있습니다.</span>
        {domain && (
          <a href={`http://${domain}`} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-green-700 underline">
            바로가기 <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
