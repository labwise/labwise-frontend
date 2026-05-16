import Link from 'next/link';

export const metadata = { title: '이용약관 | 랩와이즈' };

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 홈으로</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">이용약관</h1>
      <p className="text-sm text-gray-500 mb-8">시행일: 2026년 1월 1일</p>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-8">

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제1조 (목적)</h2>
          <p>
            이 약관은 랩와이즈(이하 &quot;회사&quot;)가 운영하는 실험실 소모품 전문 쇼핑몰 &quot;랩와이즈&quot;(이하 &quot;서비스&quot;)에서 제공하는 인터넷 관련 서비스(이하 &quot;서비스&quot;)를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제2조 (정의)</h2>
          <ul className="list-none space-y-2">
            <li>① &quot;서비스&quot;란 회사가 운영하는 웹사이트 및 모바일 앱을 통해 실험실 소모품 등 재화와 용역을 이용자에게 제공하는 것을 의미합니다.</li>
            <li>② &quot;이용자&quot;란 회사의 사이트에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
            <li>③ &quot;회원&quot;이란 회사에 개인정보를 제공하여 회원 등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
            <li>④ &quot;비회원&quot;이란 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제3조 (약관의 게시와 개정)</h2>
          <ul className="list-none space-y-2">
            <li>① 회사는 이 약관의 내용과 상호, 영업소 소재지 주소(소비자의 불만을 처리할 수 있는 곳의 주소 포함), 대표자의 성명, 사업자등록번호, 연락처(전화, 팩스, 전자우편 주소 등) 등을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
            <li>② 회사는 이용자가 약관에 동의하기에 앞서 약관에 정하여져 있는 내용 중 청약철회·배송책임·환불조건 등과 같은 중요한 내용을 이용자가 이해할 수 있도록 별도의 연결화면 또는 팝업화면 등을 제공하여 이용자의 확인을 구합니다.</li>
            <li>③ 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「전자문서 및 전자거래기본법」, 「전자금융거래법」, 「전자서명법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「소비자기본법」 등 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
            <li>④ 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 서비스의 초기 화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다. 다만, 이용자에게 불리하게 약관 내용을 변경하는 경우에는 최소한 30일 이상의 사전 유예기간을 두고 공지합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제4조 (서비스의 제공 및 변경)</h2>
          <ul className="list-none space-y-2">
            <li>① 회사는 다음과 같은 업무를 수행합니다.
              <ul className="ml-4 mt-1 space-y-1">
                <li>- 실험실 소모품 및 관련 재화에 대한 정보 제공 및 구매계약의 체결</li>
                <li>- 구매계약이 체결된 재화의 배송</li>
                <li>- 기타 회사가 정하는 업무</li>
              </ul>
            </li>
            <li>② 회사는 재화 또는 용역의 품절 또는 기술적 사양의 변경 등의 경우에는 장차 체결되는 계약에 의해 제공할 재화 또는 용역의 내용을 변경할 수 있습니다. 이 경우에는 변경된 재화 또는 용역의 내용 및 제공일자를 명시하여 현재의 재화 또는 용역의 내용을 게시한 곳에 즉시 공지합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제5조 (서비스의 중단)</h2>
          <ul className="list-none space-y-2">
            <li>① 회사는 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
            <li>② 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제6조 (회원 가입)</h2>
          <ul className="list-none space-y-2">
            <li>① 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</li>
            <li>② 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
              <ul className="ml-4 mt-1 space-y-1">
                <li>- 가입신청자가 이 약관 제7조 제3항에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                <li>- 등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                <li>- 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
              </ul>
            </li>
            <li>③ 회원가입계약의 성립 시기는 회사의 승낙이 회원에게 도달한 시점으로 합니다.</li>
            <li>④ 회원은 회원정보에 변경이 있는 경우 즉시 전자우편 기타 방법으로 회사에 대하여 그 변경사항을 알려야 합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제7조 (회원 탈퇴 및 자격 상실)</h2>
          <ul className="list-none space-y-2">
            <li>① 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.</li>
            <li>② 회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.
              <ul className="ml-4 mt-1 space-y-1">
                <li>- 가입 신청 시에 허위 내용을 등록한 경우</li>
                <li>- 회사를 이용하여 구입한 재화 등의 대금, 기타 회사 이용에 관련하여 회원이 부담하는 채무를 기일에 지급하지 않는 경우</li>
                <li>- 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                <li>- 회사를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제8조 (구매신청 및 개인정보 제공 동의)</h2>
          <ul className="list-none space-y-2">
            <li>① 이용자는 서비스에서 다음 또는 이와 유사한 방법에 의하여 구매를 신청하며, 회사는 이용자가 구매신청을 함에 있어서 다음의 각 내용을 알기 쉽게 제공하여야 합니다.
              <ul className="ml-4 mt-1 space-y-1">
                <li>- 재화 등의 검색 및 선택</li>
                <li>- 받는 사람의 성명, 주소, 전화번호, 전자우편주소(또는 이동전화번호) 등의 입력</li>
                <li>- 약관 내용, 청약철회권이 제한되는 서비스, 배송료·설치비 등의 비용부담과 관련한 내용에 대한 확인</li>
                <li>- 이 약관에 동의하고 위 사항을 확인하거나 거부하는 표시(예, 마우스 클릭)</li>
                <li>- 재화 등의 구매신청 및 이에 관한 확인 또는 회사의 확인에 대한 동의</li>
                <li>- 결제방법의 선택</li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제9조 (청약철회 등)</h2>
          <ul className="list-none space-y-2">
            <li>① 회사와 재화 등의 구매에 관한 계약을 체결한 이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」 제13조 제2항에 따른 계약내용에 관한 서면을 받은 날(그 서면을 받은 때보다 재화 등의 공급이 늦게 이루어진 경우에는 재화 등을 공급받거나 재화 등의 공급이 시작된 날을 말합니다)부터 7일 이내에는 청약의 철회를 할 수 있습니다.</li>
            <li>② 이용자는 재화 등을 배송 받은 경우 다음 각 호의 1에 해당하는 경우에는 반품 및 교환을 할 수 없습니다.
              <ul className="ml-4 mt-1 space-y-1">
                <li>- 이용자에게 책임 있는 사유로 재화 등이 멸실 또는 훼손된 경우</li>
                <li>- 이용자의 사용 또는 일부 소비에 의하여 재화 등의 가치가 현저히 감소한 경우</li>
                <li>- 시간의 경과에 의하여 재판매가 곤란할 정도로 재화 등의 가치가 현저히 감소한 경우</li>
                <li>- 복제가 가능한 재화 등의 포장을 훼손한 경우</li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제10조 (개인정보보호)</h2>
          <p>
            회사는 이용자의 개인정보 수집 시 서비스 제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다. 회사는 개인정보를 「개인정보보호법」 등 관련 법령이 정하는 바에 따라 처리하며, 자세한 사항은 <Link href="/terms/privacy" className="text-blue-600 hover:underline">개인정보처리방침</Link>을 따릅니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제11조 (분쟁해결)</h2>
          <ul className="list-none space-y-2">
            <li>① 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.</li>
            <li>② 회사는 이용자로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다. 다만, 신속한 처리가 곤란한 경우에는 이용자에게 그 사유와 처리일정을 즉시 통보해 드립니다.</li>
            <li>③ 회사와 이용자 간에 발생한 전자상거래 분쟁과 관련하여 이용자의 피해구제신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">제12조 (재판권 및 준거법)</h2>
          <ul className="list-none space-y-2">
            <li>① 회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.</li>
            <li>② 제소 당시 이용자의 주소 또는 거소가 분명하지 않거나 외국 거주자의 경우에는 민사소송법상의 관할법원에 제기합니다.</li>
            <li>③ 회사와 이용자 간에 제기된 전자상거래 소송에는 한국법을 적용합니다.</li>
          </ul>
        </section>

        <div className="border-t border-gray-200 pt-6 mt-8">
          <p className="text-sm text-gray-500">부칙: 이 약관은 2026년 1월 1일부터 시행합니다.</p>
          <p className="text-sm text-gray-500 mt-1">문의: contact@labwise.co.kr</p>
        </div>
      </div>
    </div>
  );
}
