# Chart-to-Insight (C2I) Automator XML 예시

아래 XML은 [상세서.md](./상세서.md)의 구조를 빠짐없이 기계 해석용 계층으로 변환한 예시다.  
태그명은 파싱 안정성을 위해 영문으로 고정했고, 화면명과 문구는 원문 의미를 보존하도록 한글 값을 유지했다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<c2iSpecification id="c2i-automator" version="0.1" status="PLANNED" date="2026-04-18" locale="ko-KR">
  <documentMeta>
    <title>Chart-to-Insight (C2I) Automator 상세 명세서</title>
    <purpose>본 문서는 C2I Automator의 웹 서비스 UI/UX, 출력물, 상태값, 예외 처리 기준을 구현 가능한 수준으로 고정하는 기준 문서다.</purpose>
    <scope>PC 웹 MVP, 차트 업로드 1건 기준 단일 리포트 생성, 웹 프리뷰, PPTX 내보내기, 히스토리 조회</scope>
  </documentMeta>

  <tableOfContents>
    <item id="1" label="제품 범위"/>
    <item id="2" label="정보 구조 및 라우트"/>
    <item id="3" label="핵심 사용자 흐름"/>
    <item id="4" label="화면별 상세 명세"/>
    <item id="5" label="출력물 규격"/>
    <item id="6" label="디자인 토큰"/>
    <item id="7" label="레이아웃 규칙"/>
    <item id="8" label="공통 컴포넌트 규격"/>
    <item id="9" label="상태값 정의"/>
    <item id="10" label="반응형 기준"/>
    <item id="11" label="접근성 원칙"/>
    <item id="12" label="예외 처리 기준"/>
    <item id="13" label="콘텐츠 규칙"/>
    <item id="14" label="구현 품질 기준"/>
    <item id="15" label="문서 적용 우선순위"/>
  </tableOfContents>

  <section id="1" key="productScope" label="제품 범위">
    <mvpIncluded>
      <item>차트 이미지 1장 업로드</item>
      <item>OCR + Vision AI 기반 차트 텍스트/수치/추세 추출</item>
      <item>LLM 기반 핵심 요약 3줄 생성</item>
      <item>웹 에디터에서 템플릿 기반 실시간 프리뷰</item>
      <item>로고, 카테고리, 출처, 날짜 커스터마이징</item>
      <item>PPTX 파일 다운로드</item>
      <item>생성 이력 조회 및 재다운로드</item>
    </mvpIncluded>
    <mvpExcluded>
      <item>모바일 앱 전용 편집 UX</item>
      <item>차트 2장 이상을 1개 슬라이드에 합성하는 기능</item>
      <item>팀 협업 편집, 코멘트, 권한 관리</item>
      <item>사용자가 템플릿 레이아웃을 자유 배치하는 기능</item>
      <item>영상, GIF, 애니메이션 내보내기</item>
    </mvpExcluded>
    <productPrinciples>
      <principle order="1">사용자는 5단계 이내에 첫 리포트를 생성해야 한다.</principle>
      <principle order="2">AI 결과는 자동 반영하되, 신뢰도 낮은 항목은 반드시 사용자 확인을 거친다.</principle>
      <principle order="3">기본 출력물은 금융/경제 콘텐츠 제작에 바로 사용할 수 있어야 한다.</principle>
      <principle order="4">데스크톱 우선이다. 모바일은 편집 대상이 아니라 안내 대상이다.</principle>
      <principle order="5">차트 원본은 왜곡 없이 유지한다. 템플릿 때문에 차트 비율을 강제 변형하지 않는다.</principle>
    </productPrinciples>
  </section>

  <section id="2" key="informationArchitecture" label="정보 구조 및 라우트">
    <routes>
      <route path="/reports" screenName="리포트 대시보드" primaryAction="새 리포트 만들기" note="기본 진입 화면">
        <purpose>생성 이력 조회, 재편집, 재다운로드</purpose>
      </route>
      <route path="/reports/new" screenName="신규 리포트 에디터" primaryAction="이미지 업로드" note="저장 전 임시 draft 생성">
        <purpose>업로드, 분석, 요약, 프리뷰, 내보내기</purpose>
      </route>
      <route path="/reports/:id/edit" screenName="기존 리포트 편집" primaryAction="변경사항 저장" note="draft/complete 공용">
        <purpose>기존 데이터 수정 및 재내보내기</purpose>
      </route>
      <route path="/reports/:id/export" screenName="내보내기 모달 상태" primaryAction="PPTX 다운로드" note="단독 페이지 아님, 모달 라우트 가능">
        <purpose>PPTX 생성 진행률, 다운로드</purpose>
      </route>
      <route path="/unsupported" screenName="모바일/협소 화면 안내" primaryAction="데스크톱에서 열기" note="768px 미만 강제 노출">
        <purpose>편집 비지원 안내</purpose>
      </route>
    </routes>
  </section>

  <section id="3" key="userFlows" label="핵심 사용자 흐름">
    <flow id="3.1" key="newReportCreation" label="신규 리포트 생성">
      <step order="1">사용자는 /reports에서 새 리포트 만들기를 클릭한다.</step>
      <step order="2">시스템은 임시 draft 리포트를 생성하고 /reports/new로 이동한다.</step>
      <step order="3">사용자는 차트 이미지 1장을 업로드한다.</step>
      <step order="4">시스템은 업로드 완료 즉시 OCR/Vision 분석을 시작한다.</step>
      <step order="5">분석 완료 후 추출 결과와 AI 요약 3줄을 에디터에 반영한다.</step>
      <step order="6">사용자는 카테고리, 로고, 출처, 날짜, 제목 문구를 검토 및 수정한다.</step>
      <step order="7">사용자는 우측 프리뷰에서 결과를 확인한 후 PPTX 내보내기를 실행한다.</step>
      <step order="8">시스템은 export job 완료 후 다운로드 링크를 제공한다.</step>
    </flow>
    <flow id="3.2" key="lowConfidenceCorrection" label="저신뢰 분석값 보정">
      <step order="1">OCR 또는 추세 추론 confidence가 기준치 미만이면 상태를 review_required로 둔다.</step>
      <step order="2">해당 필드는 앰버 테두리와 검토 필요 배지를 표시한다.</step>
      <step order="3">사용자가 값을 수정하거나 원본 유지를 선택해야 완료 상태로 넘어간다.</step>
      <step order="4">검토 전에는 PPTX 내보내기 버튼을 비활성화한다.</step>
    </flow>
    <flow id="3.3" key="historyReuse" label="히스토리 재활용">
      <step order="1">사용자는 /reports에서 이전 리포트를 클릭한다.</step>
      <step order="2">시스템은 썸네일, 최종 수정일, 템플릿, export 상태를 보여준다.</step>
      <step order="3">사용자는 재편집 또는 다시 다운로드를 선택한다.</step>
      <step order="4">export 파일이 만료되었으면 시스템은 동일 데이터로 export job을 다시 실행한다.</step>
    </flow>
  </section>

  <section id="4" key="screenSpecifications" label="화면별 상세 명세">
    <screen id="4.1" key="appShell" label="공통 앱 셸">
      <structure>
        <metric name="headerHeight" unit="px">72</metric>
        <metric name="safeHorizontalPadding" unit="px">24</metric>
        <metric name="maxContentWidth" unit="px">1600</metric>
        <color name="background">#F7F8F5</color>
        <stickyHeader top="0" zIndex="20">position: sticky</stickyHeader>
      </structure>
      <headerComposition>
        <region key="brand" width="240px" alignment="fixed">
          <content>로고 + 제품명</content>
          <rule>로고 높이 28px, 텍스트 18/700</rule>
        </region>
        <region key="locationIndicator" width="fluid" alignment="flex">
          <content>현재 화면 타이틀, 저장 상태</content>
          <rule>타이틀 18/700, 상태 라벨 12/600</rule>
        </region>
        <region key="actions" width="auto" alignment="right">
          <content>새 리포트, 프로필 메뉴</content>
          <rule>버튼 간격 12px</rule>
        </region>
      </headerComposition>
      <saveStates>
        <state key="Saved">녹색 점 + 저장됨</state>
        <state key="Dirty">회색 점 + 변경사항 있음</state>
        <state key="Autosaving">스피너 + 저장 중</state>
        <state key="Error">빨간 점 + 저장 실패</state>
      </saveStates>
    </screen>

    <screen id="4.2" key="reportDashboard" label="리포트 대시보드" path="/reports">
      <layout>
        <metric name="titleAreaHeight" unit="px">96</metric>
        <row order="1">필터/검색/정렬 바</row>
        <row order="2">리포트 카드 그리드 또는 테이블</row>
      </layout>
      <titleArea>
        <element key="pageTitle">32/700, #111111</element>
        <element key="description">15/400, #525252, 최대 폭 560px</element>
        <element key="primaryCTA">새 리포트 만들기, 높이 48px, 우측 정렬</element>
      </titleArea>
      <filterBar height="64px">
        <item key="composition">검색창, 상태 필터, 카테고리 필터, 정렬 셀렉트</item>
        <item key="searchWidth">320px</item>
        <item key="searchPlaceholder">제목, 카테고리, 출처로 검색</item>
      </filterBar>
      <cardListSpec>
        <columns breakpoint="1440+">4</columns>
        <columns breakpoint="1280-1439">3</columns>
        <columns breakpoint="1024-1279">2</columns>
        <metric name="minCardHeight" unit="px">312</metric>
        <metric name="cardPadding" unit="px">20</metric>
        <metric name="cardRadius" unit="px">20</metric>
        <color name="cardBackground">#FFFFFF</color>
        <thumbnail ratio="16:9" height="168px"/>
      </cardListSpec>
      <cardFields>
        <field>썸네일</field>
        <field>카테고리 배지</field>
        <field>리포트 제목</field>
        <field>요약 1줄 미리보기</field>
        <field>최종 수정일</field>
        <field>export 상태 배지</field>
        <field>액션: 재편집, 다운로드, 더보기</field>
      </cardFields>
      <emptyState>
        <iconArea unit="px">80</iconArea>
        <title>아직 생성한 리포트가 없습니다</title>
        <message>차트 이미지를 업로드하면 1분 내에 PPT 리포트를 생성합니다</message>
        <cta>첫 리포트 만들기</cta>
      </emptyState>
    </screen>

    <screen id="4.3" key="reportEditor" label="신규/기존 리포트 에디터">
      <routes>
        <path>/reports/new</path>
        <path>/reports/:id/edit</path>
      </routes>
      <desktopLayout>
        <condition>뷰포트 기준 1280px 이상에서 편집 가능</condition>
        <structure>3패널 구조</structure>
        <panel key="leftInput" width="296px"/>
        <panel key="centerPreview" width="minmax(624px, 1fr)"/>
        <panel key="rightProperties" width="296px"/>
        <gap breakpoint="1280">16px</gap>
        <gap breakpoint="1440+">24px</gap>
        <height>calc(100vh - 72px)</height>
        <scrollRule>각 패널 내부 스크롤 허용, 페이지 전체 스크롤 금지</scrollRule>
      </desktopLayout>

      <subscreen id="4.3.1" key="leftInputPanel" label="좌측 입력 패널">
        <sectionOrder>
          <item order="1">업로드 카드</item>
          <item order="2">분석 상태 카드</item>
          <item order="3">AI 추출값 검토 카드</item>
          <item order="4">AI 요약 카드</item>
        </sectionOrder>
        <uploadCard>
          <metric name="cardPadding" unit="px">20</metric>
          <metric name="dropzoneHeight" unit="px">220</metric>
          <acceptedFiles>
            <file>.jpg</file>
            <file>.jpeg</file>
            <file>.png</file>
            <file>.webp</file>
          </acceptedFiles>
          <maxFileSize unit="MB">20</maxFileSize>
          <minResolution shortEdge="960px"/>
          <recommendedResolution shortEdge="1600px"/>
          <multiFileUpload>false</multiFileUpload>
          <defaultCopy>차트 이미지 1장을 업로드하세요</defaultCopy>
          <helperCopy>권장 1600px 이상, 20MB 이하</helperCopy>
          <postUploadActions>
            <action>교체</action>
            <action>다시 분석</action>
          </postUploadActions>
        </uploadCard>
        <analysisStatusCard>
          <state key="idle" display="업로드 대기" action="없음"/>
          <state key="uploading" display="업로드 진행률 바" action="취소"/>
          <state key="analyzing" display="단계별 스텝퍼" action="취소"/>
          <state key="review_required" display="경고 아이콘 + 검토 필요 수" action="검토 시작"/>
          <state key="completed" display="성공 아이콘 + 완료 시간" action="다시 분석"/>
          <state key="failed" display="실패 사유 + 재시도" action="재시도"/>
        </analysisStatusCard>
        <extractedFieldReviewCard>
          <fields>
            <field>차트 제목</field>
            <field>주요 시리즈명</field>
            <field>마지막 값</field>
            <field>기준일</field>
            <field>추세 판정</field>
            <field>단위</field>
            <field>출처 문구</field>
          </fields>
          <confidenceBadgeDisplay>true</confidenceBadgeDisplay>
          <confidenceRules>
            <rule min="0.85" max="1.00" color="green" label="높음"/>
            <rule min="0.75" max="0.8499" color="gray" label="보통"/>
            <rule min="0.55" max="0.7499" color="amber" label="검토 필요"/>
            <rule min="0.00" max="0.5499" color="red" label="수정 필수"/>
          </confidenceRules>
          <fieldInputHeight unit="px">44</fieldInputHeight>
          <fieldLabelTypography>12/600</fieldLabelTypography>
          <fieldDescriptionTypography>12/400</fieldDescriptionTypography>
        </extractedFieldReviewCard>
        <aiSummaryCard>
          <summaryCount exact="3"/>
          <lineRule sentenceCount="1" maxChars="42" maxWrapLines="2"/>
          <actions>
            <action>다시 생성</action>
            <action>전체 복사</action>
            <action>슬라이드에 반영</action>
          </actions>
          <editable>true</editable>
          <overflowCounter color="red">수정 중 길이 초과 시 카운터를 빨간색으로 표시</overflowCounter>
        </aiSummaryCard>
      </subscreen>

      <subscreen id="4.3.2" key="centerPreviewPanel" label="중앙 프리뷰 패널">
        <toolbar height="56px">
          <left>템플릿 이름, 배율 정보</left>
          <right>
            <control>100%</control>
            <control>맞춤</control>
            <control>가이드 표시</control>
            <control>원본 비교</control>
          </right>
        </toolbar>
        <previewCanvas ratio="16:9">
          <designResolution width="1600" height="900"/>
          <background>#D9DDD7</background>
          <outerVerticalPadding unit="px">24</outerVerticalPadding>
          <renderingRule>SVG 또는 HTML-to-canvas 어느 쪽이든 결과 픽셀 오차 2px 이하 유지</renderingRule>
        </previewCanvas>
        <outputTemplate id="finance-premium-01">
          <zone key="headerBand" x="0" y="0" width="1600" height="84" background="#1A3C34">브랜드, 시리즈명, 날짜</zone>
          <zone key="chartZone" x="64" y="108" width="1472" height="372" background="#FFFFFF">원본 차트, 자동 fit-contain</zone>
          <zone key="categoryTag" x="64" y="512" width="auto" height="48" background="#C00000">예: 미국증시</zone>
          <zone key="headlineZone" x="64" y="580" width="1120" height="144" background="transparent">1~2줄 메인 헤드라인</zone>
          <zone key="summaryPanel" x="0" y="748" width="1600" height="116" background="#111111">핵심 요약 3줄</zone>
          <zone key="footerBand" x="0" y="864" width="1600" height="36" background="#1A3C34">출처, 제작 정보</zone>
        </outputTemplate>
        <canvasContentRules>
          <rule order="1">차트 이미지는 contain으로 배치한다.</rule>
          <rule order="2">차트 영역 내부 상하 여백은 최소 12px를 유지한다.</rule>
          <rule order="3">원본 비율 때문에 좌우 빈 공간이 생기면 배경색 #FFFFFF로 유지한다.</rule>
          <rule order="4">차트 자체에 텍스트가 많은 경우, 확대 렌더링 우선 순위는 차트 영역 &gt; 제목 영역 &gt; 요약 영역이다.</rule>
          <rule order="5">헤드라인은 최대 2줄, 2줄 초과 시 폰트 크기를 자동 축소한다.</rule>
          <rule order="6">자동 축소 순서: 88px -&gt; 80px -&gt; 72px -&gt; 64px</rule>
          <rule order="7">64px에서도 2줄 초과면 말줄임 대신 사용자 수정을 강제한다.</rule>
        </canvasContentRules>
        <originalCompareMode>
          <enabledBehavior>원본 비교 활성화 시 캔버스 하단에 원본 썸네일 strip 노출</enabledBehavior>
          <stripHeight unit="px">120</stripHeight>
          <canvasSizeRule>비교 모드에서도 메인 캔버스 크기는 유지</canvasSizeRule>
        </originalCompareMode>
      </subscreen>

      <subscreen id="4.3.3" key="rightPropertyPanel" label="우측 속성 패널">
        <sectionOrder>
          <item order="1">템플릿 선택</item>
          <item order="2">헤더 설정</item>
          <item order="3">메인 헤드라인 설정</item>
          <item order="4">요약 박스 설정</item>
          <item order="5">푸터 설정</item>
          <item order="6">내보내기 액션</item>
        </sectionOrder>
        <templateSelection>
          <visibleTemplateCount exact="1"/>
          <rule>향후 확장 구조만 유지하고 disabled template는 UI에 노출하지 않는다.</rule>
          <templateCardHeight unit="px">88</templateCardHeight>
        </templateSelection>
        <headerSettings>
          <field key="logo" inputType="imageUpload" limit="PNG/SVG, 2MB 이하"/>
          <field key="brandName" inputType="singleLine" limit="16자 이하"/>
          <field key="category" inputType="singleLine" limit="12자 이하"/>
          <field key="date" inputType="datePicker" default="오늘"/>
        </headerSettings>
        <headlineSettings>
          <defaultValue>AI가 생성한 핵심 헤드라인 1개</defaultValue>
          <inputHeight unit="px">96</inputHeight>
          <characterLimit>28</characterLimit>
          <saveConstraint>28자 초과 시 저장 불가</saveConstraint>
          <disallowedPatterns>
            <pattern>연속 공백 2개 이상</pattern>
            <pattern>줄바꿈 3개 이상</pattern>
          </disallowedPatterns>
        </headlineSettings>
        <summaryBoxSettings>
          <backgroundEditable>false</backgroundEditable>
          <indexStyle>01, 02, 03</indexStyle>
          <bulletGap unit="px">12</bulletGap>
          <allowDeleteBullet>false</allowDeleteBullet>
          <allowFullRegeneration>true</allowFullRegeneration>
        </summaryBoxSettings>
        <footerSettings>
          <field key="source" limit="40자" default="OCR 추출 출처 또는 빈값"/>
          <field key="credit" limit="24자" default="Generated by C2I"/>
          <field key="alignment" default="좌측 출처, 우측 날짜"/>
        </footerSettings>
        <bottomActionBar sticky="true" height="88px">
          <button hierarchy="secondary">임시 저장</button>
          <button hierarchy="primary" disabledWhen="review_required or failed">PPTX 내보내기</button>
        </bottomActionBar>
      </subscreen>
    </screen>

    <screen id="4.4" key="exportModal" label="내보내기 모달">
      <structure>
        <metric name="width" unit="px">560</metric>
        <metric name="maxHeight">80vh</metric>
        <metric name="radius" unit="px">24</metric>
        <metric name="padding" unit="px">24</metric>
        <backdrop>rgba(0,0,0,0.48)</backdrop>
      </structure>
      <steps>
        <step order="1">파일 구성 중</step>
        <step order="2">슬라이드 렌더링 중</step>
        <step order="3">PPTX 패키징 중</step>
        <step order="4">다운로드 준비 완료</step>
      </steps>
      <rules>
        <rule order="1">내보내기 시작 후 사용자는 모달을 닫을 수 있으나 작업은 백그라운드에서 계속된다.</rule>
        <rule order="2">동일 report에 대해 동시 export job은 1개만 허용한다.</rule>
        <rule order="3">평균 완료 목표: 15초 이내</rule>
        <rule order="4">30초 초과 시 예상보다 오래 걸리고 있습니다 안내 문구 노출</rule>
      </rules>
    </screen>

    <screen id="4.5" key="unsupportedScreen" label="모바일/협소 화면 안내" path="/unsupported">
      <triggerCriteria>viewport width &lt; 768px</triggerCriteria>
      <title>이 편집기는 데스크톱에서만 지원됩니다</title>
      <message>보고서 편집과 PPT 생성은 1280px 이상 화면에서 최적화되어 있습니다</message>
      <cta order="1">대시보드만 보기</cta>
      <cta order="2">링크 복사</cta>
      <hiddenFunctions>업로드 및 편집 기능은 비노출</hiddenFunctions>
    </screen>
  </section>

  <section id="5" key="outputSpecifications" label="출력물 규격">
    <pptxBaseSpec>
      <slideRatio>16:9</slideRatio>
      <powerPointStandardSize>13.333in x 7.5in</powerPointStandardSize>
      <designPixels width="1600" height="900"/>
      <defaultSlideCount>1</defaultSlideCount>
      <defaultTextInsertion>편집 가능한 텍스트 박스</defaultTextInsertion>
      <chartInsertion>원본 비트맵 삽입</chartInsertion>
      <fileNameRule>C2I_{category}_{YYYYMMDD}_{slug}.pptx</fileNameRule>
    </pptxBaseSpec>
    <pptObjectRules>
      <rule>헤드라인, 요약, 출처, 날짜는 모두 텍스트 박스로 삽입한다.</rule>
      <rule>차트 이미지는 압축률 품질 우선, 단일 이미지 기준 300 DPI 상당 품질 유지</rule>
      <rule>로고는 가능한 경우 SVG 우선, 아니면 PNG 투명 배경 사용</rule>
      <rule>폰트 미설치 환경을 고려해 PPT에는 Pretendard, Arial, Malgun Gothic 순서로 fallback 지정</rule>
    </pptObjectRules>
    <textOverflowRules>
      <rule target="headline">헤드라인 영역 overflow 발생 시 자동 축소 후에도 넘치면 export 차단</rule>
      <rule target="summaryBullet">요약 bullet overflow 발생 시 줄 수를 2줄로 제한하고 2줄 초과 문장은 사용자 수정 필요</rule>
      <rule target="source">출처 overflow 발생 시 말줄임 허용</rule>
    </textOverflowRules>
  </section>

  <section id="6" key="designTokens" label="디자인 토큰">
    <colorPalette>
      <token name="color.bg.base" value="#F7F8F5" usage="앱 전체 배경"/>
      <token name="color.bg.surface" value="#FFFFFF" usage="카드, 모달, 패널"/>
      <token name="color.bg.inverse" value="#111111" usage="요약 패널, 반전 구역"/>
      <token name="color.brand.primary" value="#1A3C34" usage="헤더/푸터/브랜드 강조"/>
      <token name="color.brand.primary-hover" value="#143129" usage="hover 상태"/>
      <token name="color.brand.secondary" value="#2A5B50" usage="보조 브랜드"/>
      <token name="color.accent.critical" value="#C00000" usage="카테고리 태그, 오류 강조"/>
      <token name="color.accent.warning" value="#D97706" usage="검토 필요 상태"/>
      <token name="color.accent.success" value="#15803D" usage="완료 상태"/>
      <token name="color.text.primary" value="#111111" usage="본문 기본"/>
      <token name="color.text.secondary" value="#525252" usage="보조 설명"/>
      <token name="color.text.muted" value="#737373" usage="placeholder"/>
      <token name="color.text.inverse" value="#FFFFFF" usage="반전 텍스트"/>
      <token name="color.border.default" value="#E5E7EB" usage="기본 테두리"/>
      <token name="color.border.strong" value="#D1D5DB" usage="강조 테두리"/>
      <token name="color.focus.ring" value="#0F766E" usage="포커스 링"/>
    </colorPalette>
    <colorUsageRules>
      <rule>본문 텍스트와 배경의 명도 대비는 4.5:1 이상이어야 한다.</rule>
      <rule>빨간색은 카테고리/오류/강조 태그 외 용도로 사용하지 않는다.</rule>
      <rule>요약 패널의 텍스트는 반드시 #FFFFFF를 사용한다.</rule>
      <rule>하나의 화면에서 강조 색상은 최대 2개까지만 동시 사용한다.</rule>
    </colorUsageRules>
    <typography>
      <decision>기획안의 본문용 고정폭 폰트 요구는 장문 한국어 가독성을 떨어뜨린다. 따라서 고정폭 폰트는 수치, 날짜, 메타데이터 전용으로 제한한다.</decision>
      <token name="type.display.hero" font="Pretendard" sizeLineHeight="88/1.02" weight="800" usage="메인 헤드라인"/>
      <token name="type.display.section" font="Pretendard" sizeLineHeight="32/1.2" weight="700" usage="페이지 제목"/>
      <token name="type.title.card" font="Pretendard" sizeLineHeight="20/1.3" weight="700" usage="카드 제목"/>
      <token name="type.body.default" font="Pretendard" sizeLineHeight="15/1.6" weight="400" usage="일반 본문"/>
      <token name="type.body.strong" font="Pretendard" sizeLineHeight="15/1.6" weight="600" usage="강조 본문"/>
      <token name="type.label" font="Pretendard" sizeLineHeight="12/1.4" weight="600" usage="라벨, 배지"/>
      <token name="type.mono.data" font="JetBrains Mono" sizeLineHeight="13/1.5" weight="600" usage="수치, 날짜, confidence"/>
      <token name="type.slide.summary" font="Pretendard" sizeLineHeight="22/1.45" weight="600" usage="슬라이드 요약"/>
    </typography>
    <typographyRules>
      <rule>문단 길이는 한 줄 36자 내외를 초과하지 않도록 한다.</rule>
      <rule>대시보드 본문 최소 폰트 크기는 14px, 에디터 폼/테이블 최소는 13px이다.</rule>
      <rule>3줄 이상 문단에 monospace 사용 금지</rule>
      <rule>영문 ticker, 지수명, 날짜, 수치만 monospace 사용 허용</rule>
    </typographyRules>
    <spacingRadiusShadow>
      <spacingScale>
        <value>4</value>
        <value>8</value>
        <value>12</value>
        <value>16</value>
        <value>20</value>
        <value>24</value>
        <value>32</value>
        <value>40</value>
        <value>48</value>
        <value>64</value>
      </spacingScale>
      <spacingRule>컴포넌트 내부 paddings는 8의 배수를 우선 사용</spacingRule>
      <radiusTokens>
        <token name="radius.sm" value="10px" usage="입력창"/>
        <token name="radius.md" value="16px" usage="카드"/>
        <token name="radius.lg" value="20px" usage="모달, 대형 카드"/>
        <token name="radius.pill" value="999px" usage="배지, 태그"/>
      </radiusTokens>
      <shadowTokens>
        <token name="card.default">0 8px 24px rgba(17,17,17,0.06)</token>
        <token name="card.hover">0 16px 32px rgba(17,17,17,0.10)</token>
        <token name="modal">0 24px 64px rgba(0,0,0,0.18)</token>
      </shadowTokens>
    </spacingRadiusShadow>
    <iconAndMotion>
      <iconSet>Lucide 또는 동일 stroke 계열 SVG 한 종류만 사용</iconSet>
      <defaultIconSize unit="px">18</defaultIconSize>
      <primaryActionIconSize unit="px">20</primaryActionIconSize>
      <microInteractionDuration unit="ms">150</microInteractionDuration>
      <panelOpenCloseDuration unit="ms">200</panelOpenCloseDuration>
      <modalEnterDuration unit="ms">240</modalEnterDuration>
      <motionImplementation>transform, opacity만 사용</motionImplementation>
      <reducedMotionRule>prefers-reduced-motion: reduce에서는 애니메이션 제거</reducedMotionRule>
    </iconAndMotion>
  </section>

  <section id="7" key="layoutRules" label="레이아웃 규칙">
    <grid>
      <columnCount>12</columnCount>
      <maxContentWidth unit="px">1600</maxContentWidth>
      <gutter unit="px">24</gutter>
      <defaultSectionVerticalGap unit="px">24</defaultSectionVerticalGap>
      <defaultCardInnerGap unit="px">12</defaultCardInnerGap>
    </grid>
    <zIndexScale>
      <layer name="기본 콘텐츠" value="1"/>
      <layer name="sticky header" value="20"/>
      <layer name="panel footer" value="30"/>
      <layer name="dropdown/popover" value="40"/>
      <layer name="modal backdrop" value="50"/>
      <layer name="modal dialog" value="60"/>
      <layer name="toast" value="70"/>
    </zIndexScale>
    <scrollRules>
      <rule>대시보드는 페이지 스크롤 1개만 허용한다.</rule>
      <rule>에디터는 전체 페이지 스크롤을 막고, 패널 단위 내부 스크롤만 허용한다.</rule>
      <rule>sticky 영역과 스크롤 컨텐츠가 겹칠 경우 상단 패딩을 12px 추가한다.</rule>
    </scrollRules>
  </section>

  <section id="8" key="componentSpecifications" label="공통 컴포넌트 규격">
    <buttons>
      <buttonType name="Primary" height="48px" padding="0 18px" typography="15/600" background="#1A3C34" rule="hover #143129"/>
      <buttonType name="Secondary" height="48px" padding="0 18px" typography="15/600" background="#FFFFFF" rule="border #D1D5DB"/>
      <buttonType name="Tertiary" height="40px" padding="0 14px" typography="14/600" background="transparent" rule="hover bg #F3F4F6"/>
      <buttonType name="Danger" height="48px" padding="0 18px" typography="15/600" background="#C00000" rule="삭제/초기화 전용"/>
      <commonRules>
        <rule>최소 클릭 영역: 44x44px</rule>
        <rule>로딩 시 버튼 내부 스피너 표시, 중복 클릭 방지</rule>
        <rule>비활성 상태 불투명도: 0.48</rule>
        <rule>아이콘 단독 버튼은 반드시 aria-label 필요</rule>
      </commonRules>
    </buttons>
    <inputField>
      <height unit="px">44</height>
      <radius unit="px">10</radius>
      <horizontalPadding unit="px">12</horizontalPadding>
      <background>#FFFFFF</background>
      <border>1px solid #D1D5DB</border>
      <focus>2px ring #0F766E, 외곽 offset 2px</focus>
      <error>테두리 #C00000, 하단 에러 문구 12/400</error>
    </inputField>
    <textarea>
      <defaultHeight unit="px">96</defaultHeight>
      <resize>vertical only</resize>
      <maxHeight unit="px">180</maxHeight>
      <characterCounterPosition>우측 하단</characterCounterPosition>
    </textarea>
    <selectAndDropdown>
      <height unit="px">44</height>
      <maxOptionListHeight unit="px">280</maxOptionListHeight>
      <scrollbarVisible>true</scrollbarVisible>
      <selectedOptionIndicator>선택 항목 좌측 체크 아이콘 사용</selectedOptionIndicator>
    </selectAndDropdown>
    <card>
      <padding unit="px">20</padding>
      <radius unit="px">20</radius>
      <background>#FFFFFF</background>
      <hoverRule>hover는 리스트성 카드에서만 허용</hoverRule>
      <shadowRule>정보 카드에는 hover shadow 적용 금지</shadowRule>
    </card>
    <modal>
      <closeButtonHitArea unit="px">44</closeButtonHitArea>
      <titleTypography>24/700</titleTypography>
      <sectionGap unit="px">20</sectionGap>
      <destructiveRule>destructive modal은 확인 문구 입력 없이 2단계 클릭만 허용</destructiveRule>
    </modal>
    <toast>
      <stackingPosition>우측 상단</stackingPosition>
      <width unit="px">360</width>
      <successDuration unit="sec">3</successDuration>
      <errorDuration unit="sec">6</errorDuration>
      <maxVisibleCount>3</maxVisibleCount>
    </toast>
    <progressBar>
      <height unit="px">8</height>
      <radius unit="px">999</radius>
      <background>#E5E7EB</background>
      <progressColor>#1A3C34</progressColor>
    </progressBar>
    <badgeAndStatusChip>
      <type name="카테고리 배지" height="32px" typography="13/700" rule="빨간 배경, 흰색 텍스트"/>
      <type name="상태칩" height="28px" typography="12/600" rule="성공/경고/오류 색상 매핑"/>
      <type name="confidence badge" height="24px" typography="12/600 mono" rule="숫자와 등급 동시 표시"/>
    </badgeAndStatusChip>
    <dropzone>
      <height unit="px">220</height>
      <border>2px dashed #CBD5E1</border>
      <dragOverBackground>rgba(26,60,52,0.06)</dragOverBackground>
      <failureBehavior>업로드 실패 시 카드 하단에 오류 패널 노출</failureBehavior>
    </dropzone>
  </section>

  <section id="9" key="stateDefinitions" label="상태값 정의">
    <domainEntities>
      <reportTypeDefinitions>
        <reportStatusValues>
          <value>draft</value>
          <value>analyzing</value>
          <value>review_required</value>
          <value>ready</value>
          <value>exporting</value>
          <value>completed</value>
          <value>failed</value>
        </reportStatusValues>
        <exportStatusValues>
          <value>idle</value>
          <value>queued</value>
          <value>processing</value>
          <value>ready</value>
          <value>expired</value>
          <value>failed</value>
        </exportStatusValues>
      </reportTypeDefinitions>
      <recommendedDataStructure>
        <entity name="Report">
          <field name="id" type="string"/>
          <field name="status" type="ReportStatus"/>
          <field name="exportStatus" type="ExportStatus"/>
          <field name="templateId" type="literal">finance-premium-01</field>
          <field name="category" type="string"/>
          <field name="headline" type="string"/>
          <field name="summaryLines" type="tuple[string,string,string]"/>
          <field name="source" type="string"/>
          <field name="slideDate" type="string"/>
          <field name="chartImageUrl" type="string"/>
          <field name="logoUrl" type="string" optional="true"/>
          <field name="analysis" type="AnalysisResult | null"/>
          <field name="createdAt" type="string"/>
          <field name="updatedAt" type="string"/>
        </entity>
        <entity name="AnalysisResult">
          <field name="chartTitle" type="string"/>
          <field name="series" type="Array&lt;{ label: string; value: string; unit?: string; confidence: number }&gt;"/>
          <field name="trendDirection" type="up | down | flat | mixed"/>
          <field name="observations" type="tuple[string,string,string]"/>
          <field name="sourceText" type="string" optional="true"/>
          <field name="overallConfidence" type="number"/>
        </entity>
      </recommendedDataStructure>
    </domainEntities>
    <uiStates>
      <state key="uploadState" values="idle/uploading/success/error">파일 업로드 상태</state>
      <state key="analysisState" values="idle/running/review_required/completed/failed">AI 분석 상태</state>
      <state key="editorState" values="clean/dirty/autosaving/save_failed">편집 저장 상태</state>
      <state key="previewState" values="rendering/ready/error">프리뷰 렌더 상태</state>
      <state key="exportState" values="idle/queued/processing/ready/failed">export job 상태</state>
    </uiStates>
    <stateTransitions>
      <transition from="draft" to="analyzing">업로드 성공 직후 자동 전이</transition>
      <transition from="analyzing" to="review_required">confidence 0.75 미만 필드 1개 이상 존재</transition>
      <transition from="analyzing" to="ready">모든 필드 confidence 0.75 이상</transition>
      <transition from="review_required" to="ready">필수 검토 필드 모두 확인 완료</transition>
      <transition from="ready" to="exporting">사용자가 export 실행</transition>
      <transition from="exporting" to="completed">export job 성공</transition>
      <transition from="any" to="failed">API, OCR, LLM, render 중 복구 불가 오류 발생</transition>
    </stateTransitions>
  </section>

  <section id="10" key="responsiveRules" label="반응형 기준">
    <breakpoints>
      <breakpoint range="&gt;=1440px" name="와이드 데스크톱">3패널 전체 노출</breakpoint>
      <breakpoint range="1280px-1439px" name="표준 데스크톱">3패널 유지, 패널 폭 축소</breakpoint>
      <breakpoint range="1024px-1279px" name="협소 데스크톱/태블릿 가로">우측 속성 패널 drawer 전환</breakpoint>
      <breakpoint range="768px-1023px" name="태블릿">대시보드 열람만 허용, 편집 비권장 배너 표시</breakpoint>
      <breakpoint range="&lt;768px" name="모바일">/unsupported 강제 이동</breakpoint>
    </breakpoints>
    <detailRules>
      <rule>1024px 이상에서는 주요 CTA를 fold 아래로 보내지 않는다.</rule>
      <rule>1024px 미만에서는 프리뷰 확대/축소 UI 제거</rule>
      <rule>태블릿에서는 PPTX 내보내기를 허용하되 업로드/편집은 숨길 수 있다.</rule>
      <rule>모바일에서는 파일 업로드 input 자체를 렌더링하지 않는다.</rule>
    </detailRules>
  </section>

  <section id="11" key="accessibilityPrinciples" label="접근성 원칙">
    <principles>
      <item>텍스트 대비 비율 4.5:1 이상, 큰 텍스트 3:1 이상</item>
      <item>모든 interactive 요소는 키보드 Tab 순서가 시각 순서와 같아야 한다.</item>
      <item>포커스 스타일은 색상만이 아니라 outline/ring으로도 보여야 한다.</item>
      <item>업로드 드롭존은 키보드 Enter/Space로도 실행 가능해야 한다.</item>
      <item>아이콘 단독 버튼은 모두 aria-label을 가진다.</item>
      <item>진행률 변화와 export 완료는 aria-live="polite" 영역으로 안내한다.</item>
      <item>표 기반 히스토리 보기 모드가 있을 경우 썸네일 외 정보를 텍스트로 제공한다.</item>
      <item>색상만으로 상태를 구분하지 않는다. 아이콘 또는 레이블을 함께 제공한다.</item>
    </principles>
  </section>

  <section id="12" key="exceptionHandling" label="예외 처리 기준">
    <exceptions>
      <exception key="unsupportedFileType">
        <detection>MIME 불일치</detection>
        <userMessage>JPG, PNG, WebP만 업로드할 수 있습니다</userMessage>
        <systemAction>업로드 차단</systemAction>
      </exception>
      <exception key="fileSizeExceeded">
        <detection>20MB 초과</detection>
        <userMessage>20MB 이하 파일만 지원합니다</userMessage>
        <systemAction>업로드 차단</systemAction>
      </exception>
      <exception key="insufficientResolution">
        <detection>짧은 변 &lt; 960px</detection>
        <userMessage>텍스트 인식을 위해 더 큰 이미지를 사용하세요</userMessage>
        <systemAction>업로드 차단</systemAction>
      </exception>
      <exception key="multipleChartsDetected">
        <detection>차트 영역 2개 이상</detection>
        <userMessage>차트가 여러 개 감지되었습니다. 하나만 포함된 이미지를 사용하세요</userMessage>
        <systemAction>분석 중단</systemAction>
      </exception>
      <exception key="lowOcrConfidence">
        <detection>confidence &lt; 0.75</detection>
        <userMessage>일부 값의 검토가 필요합니다</userMessage>
        <systemAction>review_required 전환</systemAction>
      </exception>
      <exception key="summaryGenerationFailed">
        <detection>LLM timeout 또는 응답 스키마 오류</detection>
        <userMessage>요약 생성에 실패했습니다. 다시 생성하세요</userMessage>
        <systemAction>기존 추출값 유지</systemAction>
      </exception>
      <exception key="previewRenderFailed">
        <detection>렌더러 예외</detection>
        <userMessage>미리보기를 표시할 수 없습니다</userMessage>
        <systemAction>원본/텍스트 편집은 유지</systemAction>
      </exception>
      <exception key="exportFailed">
        <detection>렌더 또는 패키징 실패</detection>
        <userMessage>PPT 생성에 실패했습니다. 다시 시도하세요</userMessage>
        <systemAction>실패 로그 저장</systemAction>
      </exception>
      <exception key="sessionExpired">
        <detection>401/419</detection>
        <userMessage>세션이 만료되었습니다. 다시 로그인하세요</userMessage>
        <systemAction>draft 자동 보존 후 로그인 유도</systemAction>
      </exception>
      <exception key="saveFailed">
        <detection>네트워크 오류 &gt; 10초</detection>
        <userMessage>저장되지 않았습니다. 연결 상태를 확인하세요</userMessage>
        <systemAction>로컬 draft 캐시 유지</systemAction>
      </exception>
    </exceptions>
  </section>

  <section id="13" key="contentRules" label="콘텐츠 규칙">
    <categoryExamples>
      <item>미국증시</item>
      <item>선물시장</item>
      <item>원자재</item>
      <item>환율</item>
      <item>테크</item>
      <item>매크로</item>
    </categoryExamples>
    <headlineRule>헤드라인은 의문문보다 단정문 우선</headlineRule>
    <summaryRules>
      <rule>요약 3줄은 서로 다른 정보여야 한다. 동일 의미 반복 금지</rule>
      <forbiddenStartPattern>이 차트는</forbiddenStartPattern>
      <forbiddenStartPattern>보시다시피</forbiddenStartPattern>
      <forbiddenStartPattern>전반적으로</forbiddenStartPattern>
    </summaryRules>
    <sourceRule>출처 문구는 원문 출처가 없으면 빈값 허용</sourceRule>
    <dateFormat>YY.M.DD</dateFormat>
    <numberFormatting>
      <rule>천 단위 구분 쉼표 사용</rule>
      <rule>백분율은 소수점 첫째 자리까지</rule>
      <rule>금액/지수/배수는 단위 생략 금지</rule>
    </numberFormatting>
  </section>

  <section id="14" key="implementationQuality" label="구현 품질 기준">
    <standards>
      <item key="firstPreviewRenderTarget">첫 프리뷰 렌더 목표: 업로드 후 8초 이내</item>
      <item key="autosaveDebounce">autosave debounce: 800ms</item>
      <item key="analysisReplayRule">동일 report의 분석 재실행은 마지막 요청 1건만 유효</item>
      <item key="previewExportLineBreakDiff">프리뷰와 export 결과의 텍스트 줄바꿈 차이는 최대 1줄 이내</item>
      <item key="frontendDataAuthority">프론트엔드에서 optimistic UI를 쓰더라도 server source of truth를 유지한다.</item>
    </standards>
  </section>

  <section id="15" key="documentPrecedence" label="문서 적용 우선순위">
    <rules>
      <rule>본 문서는 UI/UX 및 출력물 구현의 기준 문서다.</rule>
      <rule>개발 중 해석 충돌이 발생하면 본 문서의 수치 규칙을 우선한다.</rule>
      <rule>본 문서에 없는 항목은 새로 추가하지 말고 먼저 기준값을 문서에 보완한 뒤 구현한다.</rule>
    </rules>
  </section>
</c2iSpecification>
```
