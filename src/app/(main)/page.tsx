import { Package, Shield, Truck } from 'lucide-react';
import { FeaturedProducts } from '@/components/FeaturedProducts';
import { HeroSection } from '@/components/HeroSection';

export default function HomePage() {
  return (
    <div>
      <HeroSection />

      <FeaturedProducts />

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">다양한 상품</h3>
              <p className="text-sm text-gray-500">10,000종 이상의 실험실 소모품을 한 곳에서 주문하세요</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">품질 보증</h3>
              <p className="text-sm text-gray-500">검증된 공급업체의 정품만을 취급합니다</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">빠른 배송</h3>
              <p className="text-sm text-gray-500">당일 주문 시 익일 배송 (5만원 이상 무료)</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
