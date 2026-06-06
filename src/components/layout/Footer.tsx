'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SiteConfig {
  companyName?: string; ceoName?: string; businessNumber?: string;
  address?: string; phone?: string; email?: string; footerCopyright?: string;
  logoUrl?: string;
}

export function Footer() {
  const { data: cfg } = useQuery<SiteConfig>({
    queryKey: ['site-settings'],
    queryFn: async () => { const { data } = await api.get('/site-settings'); return data; },
    staleTime: 1000 * 60 * 5,
  });

  const company = cfg?.companyName || '랩와이즈';
  const ceo = cfg?.ceoName || '';
  const bizNum = cfg?.businessNumber || '';
  const address = cfg?.address || '';
  const phone = cfg?.phone || '02-1234-5678';
  const email = cfg?.email || 'info@labwise.co.kr';
  const logoUrl = cfg?.logoUrl;
  const copyright = cfg?.footerCopyright || `© ${new Date().getFullYear()} ${company}. All rights reserved.`;

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">고객 지원</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/my/inquiry" className="hover:text-blue-600">1:1 문의</Link></li>
              <li><Link href="/my/orders" className="hover:text-blue-600">주문 내역</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">회원 서비스</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/my/points" className="hover:text-blue-600">와이즈 내역</Link></li>
              <li><Link href="/point-mall" className="hover:text-blue-600">와이즈몰</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">사회적 책임</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/donations" className="hover:text-green-600">🌱 기부 내역</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600">이용약관</Link></li>
              <li><Link href="/terms/privacy" className="hover:text-blue-600">개인정보처리방침</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">연락처</h3>
            {phone && <p className="text-sm text-gray-500">고객센터: {phone}</p>}
            {email && <p className="text-sm text-gray-500">이메일: {email}</p>}
            <p className="mt-2 text-sm text-gray-500">평일 09:00–18:00</p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-400 space-y-1">
          {logoUrl && (
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={company} className="h-10 w-auto object-contain" />
            </div>
          )}
          <p>{copyright}</p>
          <p>
            {[
              company && `상호: ${company}`,
              ceo && `대표: ${ceo}`,
              bizNum && `사업자등록번호: ${bizNum}`,
            ].filter(Boolean).join(' | ')}
          </p>
          {address && <p>{address}</p>}
        </div>
      </div>
    </footer>
  );
}
