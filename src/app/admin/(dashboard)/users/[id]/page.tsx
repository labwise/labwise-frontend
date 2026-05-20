'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import adminApi from '@/lib/admin-api';

interface Group { id: string; name: string }
interface User {
  id: string; name: string; email: string; phone: string;
  status: string; pointBalance: number; createdAt: string; lastLoginAt?: string;
  withdrawalReason?: string; memo?: string;
  group?: Group; businessName?: string; businessNumber?: string;
}

interface OrderItem {
  id: string; quantity: number; unitPrice: number; subtotal: number;
  product?: { name: string };
}
interface Order {
  id: string; orderNumber: string; status: string; finalAmount: number;
  createdAt: string; items: OrderItem[];
}

const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'WITHDRAWN'];
const STATUS_LABELS: Record<string, string> = { ACTIVE: '정상', SUSPENDED: '정지', WITHDRAWN: '탈퇴' };
const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: '입금대기', PAID: '결제완료', PREPARING: '준비중',
  SHIPPED: '배송중', DELIVERED: '배송완료', CANCELLED: '취소', REFUNDED: '환불',
};
const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  REFUNDED: 'bg-red-100 text-red-500',
};

type Tab = 'info' | 'orders' | 'memo';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tab, setTab] = useState<Tab>('info');

  // Info tab state
  const [groupId, setGroupId] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Points state
  const [pointAmount, setPointAmount] = useState('');
  const [pointReason, setPointReason] = useState('');
  const [pointSaving, setPointSaving] = useState(false);

  // Orders tab state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [totalPurchase, setTotalPurchase] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const orderLimit = 10;

  // Memo tab state
  const [memo, setMemo] = useState('');
  const [memoSaving, setMemoSaving] = useState(false);

  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.get(`/admin/users/${id}`),
      adminApi.get('/admin/groups').catch(() => ({ data: [] })),
    ]).then(([userRes, groupRes]) => {
      const u = userRes.data;
      setUser(u);
      setGroupId(u.group?.id ?? '');
      setUserStatus(u.status);
      setMemo(u.memo ?? '');
      setGroups(groupRes.data?.items ?? groupRes.data ?? []);
    });
  }, [id]);

  useEffect(() => {
    if (tab !== 'orders') return;
    setOrdersLoading(true);
    adminApi
      .get(`/admin/users/${id}/orders`, { params: { page: orderPage, limit: orderLimit } })
      .then(({ data }) => {
        setOrders(data.items ?? []);
        setOrderTotal(data.total ?? 0);
        setTotalPurchase(data.totalPurchase ?? 0);
      })
      .finally(() => setOrdersLoading(false));
  }, [tab, id, orderPage]);

  async function handleUserUpdate() {
    setSaving(true);
    try {
      await adminApi.put(`/admin/users/${id}`, {
        groupId: groupId || undefined,
        status: userStatus,
        reason: reason || undefined,
      });
      setMsg('저장되었습니다.');
      setUser((u) => u ? { ...u, status: userStatus } : u);
    } finally {
      setSaving(false);
    }
  }

  async function handlePointAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!pointAmount || !pointReason) return;
    setPointSaving(true);
    try {
      await adminApi.post(`/admin/users/${id}/points`, {
        amount: Number(pointAmount),
        reason: pointReason,
      });
      setMsg(`와이즈 ${Number(pointAmount) > 0 ? '+' : ''}${pointAmount}W 조정 완료`);
      setUser((u) => u ? { ...u, pointBalance: (u.pointBalance ?? 0) + Number(pointAmount) } : u);
      setPointAmount('');
      setPointReason('');
    } finally {
      setPointSaving(false);
    }
  }

  async function handleMemoSave() {
    setMemoSaving(true);
    try {
      await adminApi.put(`/admin/users/${id}`, { memo });
      setMsg('메모가 저장되었습니다.');
      setUser((u) => u ? { ...u, memo } : u);
    } finally {
      setMemoSaving(false);
    }
  }

  if (!user) return <p className="text-gray-400 text-sm">불러오는 중...</p>;

  const orderTotalPages = Math.ceil(orderTotal / orderLimit);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← 뒤로</button>
        <h1 className="text-xl font-bold text-gray-900">회원 상세</h1>
        <span className="text-sm text-gray-500">{user.name} · {user.email}</span>
      </div>

      {msg && (
        <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">{msg}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {(['info', 'orders', 'memo'] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = { info: '기본 정보', orders: '주문 내역', memo: '메모' };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* 기본 정보 tab */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">회원 정보</h2>
            <dl className="space-y-3 text-sm">
              {([
                ['이름', user.name],
                ['이메일', user.email],
                ['전화번호', user.phone],
                ['사업자명', user.businessName],
                ['사업자번호', user.businessNumber],
                ['와이즈 잔액', `${(user.pointBalance ?? 0).toLocaleString()}W`],
                ['마지막 접속', user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '없음'],
                ['가입일', new Date(user.createdAt).toLocaleString('ko-KR')],
              ] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-4">회원 관리</h2>
              <div className="space-y-3">
                {groups.length > 0 && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">고객 그룹</label>
                    <select
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">그룹 없음</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">상태</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {USER_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">사유</label>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="정지 사유 등"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleUserUpdate}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-1">와이즈 조정</h2>
              <p className="text-xs text-gray-400 mb-4">
                현재 잔액: <strong>{(user.pointBalance ?? 0).toLocaleString()}W</strong>
                &nbsp;| 음수 입력 시 차감
              </p>
              <form onSubmit={handlePointAdjust} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">조정 와이즈</label>
                  <input
                    type="number"
                    value={pointAmount}
                    onChange={(e) => setPointAmount(e.target.value)}
                    placeholder="예: 1000 또는 -500"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">사유</label>
                  <input
                    value={pointReason}
                    onChange={(e) => setPointReason(e.target.value)}
                    placeholder="이벤트 지급, 오류 수정 등"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pointSaving}
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {pointSaving ? '처리 중...' : '와이즈 조정'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 주문 내역 tab */}
      {tab === 'orders' && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg px-4 py-3">
              <p className="text-xs text-blue-500 mb-0.5">총 구매액 (취소/환불 제외)</p>
              <p className="text-lg font-bold text-blue-700">₩{totalPurchase.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">총 주문 수</p>
              <p className="text-lg font-bold text-gray-700">{orderTotal.toLocaleString()}건</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">주문번호</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">상품</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">상태</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">결제금액</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">주문일</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">불러오는 중...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">주문 내역이 없습니다</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {o.items?.length > 0
                          ? `${o.items[0].product?.name ?? '상품'}${o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : ''}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {ORDER_STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ₩{o.finalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(o.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {orderTotalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: orderTotalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setOrderPage(p)}
                  className={`w-8 h-8 rounded text-sm ${p === orderPage ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 메모 tab */}
      {tab === 'memo' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-2">관리자 메모</h2>
            <p className="text-xs text-gray-400 mb-4">회원에 대한 내부 메모를 작성합니다. 회원에게는 표시되지 않습니다.</p>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={8}
              placeholder="메모를 입력하세요..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleMemoSave}
              disabled={memoSaving}
              className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {memoSaving ? '저장 중...' : '메모 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
