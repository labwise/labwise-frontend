'use client';
import { useEffect, useState } from 'react';
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
  ChevronDown,
  Plug,
  Star,
  Layers,
  FolderTree,
  Globe,
  KeyRound,
  BarChart2,
  Trophy,
  Clock,
  UserX,
  MessageSquare,
  StarIcon,
  HelpCircle,
  Beaker,
  FolderCog,
  Settings,
} from 'lucide-react';

interface NavLeaf { href: string; label: string; icon: React.ElementType; exact?: boolean; }
interface NavGroup {
  groupLabel: string;
  items: (NavLeaf & { children?: NavLeaf[] })[];
}

const navGroups: NavGroup[] = [
  {
    groupLabel: '홈',
    items: [
      { href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    groupLabel: '상품 · 주문',
    items: [
      { href: '/admin/products', label: '상품 관리', icon: Package },
      { href: '/admin/categories', label: '카테고리', icon: FolderTree },
      { href: '/admin/orders', label: '주문 관리', icon: ShoppingCart },
      { href: '/admin/featured', label: '추천 상품', icon: Star },
    ],
  },
  {
    groupLabel: '회원 관리',
    items: [
      {
        href: '/admin/users',
        label: '회원 관리',
        icon: Users,
        children: [
          { href: '/admin/users', label: '전체 회원', icon: Users },
          { href: '/admin/users/top-buyers', label: '구매액 상위', icon: Trophy },
          { href: '/admin/users/dormant', label: '휴면 회원', icon: Clock },
          { href: '/admin/users/withdrawn', label: '탈퇴 회원', icon: UserX },
        ],
      },
      { href: '/admin/groups', label: '그룹 관리', icon: Layers },
    ],
  },
  {
    groupLabel: '마케팅',
    items: [
      { href: '/admin/coupons', label: '쿠폰 관리', icon: Tag },
      {
        href: '/admin/point-mall',
        label: '와이즈몰',
        icon: Gift,
        children: [
          { href: '/admin/point-mall', label: '상품 관리', icon: Gift },
          { href: '/admin/point-mall/orders', label: '주문 관리', icon: ShoppingCart },
          { href: '/admin/wisemall-categories', label: '카테고리', icon: FolderCog },
        ],
      },
      { href: '/admin/jackpot', label: '연구자 감사 펀드', icon: Beaker },
    ],
  },
  {
    groupLabel: '게시판 · 리뷰',
    items: [
      { href: '/admin/inquiries', label: '1:1 문의', icon: HelpCircle },
      { href: '/admin/boards', label: '게시판 관리', icon: MessageSquare },
      { href: '/admin/reviews', label: '리뷰 관리', icon: StarIcon },
    ],
  },
  {
    groupLabel: '통계',
    items: [
      { href: '/admin/analytics', label: '통계 / 분석', icon: BarChart2, exact: true },
    ],
  },
  {
    groupLabel: '설정',
    items: [
      { href: '/admin/site-settings', label: '사이트 설정', icon: Settings },
      {
        href: '/admin/integrations',
        label: '연동 관리',
        icon: Plug,
        children: [
          { href: '/admin/integrations', label: '결제/서비스 연동', icon: KeyRound },
          { href: '/admin/integrations/domain', label: '도메인 연동', icon: Globe },
        ],
      },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, token, logout, _hydrated } = useAdminAuthStore();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['/admin/integrations', '/admin/users', '/admin/point-mall']));

  useEffect(() => {
    if (_hydrated && !token) router.push('/admin/login');
  }, [token, _hydrated, router]);

  if (!_hydrated) return null;
  if (!token || !admin) return null;

  function handleLogout() {
    logout();
    router.push('/admin/login');
  }

  function toggleGroup(href: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-700">
          <p className="text-white font-bold text-base">랩와이즈 관리자</p>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{admin.name}</p>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={group.groupLabel} className={gi > 0 ? 'mt-4' : ''}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {group.groupLabel}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon, exact, children }) => {
                  const basePath = href.split('?')[0];
                  const isActive = exact
                    ? pathname === basePath
                    : pathname.startsWith(basePath);
                  const isOpen = openGroups.has(href);

                  if (children) {
                    return (
                      <div key={href}>
                        <button
                          onClick={() => toggleGroup(href)}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <Icon size={16} />
                          {label}
                          {isOpen
                            ? <ChevronDown size={14} className="ml-auto" />
                            : <ChevronRight size={14} className="ml-auto" />
                          }
                        </button>
                        {isOpen && (
                          <div className="mt-0.5 ml-3 space-y-0.5 border-l border-gray-700 pl-3">
                            {children.map((child) => {
                              const childActive = pathname === child.href;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                                    childActive
                                      ? 'bg-blue-600 text-white'
                                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                  }`}
                                >
                                  <child.icon size={13} />
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={href}
                      href={basePath}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                      {isActive && <ChevronRight size={14} className="ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
