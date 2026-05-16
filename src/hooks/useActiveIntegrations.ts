import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Provider = 'GOOGLE' | 'KAKAO' | 'NAVER';

export function useActiveIntegrations() {
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    api
      .get('/auth/integrations/active')
      .then(({ data }) => setProviders(data.providers ?? []))
      .catch(() => setProviders([]));
  }, []);

  return {
    hasGoogle: providers.includes('GOOGLE'),
    hasKakao: providers.includes('KAKAO'),
    hasNaver: providers.includes('NAVER'),
    hasSocial: providers.some((p) => ['GOOGLE', 'KAKAO', 'NAVER'].includes(p)),
  };
}
