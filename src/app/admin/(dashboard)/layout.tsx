'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Gift,
  LogOut,
  ChevronRight,
  Plug,
  Star,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: '상품 관리', icon: Package },
  { href: '/admin/orders', label: '주문 관리', icon: ShoppingCart },
  { href: '/admin/users', label: '회원 관리', icon: Users },
  { href: '/admin/coupons', label: '쿠폰 관리', icon: Tag },
  { href: '/admin/point-mall', label: '와이즈몰', icon: Gift },
  { href: '/admin/featured', label: '추천 상품', icon: Star },
  { href: '/admin/integrations', label: '연동 관리', icon: Plug },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, token, logout } = useAdminAuthStore();

  useEffect(() => {
    if (!token) router.push('/admin/login');
  }, [token, router]);

  if (!token || !admin) return null;

  function handleLogout() {
    logout();
    router.push('/admin/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-700">
          <p className="text-white font-bold text-base">랩와이즈 관리자</p>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{admin.name}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
