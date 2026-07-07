'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/my', label: '내 정보' },
  { href: '/my/orders', label: '주문 내역' },
  { href: '/my/raffle', label: '🎟️ 감사 펀드 응모' },
  { href: '/my/estimates', label: '견적서 내역' },
  { href: '/my/addresses', label: '배송지 관리' },
  { href: '/my/points', label: '와이즈 내역' },
  { href: '/my/coupons', label: '쿠폰함' },
  { href: '/my/inquiry', label: '1:1 문의' },
];

export default function MyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">마이페이지</h1>
      <div className="flex flex-col gap-6 md:flex-row">
        <nav className="md:w-48 flex-shrink-0">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
