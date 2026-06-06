'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Heart, Calendar, Building2, FileCheck } from 'lucide-react';

interface Certificate {
  id: string;
  orgName: string;
  amount: number;
  certificateDate: string;
  imageBase64: string | null;
  note: string | null;
  createdAt: string;
}

export default function DonationsPage() {
  const { data: certs = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ['donation-certificates'],
    queryFn: async () => {
      const { data } = await api.get('/jackpot/certificates');
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* 헤더 */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Heart className="h-7 w-7 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">기부 내역</h1>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          랩와이즈는 구매 금액의 1.5%를 어린이·봉사단체에 정기적으로 기부합니다.
          <br />아래에서 실제 기부 증서를 확인하실 수 있습니다.
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-400">불러오는 중...</div>
      ) : certs.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <FileCheck className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">아직 등록된 기부 내역이 없습니다.</p>
          <p className="text-gray-300 text-xs mt-1">기부 후 증서를 공개하겠습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {certs.map((cert) => (
            <div key={cert.id} className="rounded-2xl border border-green-100 bg-white overflow-hidden shadow-sm">
              {/* 이미지 */}
              {cert.imageBase64 && (
                <div className="border-b border-green-50 bg-green-50/40 p-4 flex justify-center">
                  <img
                    src={cert.imageBase64}
                    alt={`${cert.orgName} 기부 증서`}
                    className="max-h-64 rounded-lg object-contain shadow-sm"
                  />
                </div>
              )}

              {/* 정보 */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <h2 className="font-semibold text-gray-900">{cert.orgName}</h2>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{cert.certificateDate}</span>
                    </div>
                    {cert.note && (
                      <p className="mt-2 text-sm text-gray-600">{cert.note}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-green-600 font-medium">기부 금액</p>
                    <p className="text-xl font-bold text-green-700">{formatPrice(Number(cert.amount))}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-xl bg-green-50 border border-green-100 p-5 text-sm text-green-800 text-center">
        <p className="font-medium mb-1">🌱 투명한 기부를 약속합니다</p>
        <p className="text-xs text-green-600">
          랩와이즈는 모든 기부 내역을 증서와 함께 이 페이지에 공개합니다.
          구매하실 때마다 구매 금액의 1.5%가 기부금으로 적립됩니다.
        </p>
      </div>
    </div>
  );
}
