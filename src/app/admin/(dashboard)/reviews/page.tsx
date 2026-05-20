'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { Star, Eye, EyeOff, Trash2 } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  content: string;
  isVisible: boolean;
  createdAt: string;
  user?: { name: string; email: string };
  product?: { name: string };
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={12} className={i <= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = () => {
    setLoading(true);
    adminApi.get('/admin/reviews', { params: { page, limit } })
      .then(({ data }) => { setReviews(data.items ?? []); setTotal(data.total ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  async function toggleVisible(id: string) {
    await adminApi.put(`/admin/reviews/${id}/visible`);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, isVisible: !r.isVisible } : r));
  }

  async function del(id: string) {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return;
    await adminApi.delete(`/admin/reviews/${id}`);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => t - 1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">리뷰 관리</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">상품</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">회원</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">평점</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">내용</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">노출</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">작성일</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">불러오는 중...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">리뷰가 없습니다</td></tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!r.isVisible ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate">{r.product?.name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 font-medium">{r.user?.name}</p>
                    <p className="text-xs text-gray-400">{r.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center"><Stars n={r.rating} /></td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.content}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${r.isVisible ? 'text-green-600' : 'text-gray-400'}`}>
                      {r.isVisible ? '노출' : '숨김'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => toggleVisible(r.id)} title={r.isVisible ? '숨기기' : '노출'}>
                        {r.isVisible ? <EyeOff size={15} className="text-gray-400 hover:text-gray-600" /> : <Eye size={15} className="text-blue-500 hover:text-blue-700" />}
                      </button>
                      <button onClick={() => del(r.id)}>
                        <Trash2 size={15} className="text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
