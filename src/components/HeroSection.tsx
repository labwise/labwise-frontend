'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface SiteConfig {
  heroType?: 'single' | 'slider';
  heroHeight?: number;
  heroImages?: string[];
  heroInterval?: number;
}

export function HeroSection() {
  const [idx, setIdx] = useState(0);

  const { data: cfg } = useQuery<SiteConfig>({
    queryKey: ['site-settings'],
    queryFn: async () => { const { data } = await api.get('/site-settings'); return data; },
    staleTime: 1000 * 60 * 5,
  });

  const images = cfg?.heroImages ?? [];
  const height = cfg?.heroHeight ?? 500;
  const isSlider = cfg?.heroType === 'slider' && images.length > 1;
  const interval = cfg?.heroInterval ?? 4000;

  useEffect(() => {
    if (!isSlider) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % images.length), interval);
    return () => clearInterval(timer);
  }, [isSlider, images.length, interval]);

  // 이미지가 있을 경우
  if (images.length > 0) {
    return (
      <section className="relative overflow-hidden bg-gray-900" style={{ height }}>
        {/* 이미지 */}
        {images.map((src, i) => (
          <div key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}>
            <Image src={src} alt="" fill className="object-cover" priority={i === 0} />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ))}

        {/* 슬라이더 화살표 */}
        {isSlider && (
          <>
            <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 z-10">
              <ChevronLeft size={24} />
            </button>
            <button onClick={() => setIdx((i) => (i + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 z-10">
              <ChevronRight size={24} />
            </button>
            {/* 인디케이터 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </section>
    );
  }

  // 기본 히어로 (이미지 없을 때)
  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 text-white flex items-center justify-center"
      style={{ height }}>
      <div className="mx-auto max-w-7xl text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          실험실 소모품 전문 쇼핑몰
        </h1>
        <p className="mb-8 text-lg text-blue-100 md:text-xl">
          대학교·연구기관·기업 R&D팀을 위한 검증된 실험 소모품을 만나보세요
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/products"
            className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50">
            상품 둘러보기 <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/register"
            className="rounded-lg border border-white px-6 py-3 font-semibold text-white hover:bg-white/10">
            회원가입
          </Link>
        </div>
      </div>
    </section>
  );
}
