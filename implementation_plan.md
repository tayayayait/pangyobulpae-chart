# C2I Automator — XML 명세서 기반 갭 분석 및 구현 계획

**Active Skill:** concise-planning, senior-architect

XML 명세서(`xml예시.md`)와 현재 코드베이스를 비교 분석하여, 아직 구현되지 않았거나 명세와 차이가 있는 부분을 파악하고 우선순위를 정리합니다.

---

## 갭 분석 요약

### ✅ 이미 구현된 항목

| 명세 섹션 | 현재 상태 |
|-----------|-----------|
| 라우트 구조 (§2) | `/reports`, `/reports/new`, `/reports/:id/edit`, `/unsupported` 모두 구현됨 |
| 앱 셸 헤더 (§4.1) | 72px sticky 헤더, 로고, 저장 상태 표시 구현 |
| 리포트 대시보드 (§4.2) | 검색/필터/정렬, 카드 그리드, 빈 상태 모두 구현 |
| 3패널 에디터 레이아웃 (§4.3) | 좌/중앙/우 296/flex/296 3패널 구현 |
| 차트 업로드 Dropzone | JPG/PNG/WEBP, 20MB, 최소변 960px 검증 구현 |
| AI 분석 상태 카드 | 6개 상태(draft~failed) 표시 구현 |
| AI 추출값 검토 + Confidence 배지 | 4단계 컬러코딩 구현 |
| AI 요약 3줄 + 재생성 | 3줄 편집, 글자 카운터, 재생성 버튼 구현 |
| 프리뷰 캔버스 (§4.3.2) | 16:9 슬라이드, fit/100% 줌, 가이드 표시 구현 |
| 우측 속성 패널 (§4.3.3) | 헤더/카테고리/날짜/헤드라인/출처 설정 구현 |
| 내보내기 모달 (§4.4) | 4단계 스텝퍼, 다운로드 링크 구현 |
| Viewport Gate (§4.5) | 768px 미만 → `/unsupported` 리다이렉트 구현 |
| Autosave 800ms debounce (§14) | `scheduleSave`에서 800ms 적용 |
| 디자인 토큰 (§6) | CSS 변수 + Tailwind config에 컬러/타이포/스페이싱/radius/shadow 구현 |
| 접근성 (§11) | 드롭존 키보드 지원, aria-label, aria-live 일부 구현 |
| Supabase 백엔드 | reports/export_jobs 테이블, RLS, 스토리지, Edge Functions 3개 |

### ❌ 미구현 또는 불완전한 항목

아래 항목들은 XML 명세서에서 요구하지만 현재 코드에 **없거나 부족한** 부분입니다.

---

## Proposed Changes (우선순위 순)

### 🔴 높은 우선순위 (핵심 기능 누락)

---

#### 티켓 1: 로고 업로드 기능 (§4.3.3 headerSettings)

> 명세: `field key="logo" inputType="imageUpload" limit="PNG/SVG, 2MB 이하"`
> 현재: 로고 업로드 UI 및 로직이 없음. `logo_url` 필드는 DB에 존재하나 프론트엔드에서 사용하지 않음.

##### [MODIFY] [Editor.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/pages/Editor.tsx)
- 우측 패널 "헤더 설정" 섹션에 로고 업로드 영역 추가
- `logos` 스토리지 버킷에 업로드 후 `logo_url` 업데이트
- PNG/SVG만 허용, 2MB 제한 검증 추가

---

#### 티켓 2: 카테고리를 한국어 값으로 변경 (§13 contentRules)

> 명세: 카테고리 예시가 `미국증시`, `선물시장`, `원자재`, `환율`, `테크`, `매크로`
> 현재: `Markets`, `Macro`, `Equities` 등 영문 값 사용 중

##### [MODIFY] [constants.ts](file:///c:/Users/dbcdk/Desktop/chart/src/lib/constants.ts)
- `CATEGORIES` 배열을 한국어로 변경: `미국증시`, `선물시장`, `원자재`, `환율`, `테크`, `매크로`, `기타`
- `BRAND_MAX`는 현재 24자 → 명세 16자로 수정

---

#### 티켓 3: 저신뢰 분석값 보정 플로우 (§3.2)

> 명세: confidence < 0.75인 필드는 앰버 테두리 표시, 사용자가 확인 전까지 내보내기 비활성
> 현재: `review_required` 상태에서 내보내기 비활성은 되나, 개별 필드 검토/확인 메커니즘이 없음

##### [MODIFY] [Editor.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/pages/Editor.tsx)
- AI 추출값 검토 카드에서 confidence < 0.75 필드에 앰버 테두리 추가
- 각 저신뢰 필드에 "원본 유지" / "수정" 버튼 추가
- 모든 저신뢰 필드 확인 완료 시 `review_required` → `ready` 상태 전환 로직

---

#### 티켓 4: 대시보드 카드 레이아웃을 명세에 맞게 보강 (§4.2)

> 명세: 4열(1440+) / 3열(1280~) / 2열(1024~), 카드 높이 312px, radius 20px, 카테고리 배지, 요약 미리보기
> 현재: 1/2/3열 그리드, 카테고리 배지 없음, 카드에 요약 미리보기가 없고 출처만 표시

##### [MODIFY] [Reports.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/pages/Reports.tsx)
- 그리드를 1024+ 기준으로 2→3→4열 반응형 조정
- 카드에 카테고리 배지(빨간 배경) 추가
- 요약 1줄 미리보기 추가
- export 상태 배지 추가
- 최종수정일 형식을 명세의 `YY.M.DD` 형식으로 변경
- 카드 min-height 312px, radius 20px 적용

---

### 🟡 중간 우선순위 (UX 완성도)

---

#### 티켓 5: 프리뷰 캔버스를 명세 템플릿에 정확히 맞추기 (§4.3.2 outputTemplate)

> 명세: `finance-premium-01` 템플릿의 정확한 zone 좌표/크기
> 현재: 레이아웃이 명세 좌표와 다름 (차트 920×620, 우측 480px 등 독자적 배치)

##### [MODIFY] [PreviewCanvas.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/components/PreviewCanvas.tsx)
- zone 좌표를 명세에 맞게 수정:
  - `headerBand`: x=0, y=0, w=1600, h=84, bg=#1A3C34
  - `chartZone`: x=64, y=108, w=1472, h=372, bg=#FFF
  - `categoryTag`: x=64, y=512, w=auto, h=48, bg=#C00000
  - `headlineZone`: x=64, y=580, w=1120, h=144
  - `summaryPanel`: x=0, y=748, w=1600, h=116, bg=#111
  - `footerBand`: x=0, y=864, w=1600, h=36, bg=#1A3C34
- 헤드라인 자동 축소 순서 적용: 88→80→72→64px

---

#### 티켓 6: 원본 비교 모드 구현 (§4.3.2 originalCompareMode)

> 명세: "원본 비교" 활성화 시 캔버스 하단에 원본 썸네일 strip(120px) 노출
> 현재: 원본 비교 버튼은 있으나 기능이 없음

##### [MODIFY] [PreviewCanvas.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/components/PreviewCanvas.tsx)
##### [MODIFY] [Editor.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/pages/Editor.tsx)
- `showOriginal` 상태 추가
- 캔버스 하단에 원본 차트 이미지 strip(120px) 렌더링

---

#### 티켓 7: 내보내기 모달 30초 초과 안내 (§4.4)

> 명세: 30초 초과 시 "예상보다 오래 걸리고 있습니다" 안내 노출
> 현재: 타임아웃 안내 없음

##### [MODIFY] [ExportModal.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/components/ExportModal.tsx)
- 내보내기 시작 후 30초 타이머 추가
- 30초 초과 시 안내 문구 표시

---

#### 티켓 8: 앱 셸 헤더 저장 상태를 명세에 맞게 보강 (§4.1 saveStates)

> 명세: 4가지 상태별 아이콘(녹색점, 회색점, 스피너, 빨간점) + 텍스트
> 현재: 텍스트만 표시, 아이콘/색상 구분이 없음

##### [MODIFY] [AppShell.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/components/AppShell.tsx)
- 각 저장 상태에 맞는 색상 점(dot) 아이콘 추가
- "변경사항 있음"(Dirty) 상태 추가

---

#### 티켓 9: 반응형 대응 보강 (§10)

> 명세: 1024~1279px에서 우측 패널을 drawer로 전환, 768~1023px에서 편집 비권장 배너
> 현재: 3패널이 고정 레이아웃이며 반응형 처리 없음

##### [MODIFY] [Editor.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/pages/Editor.tsx)
- 1024~1279px 브레이크포인트에서 우측 패널을 Drawer(Sheet)로 전환
- 768~1023px에서 편집 비권장 배너 표시
- 에디터 페이지에서 `1280px` 미만 시 편집 기능 제한

---

### 🟢 낮은 우선순위 (품질/마감)

---

#### 티켓 10: ConfidenceBadge 등급 라벨 추가 (§4.3.1)

> 명세: `높음(0.85+)`, `보통(0.75~0.84)`, `검토 필요(0.55~0.74)`, `수정 필수(0~0.54)`
> 현재: 퍼센트만 표시, 등급 라벨 없음

##### [MODIFY] [ConfidenceBadge.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/components/ConfidenceBadge.tsx)
- 각 등급별 한국어 라벨 추가 (높음/보통/검토 필요/수정 필수)

---

#### 티켓 11: 대시보드 카테고리 필터 추가 (§4.2 filterBar)

> 명세: 검색창, 상태 필터, **카테고리 필터**, 정렬
> 현재: 상태 필터만 있고 카테고리 필터가 없음

##### [MODIFY] [Reports.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/pages/Reports.tsx)
- 카테고리 드롭다운 필터 추가
- 필터 로직에 카테고리 조건 추가

---

#### 티켓 12: Unsupported 페이지 CTA 보강 (§4.5)

> 명세: CTA 2개 — "대시보드만 보기", "링크 복사"
> 현재: CTA 없이 텍스트만 표시

##### [MODIFY] [Unsupported.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/pages/Unsupported.tsx)
- "대시보드만 보기" 버튼 추가 (대시보드는 읽기 전용 허용)
- "링크 복사" 버튼 추가

---

#### 티켓 13: PPTX 파일명 규칙 적용 (§5)

> 명세: `C2I_{category}_{YYYYMMDD}_{slug}.pptx`
> 현재: 파일명 규칙이 적용되지 않음 (서버에서 처리)

##### [MODIFY] [export-pptx/index.ts](file:///c:/Users/dbcdk/Desktop/chart/supabase/functions/export-pptx/index.ts)
- 파일명 생성 로직에 명세 규칙 적용

---

#### 티켓 14: ExportStatus 사용 (§9)

> 명세: `export_status` 필드를 별도로 관리 (idle/queued/processing/ready/expired/failed)
> 현재: DB 칼럼은 존재하나 프론트엔드에서 사용하지 않음

##### [MODIFY] [Editor.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/pages/Editor.tsx)
##### [MODIFY] [Reports.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/pages/Reports.tsx)
- `export_status` 칼럼을 프론트엔드에서 읽고 표시
- 대시보드 카드에 export 상태 배지 반영

---

#### 티켓 15: 토스트 스택 정책 (§8 toast)

> 명세: 우측 상단, 360px, 성공 3초/에러 6초, 최대 3개
> 현재: Sonner 기본 설정 사용 중

##### [MODIFY] [App.tsx](file:///c:/Users/dbcdk/Desktop/chart/src/App.tsx)
- Sonner 설정에 `position="top-right"`, `visibleToasts={3}`, 커스텀 duration 적용

---

## User Review Required

> [!IMPORTANT]
> **카테고리 값 변경**: 현재 영문(`Markets`, `Macro` 등)을 한국어(`미국증시`, `매크로` 등)로 변경합니다. 이미 저장된 기존 리포트 데이터와의 호환성 문제가 발생할 수 있습니다. DB 마이그레이션으로 기존 데이터를 업데이트할지, 또는 영문 유지 후 표시만 한국어로 할지 결정이 필요합니다.

> [!WARNING]
> **프리뷰 캔버스 레이아웃 대폭 변경**: 현재 차트(920×620) + 우측(480px) 구조를 명세의 정확한 zone 좌표로 변경합니다. 기존 리포트의 프리뷰가 달라질 수 있습니다.

---

## Verification Plan

### 브라우저 기반 검증
- `npm run dev` 실행 후 브라우저에서 각 화면 확인
- 대시보드 카드 그리드가 반응형으로 2/3/4열 전환되는지 확인
- 에디터 3패널 레이아웃에서 로고 업로드, 저신뢰 필드 보정 흐름 테스트
- 프리뷰 캔버스가 명세 zone 좌표에 맞게 렌더링되는지 확인
- 내보내기 모달에서 30초 초과 안내 표시 확인
- 768px 미만에서 `/unsupported` 리다이렉트 확인

### 사용자 수동 검증
- 실제 차트 이미지를 업로드하여 분석→검토→내보내기 전체 플로우 테스트
- PPTX 다운로드 후 파일명 규칙 확인
- 모바일 뷰포트에서 Unsupported 페이지 CTA 작동 확인
