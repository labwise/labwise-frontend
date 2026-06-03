'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Search, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { formatWise } from '@/lib/utils';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  linkType?: 'products' | 'board';
  boardId?: string;
  board?: { slug: string };
  children?: Category[];
}

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-nav'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

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
        <div className="flex h-[110px] items-center justify-between">
          <Link href="/" className="flex items-center py-[18px]">
            <Logo className="h-16 w-auto" />
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
                  href="/my/inquiry"
                  className="hidden text-sm text-gray-600 hover:text-blue-600 md:block"
                >
                  1:1 문의
                </Link>
                <Link
                  href="/my"
                  className="hidden items-center gap-1 text-sm text-gray-600 hover:text-blue-600 md:flex"
                >
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                  <span className="text-blue-600">({formatWise(user.pointBalance)})</span>
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

      {/* Category Navigation */}
      <nav className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center gap-1 text-sm">
            <Link
              href="/products"
              className="px-3 py-1.5 text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-50"
            >
              전체 상품
            </Link>

            {categories.map((cat) => {
              const catHref = cat.linkType === 'board' && cat.board?.slug
                ? `/boards/${cat.board.slug}`
                : `/products?categoryId=${cat.id}`;
              return (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => setOpenMenu(cat.id)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <Link
                  href={catHref}
                  className="flex items-center gap-0.5 px-3 py-1.5 text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-50"
                >
                  {cat.name}
                  {(cat.children?.length ?? 0) > 0 && (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </Link>

                {openMenu === cat.id && (cat.children?.length ?? 0) > 0 && (
                  <div className="absolute left-0 top-full z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {cat.children!.map((sub) => {
                      const subHref = sub.linkType === 'board' && sub.board?.slug
                        ? `/boards/${sub.board.slug}`
                        : `/products?categoryId=${sub.id}`;
                      return (
                        <Link
                          key={sub.id}
                          href={subHref}
                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              );
            })}

            {user?.hasPointmallAccess && (
              <Link
                href="/point-mall"
                className="ml-2 px-3 py-1.5 font-medium text-blue-600 hover:text-blue-700 rounded-md hover:bg-blue-50"
              >
                와이즈몰
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
