'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Search, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useInstitutionStore } from '@/store/institution.store';

const INSTITUTION_DOMAINS = ['ac.kr', 're.kr', 'go.kr', 'edu.kr', 'or.kr'];

function isInstitutionEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return INSTITUTION_DOMAINS.some((d) => domain.endsWith(d));
}

type Step = 'search' | 'create';

interface SearchResult {
  id: string;
  name: string;
  department?: string;
}

export default function InstitutionRegisterPage() {
  const router = useRouter();
  const { fetchInstitution } = useInstitutionStore();
  const [step, setStep] = useState<Step>('search');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 신규 등록 폼
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get('/institution/search', { params: { keyword } });
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async (institutionId: string) => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/institution/join/${institutionId}`);
      alert('가입 요청을 보냈습니다. 기관 관리자의 승인 후 기관 모드를 사용할 수 있습니다.');
      router.push('/');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '가입 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const needsBizNum = userEmail && !isInstitutionEmail(userEmail);
    if (needsBizNum && !businessNumber.trim()) {
      setError('개인 이메일(gmail, naver 등)로 가입 시 사업자번호가 필요합니다.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/institution/register', {
        name: name.trim(),
        department: department.trim() || undefined,
        businessNumber: businessNumber.trim() || undefined,
      });
      await fetchInstitution();
      router.push('/institution/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '기관 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-xl px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
            <Building2 className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">기관 등록 / 참여</h1>
          <p className="mt-2 text-sm text-gray-500">
            기관 구매 계정을 만들거나 기존 기관에 참여하세요
          </p>
        </div>

        {/* 탭 */}
        <div className="mb-6 flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setStep('search')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              step === 'search' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            기존 기관 참여
          </button>
          <button
            onClick={() => setStep('create')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              step === 'create' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            새 기관 등록
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {step === 'search' && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="mb-4 text-sm text-gray-600">
              소속 기관명으로 검색 후 참여 요청을 보내세요. 기관 관리자 승인 후 기관 모드를 사용할 수 있습니다.
            </p>
            <div className="flex gap-2">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="기관명 검색..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                검색
              </button>
            </div>

            {searchResults.length > 0 && (
              <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200">
                {searchResults.map((inst) => (
                  <li key={inst.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inst.name}</p>
                      {inst.department && (
                        <p className="text-xs text-gray-500">{inst.department}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleJoin(inst.id)}
                      disabled={loading}
                      className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-60"
                    >
                      참여 요청
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {searchResults.length === 0 && keyword && !searching && (
              <p className="mt-4 text-center text-sm text-gray-400">
                검색 결과가 없습니다.{' '}
                <button onClick={() => setStep('create')} className="text-indigo-600 hover:underline">
                  새 기관을 등록하세요
                </button>
              </p>
            )}
          </div>
        )}

        {step === 'create' && (
          <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <p className="text-sm text-gray-600">
              기관을 새로 등록하면 자동으로 관리자가 됩니다.
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">기관명 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="예: 한국화학연구원"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">부서명 (선택)</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="예: 분석화학팀"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                사업자번호
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (gmail/naver 등 개인 이메일 사용 시 필수)
                </span>
              </label>
              <input
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value)}
                placeholder="000-00-00000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                @ac.kr, @re.kr, @go.kr 등 기관 이메일은 입력 불필요
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? '등록 중...' : '기관 등록하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
