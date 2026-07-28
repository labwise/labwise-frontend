import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
});

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/site-settings`, { next: { revalidate: 300 } });
    if (res.ok) {
      const cfg = await res.json();
      return {
        title: cfg.siteName ? `${cfg.siteName} - 실험실 소모품 전문 쇼핑몰` : '랩와이즈 - 실험실 소모품 전문 쇼핑몰',
        description: '대학교 및 연구기관을 위한 실험실 소모품 전문 쇼핑몰',
        icons: cfg.faviconUrl ? { icon: cfg.faviconUrl } : undefined,
        // 개발 완료 전까지 검색엔진 노출 차단 — 완료 후 이 필드를 제거할 것.
        robots: { index: false, follow: false, nocache: true },
      };
    }
  } catch {}
  return {
    title: '랩와이즈 - 실험실 소모품 전문 쇼핑몰',
    description: '대학교 및 연구기관을 위한 실험실 소모품 전문 쇼핑몰',
    // 개발 완료 전까지 검색엔진 노출 차단 — 완료 후 이 필드를 제거할 것.
    robots: { index: false, follow: false, nocache: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
