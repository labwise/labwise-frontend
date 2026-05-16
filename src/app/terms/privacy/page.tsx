import Link from 'next/link';

export const metadata = { title: '개인정보처리방침 | 랩와이즈' };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 홈으로</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
      <p className="text-sm text-gray-500 mb-8">시행일: 2026년 1월 1일</p>

      <div className="text-gray-700 space-y-8 text-sm leading-relaxed">

        <p>
          랩와이즈(이하 &quot;회사&quot;)는 「개인정보보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제1조 (개인정보의 수집 및 이용 목적)</h2>
          <p className="mb-2">회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
          <ul className="space-y-1 ml-4">
            <li>① 회원 가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정이용 방지와 비인가 사용 방지, 가입의사 확인, 불만처리 등 민원처리, 고지사항 전달</li>
            <li>② 재화 또는 서비스 제공: 물품 배송, 서비스 제공, 청구서 발송, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 결제 및 정산</li>
            <li>③ 마케팅 및 광고에의 활용 (별도 동의 시): 신규 서비스 개발 및 특화, 이벤트 등 광고성 정보 전달, 인구통계학적 특성에 따른 서비스 제공 및 광고 게재</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제2조 (수집하는 개인정보 항목)</h2>
          <p className="mb-2">회사는 회원가입, 서비스 이용, 상담 등을 위해 아래와 같은 개인정보를 수집합니다.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">구분</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">수집 항목</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">수집 방법</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-medium">필수 (회원가입)</td>
                  <td className="border border-gray-200 px-3 py-2">이메일, 비밀번호, 이름, 휴대폰 번호, 주소(우편번호, 기본주소, 상세주소)</td>
                  <td className="border border-gray-200 px-3 py-2">회원가입 화면 직접 입력</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-medium">선택 (소셜 로그인)</td>
                  <td className="border border-gray-200 px-3 py-2">이메일, 이름, 소셜 고유 식별자</td>
                  <td className="border border-gray-200 px-3 py-2">소셜 플랫폼 연동 시 자동 수집</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-medium">서비스 이용 시</td>
                  <td className="border border-gray-200 px-3 py-2">주문 정보(상품명, 수량, 금액), 배송지 정보, 결제 수단 정보</td>
                  <td className="border border-gray-200 px-3 py-2">서비스 이용 과정 중 자동 수집</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-medium">자동 수집</td>
                  <td className="border border-gray-200 px-3 py-2">IP주소, 쿠키, 서비스 이용 기록, 접속 로그</td>
                  <td className="border border-gray-200 px-3 py-2">서비스 이용 중 자동 생성</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제3조 (개인정보의 보유 및 이용 기간)</h2>
          <p className="mb-2">회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">보유 항목</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">보유 근거</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">회원정보</td>
                  <td className="border border-gray-200 px-3 py-2">이용자 동의</td>
                  <td className="border border-gray-200 px-3 py-2">회원 탈퇴 시까지</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">계약 또는 청약 철회 기록</td>
                  <td className="border border-gray-200 px-3 py-2">전자상거래법</td>
                  <td className="border border-gray-200 px-3 py-2">5년</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">대금 결제 및 재화 공급 기록</td>
                  <td className="border border-gray-200 px-3 py-2">전자상거래법</td>
                  <td className="border border-gray-200 px-3 py-2">5년</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">소비자 불만 또는 분쟁 처리 기록</td>
                  <td className="border border-gray-200 px-3 py-2">전자상거래법</td>
                  <td className="border border-gray-200 px-3 py-2">3년</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">서비스 접속 로그</td>
                  <td className="border border-gray-200 px-3 py-2">통신비밀보호법</td>
                  <td className="border border-gray-200 px-3 py-2">3개월</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제4조 (개인정보의 제3자 제공)</h2>
          <p className="mb-2">회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
          <ul className="ml-4 space-y-1">
            <li>① 이용자들이 사전에 동의한 경우</li>
            <li>② 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
          <p className="mt-3 mb-2">서비스 운영을 위해 아래와 같이 개인정보를 제3자에게 제공합니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">제공받는 자</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">제공 목적</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">제공 항목</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">택배사 (CJ대한통운 등)</td>
                  <td className="border border-gray-200 px-3 py-2">상품 배송</td>
                  <td className="border border-gray-200 px-3 py-2">수령인 성명, 주소, 연락처</td>
                  <td className="border border-gray-200 px-3 py-2">배송 완료 후 즉시 파기</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">토스페이먼츠(주)</td>
                  <td className="border border-gray-200 px-3 py-2">결제 처리</td>
                  <td className="border border-gray-200 px-3 py-2">주문금액, 주문번호</td>
                  <td className="border border-gray-200 px-3 py-2">관련 법령에 따름</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제5조 (개인정보 처리 위탁)</h2>
          <p className="mb-2">회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">수탁업체</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">위탁 업무 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">COOLSMS</td>
                  <td className="border border-gray-200 px-3 py-2">SMS 본인인증 발송</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Amazon Web Services (AWS)</td>
                  <td className="border border-gray-200 px-3 py-2">서버 및 데이터 보관 (국내 리전)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
          <ul className="space-y-2 ml-4">
            <li>① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
              <ul className="ml-4 mt-1 space-y-1">
                <li>- 개인정보 열람 요구</li>
                <li>- 오류 등이 있을 경우 정정 요구</li>
                <li>- 삭제 요구</li>
                <li>- 처리 정지 요구</li>
              </ul>
            </li>
            <li>② 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.</li>
            <li>③ 이용자가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제7조 (개인정보의 파기)</h2>
          <ul className="space-y-2 ml-4">
            <li>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</li>
            <li>② 전자적 파일 형태의 정보는 기술적 방법을 사용하여 재생할 수 없는 방법으로 삭제하며, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제8조 (개인정보 보호책임자)</h2>
          <p className="mb-2">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
            <p className="font-medium text-gray-900 mb-2">▶ 개인정보 보호책임자</p>
            <ul className="space-y-1">
              <li>성명: 랩와이즈 개인정보 보호팀</li>
              <li>전화번호: 고객센터를 통해 문의</li>
              <li>이메일: privacy@labwise.co.kr</li>
            </ul>
          </div>
          <p className="mt-3">
            정보주체께서는 회사의 서비스(또는 사업)를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제9조 (개인정보 처리방침 변경)</h2>
          <p>
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </p>
        </section>

        <div className="border-t border-gray-200 pt-6 mt-8">
          <p className="text-sm text-gray-500">부칙: 이 방침은 2026년 1월 1일부터 시행합니다.</p>
          <p className="text-sm text-gray-500 mt-1">문의: privacy@labwise.co.kr</p>
        </div>
      </div>
    </div>
  );
}
