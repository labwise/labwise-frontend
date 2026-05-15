import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">고객 지원</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/faq" className="hover:text-blue-600">자주 묻는 질문</Link></li>
              <li><Link href="/shipping" className="hover:text-blue-600">배송 안내</Link></li>
              <li><Link href="/return" className="hover:text-blue-600">반품/교환 안내</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">회원 서비스</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/my/orders" className="hover:text-blue-600">주문 내역</Link></li>
              <li><Link href="/my/points" className="hover:text-blue-600">포인트 내역</Link></li>
              <li><Link href="/point-mall" className="hover:text-blue-600">포인트몰</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">법적 고지</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/terms" className="hover:text-blue-600">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600">개인정보처리방침</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">연락처</h3>
            <p className="text-sm text-gray-500">고객센터: 02-1234-5678</p>
            <p className="text-sm text-gray-500">이메일: support@labwise.kr</p>
            <p className="mt-2 text-sm text-gray-500">평일 09:00–18:00</p>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-400">
          <p>© 2026 랩와이즈. All rights reserved.</p>
          <p className="mt-1">사업자등록번호: 000-00-00000 | 대표: 홍길동</p>
        </div>
      </div>
    </footer>
  );
}
