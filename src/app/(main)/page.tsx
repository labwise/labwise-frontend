import Link from 'next/link';
import { ArrowRight, Package, Shield, Truck } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-20 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            실험실 소모품 전문 쇼핑몰
          </h1>
          <p className="mb-8 text-lg text-blue-100 md:text-xl">
            대학교·연구기관·기업 R&D팀을 위한 검증된 실험 소모품을 만나보세요
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50"
            >
              상품 둘러보기 <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-white px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              회원가입
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">다양한 상품</h3>
              <p className="text-sm text-gray-500">
                10,000종 이상의 실험실 소모품을 한 곳에서 주문하세요
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">품질 보증</h3>
              <p className="text-sm text-gray-500">
                검증된 공급업체의 정품만을 취급합니다
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">빠른 배송</h3>
              <p className="text-sm text-gray-500">
                당일 주문 시 익일 배송 (5만원 이상 무료)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-100 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">와이즈몰도 확인해보세요</h2>
          <p className="mb-6 text-gray-500">
            인증회원이 되면 와이즈로 상품을 교환할 수 있습니다
          </p>
          <Link
            href="/point-mall"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            와이즈몰 바로가기 <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
