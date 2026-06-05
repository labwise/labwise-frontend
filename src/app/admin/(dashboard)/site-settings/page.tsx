'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '@/lib/admin-api';
import {
  Save, Upload, X, Plus, Image as ImageIcon,
  Building2, Palette, LayoutDashboard, GripVertical,
} from 'lucide-react';

type Tab = 'hero' | 'branding' | 'company';

interface SiteConfig {
  logoUrl?: string; faviconUrl?: string; siteName?: string;
  heroType?: 'single' | 'slider'; heroHeight?: number;
  heroImages?: string[]; heroInterval?: number;
  companyName?: string; ceoName?: string; businessNumber?: string;
  address?: string; phone?: string; email?: string; footerCopyright?: string;
}

const DEFAULTS: SiteConfig = {
  heroType: 'single', heroHeight: 500, heroImages: [], heroInterval: 4000,
};

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await adminApi.post('/admin/uploads/site', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

function ImageUploadBox({
  value, onChange, label, hint,
}: { value?: string; onChange: (url: string) => void; label: string; hint?: string }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="mb-2 text-xs text-gray-400">{hint}</p>}
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {value ? (
          <div className="relative w-full">
            <img src={value} alt="preview" className="mx-auto max-h-32 rounded-lg object-contain" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            {uploading
              ? <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              : <Upload size={24} className="text-gray-400" />
            }
            <p className="mt-2 text-xs text-gray-500">{uploading ? '업로드 중...' : '클릭 또는 드래그하여 업로드'}</p>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}

export default function SiteSettingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('hero');
  const [cfg, setCfg] = useState<SiteConfig>({ ...DEFAULTS });
  const [saved, setSaved] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const { data: loaded } = useQuery<SiteConfig>({
    queryKey: ['site-settings-admin'],
    queryFn: async () => {
      const { data } = await adminApi.get('/admin/site-settings');
      return data;
    },
  });

  useEffect(() => {
    if (loaded) setCfg({ ...DEFAULTS, ...loaded });
  }, [loaded]);

  const save = useMutation({
    mutationFn: () => adminApi.put('/admin/site-settings', cfg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function set(key: keyof SiteConfig, value: any) {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }

  async function addHeroImage(file: File) {
    setHeroUploading(true);
    try {
      const url = await uploadFile(file);
      set('heroImages', [...(cfg.heroImages ?? []), url]);
    } finally {
      setHeroUploading(false);
    }
  }

  function removeHeroImage(idx: number) {
    set('heroImages', (cfg.heroImages ?? []).filter((_, i) => i !== idx));
  }

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">사이트 설정</h1>
          <p className="mt-1 text-sm text-gray-500">메인 배너, 브랜딩, 회사 정보를 관리합니다.</p>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={15} />
          {saved ? '저장됨 ✓' : save.isPending ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* 탭 */}
      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {([
          ['hero', '메인 배너', LayoutDashboard],
          ['branding', '브랜딩', Palette],
          ['company', '회사 정보', Building2],
        ] as [Tab, string, any][]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── 메인 배너 탭 ── */}
      {tab === 'hero' && (
        <div className="space-y-6">
          {/* 배너 유형 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-800">배너 유형</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['single', 'slider'] as const).map((type) => (
                <button key={type} type="button" onClick={() => set('heroType', type)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                    cfg.heroType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <ImageIcon size={24} className={cfg.heroType === type ? 'text-blue-600' : 'text-gray-400'} />
                  <span className={`text-sm font-medium ${cfg.heroType === type ? 'text-blue-700' : 'text-gray-600'}`}>
                    {type === 'single' ? '단일 이미지' : '슬라이드쇼'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {type === 'single' ? '이미지 1장 고정' : '여러 장 자동 전환'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 높이 설정 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-800">배너 높이</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <input type="range" min={200} max={900} step={10}
                  value={cfg.heroHeight ?? 500}
                  onChange={(e) => set('heroHeight', Number(e.target.value))}
                  className="flex-1 accent-blue-600" />
                <div className="flex w-24 items-center gap-1">
                  <input type="number" min={200} max={900}
                    value={cfg.heroHeight ?? 500}
                    onChange={(e) => set('heroHeight', Number(e.target.value))}
                    className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-sm text-gray-500">px</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>200px (낮음)</span>
                <span>미리보기: {cfg.heroHeight ?? 500}px</span>
                <span>900px (높음)</span>
              </div>
            </div>
          </div>

          {/* 이미지 등록 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">
                배너 이미지 {cfg.heroType === 'single' ? '(최대 1장)' : '(여러 장 가능)'}
              </h2>
              {(cfg.heroType === 'slider' || !(cfg.heroImages?.length)) && (
                <button onClick={() => heroInputRef.current?.click()} disabled={heroUploading}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {heroUploading ? '업로드 중...' : <><Plus size={12} /> 이미지 추가</>}
                </button>
              )}
            </div>
            <input ref={heroInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) addHeroImage(f); e.target.value = ''; }} />

            {(cfg.heroImages?.length ?? 0) === 0 ? (
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-10 hover:border-blue-400"
                onClick={() => heroInputRef.current?.click()}
              >
                <Upload size={28} className="text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">클릭하여 이미지 업로드</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {cfg.heroImages!.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <button onClick={() => removeHeroImage(idx)}
                        className="opacity-0 group-hover:opacity-100 rounded-full bg-red-500 p-1.5 text-white">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </div>
                  </div>
                ))}
                {cfg.heroType === 'slider' && (
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 h-32 hover:border-blue-400"
                    onClick={() => heroInputRef.current?.click()}
                  >
                    <Plus size={20} className="text-gray-400" />
                    <p className="mt-1 text-xs text-gray-400">추가</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 슬라이드 간격 */}
          {cfg.heroType === 'slider' && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 font-semibold text-gray-800">슬라이드 전환 간격</h2>
              <div className="flex items-center gap-3">
                {[3000, 4000, 5000, 6000, 8000].map((ms) => (
                  <button key={ms} onClick={() => set('heroInterval', ms)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      cfg.heroInterval === ms ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {ms / 1000}초
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 브랜딩 탭 ── */}
      {tab === 'branding' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-800">사이트 이름</h2>
            <input value={cfg.siteName ?? ''} onChange={(e) => set('siteName', e.target.value)}
              placeholder="랩와이즈" className={inputCls} />
            <p className="mt-1 text-xs text-gray-400">브라우저 탭 제목과 SEO에 사용됩니다.</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <ImageUploadBox
              label="로고 이미지"
              value={cfg.logoUrl}
              onChange={(url) => set('logoUrl', url)}
              hint="헤더와 푸터에 표시됩니다. PNG/SVG 투명 배경 권장."
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <ImageUploadBox
              label="파비콘"
              value={cfg.faviconUrl}
              onChange={(url) => set('faviconUrl', url)}
              hint="브라우저 탭 아이콘. 32×32px ICO 또는 PNG 권장."
            />
          </div>
        </div>
      )}

      {/* ── 회사 정보 탭 ── */}
      {tab === 'company' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">푸터 회사 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">상호명</label>
              <input value={cfg.companyName ?? ''} onChange={(e) => set('companyName', e.target.value)}
                placeholder="(주)랩와이즈" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">대표자명</label>
              <input value={cfg.ceoName ?? ''} onChange={(e) => set('ceoName', e.target.value)}
                placeholder="홍길동" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">사업자등록번호</label>
              <input value={cfg.businessNumber ?? ''} onChange={(e) => set('businessNumber', e.target.value)}
                placeholder="000-00-00000" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">대표 전화</label>
              <input value={cfg.phone ?? ''} onChange={(e) => set('phone', e.target.value)}
                placeholder="02-0000-0000" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">이메일</label>
              <input value={cfg.email ?? ''} onChange={(e) => set('email', e.target.value)}
                placeholder="info@labwise.kr" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">주소</label>
              <input value={cfg.address ?? ''} onChange={(e) => set('address', e.target.value)}
                placeholder="서울특별시 강남구 ..." className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">푸터 저작권 문구</label>
              <input value={cfg.footerCopyright ?? ''} onChange={(e) => set('footerCopyright', e.target.value)}
                placeholder="© 2026 랩와이즈. All rights reserved." className={inputCls} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
