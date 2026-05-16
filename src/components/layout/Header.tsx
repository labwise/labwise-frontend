'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Search, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo className="h-14 w-auto" />
          </Link>

          <div className="mx-8 hidden flex-1 max-w-lg md:block">
            <form action="/products" className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                name="search"
                type="search"
                placeholder="상품 검색..."
                className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </form>
          </div>

          <nav className="flex items-center gap-2">
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-blue-600">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/my"
                  className="hidden items-center gap-1 text-sm text-gray-600 hover:text-blue-600 md:flex"
                >
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                  <span className="text-blue-600">({formatPrice(user.pointBalance)}W)</span>
                </Link>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600">
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  회원가입
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>

      <nav className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center gap-6 text-sm">
            <Link href="/products" className="text-gray-600 hover:text-blue-600">
              전체 상품
            </Link>
            <Link href="/products?category=consumables" className="text-gray-600 hover:text-blue-600">
              소모품
            </Link>
            <Link href="/products?category=reagents" className="text-gray-600 hover:text-blue-600">
              시약
            </Link>
            {user?.hasPointmallAccess && (
              <Link href="/point-mall" className="font-medium text-blue-600 hover:text-blue-700">
                와이즈몰
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
