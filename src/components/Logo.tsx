'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface LogoProps { className?: string }

export function Logo({ className = 'h-9 w-auto' }: LogoProps) {
  const { data } = useQuery<{ logoUrl?: string }>({
    queryKey: ['site-settings'],
    queryFn: async () => { const { data } = await api.get('/site-settings'); return data; },
    staleTime: 1000 * 60 * 5,
  });

  const src = data?.logoUrl || '/logo.svg';

  return (
    <img src={src} alt="랩와이즈" className={className} style={{ display: 'block' }} />
  );
}
