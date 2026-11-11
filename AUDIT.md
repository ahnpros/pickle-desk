# Pickle Desk 개인정보 심층 감사 보고서

- 대상: `github.com/techinpark/pickle-desk` (main 브랜치 소스 전체: `src/`, `index.html`, `public/`, `package.json`, `vite.config.ts`, GitHub Actions 워크플로)
- 방식: 정적 코드 감사 (네트워크 호출·저장소·OAuth·제3자 리소스를 전수 grep + 핵심 파일 정독)
- 한 줄 결론: **운영 서버가 없는 구조가 코드로 확인됐고, 외부 전송은 구글 API와 GA4 둘뿐이다. 유일한 "개발자행" 데이터 흐름은 ① 공식 빌드에 심긴 GA4 통계와 ② 메뉴의 업데이트 요청 구글 폼이며, 둘 다 개인 사본에서 제거·교체할 수 있다.**

---

## 1. 네트워크 호출 전수 목록

앱 런타임에서 나가는 요청은 아래가 전부다. `fetch`/`XMLHttpRequest`/`WebSocket`/`EventSource`/`sendBeacon`을 전수 검색했고, 숨은 엔드포인트는 없었다.

| # | 엔드포인트 | 보내는 데이터 | 시점 | 근거 |
|---|---|---|---|---|
| 1 | `accounts.google.com/o/oauth2/v2/auth` (페이지 이동) | client_id, redirect_uri, scope, state, login_hint(이메일) | 로그인/조용한 재로그인 | `src/lib/google.ts:44-57` |
| 2 | `openidconnect.googleapis.com/v1/userinfo` | Bearer 토큰 (응답: 이메일) | 로그인 직후 1회 | `src/lib/google.ts:114-118` |
| 3 | `oauth2.googleapis.com/revoke` | 액세스 토큰 | 로그아웃 시 | `src/lib/google.ts:121-127` |
| 4 | `sheets.googleapis.com/v4/spreadsheets…` | 작업 내용 전체(읽기/쓰기), Bearer 토큰 | 작업함 생성, 폴링(기본 5초, 백그라운드 30초), 작업 전송 | `src/lib/sheet.ts:11-12, 35-67` |
| 5 | `www.googleapis.com/drive/v3/files…` | 작업함/첨부 폴더 메타데이터 조회·수정 | 작업함 찾기/생성 | `src/lib/sheet.ts:13`, `src/lib/attach.ts:5` |
| 6 | `www.googleapis.com/upload/drive/v3/files` | 첨부 이미지(긴 변 2000px로 축소한 JPEG) + 파일명 | 이미지 첨부 시 | `src/lib/attach.ts:6, 105-125` |
| 7 | `www.googleapis.com/drive/v3/files/{id}?alt=media` | (응답: 이미지 blob) | 첨부 이미지 표시 시 | `src/lib/attach.ts:118-122` |
| 8 | `www.googletagmanager.com/gtag/js` + GA4 수집 엔드포인트 | 아래 2절의 이벤트만 | GA ID가 빌드에 있을 때만, 첫 이벤트 시 | `src/lib/analytics.ts:27-36` |
| 9 | `docs.google.com/forms/…` (새 탭) | 앱 버전·기기 종류·표시 방식·언어 (3절 참조) | 사용자가 메뉴 항목을 직접 눌렀을 때만 | `src/lib/feedback.ts:5-8, 24-27` |

- 구글 API 요청에는 `cache: 'no-store'`가 걸려 있고(`sheet.ts:46`), 토큰은 `Authorization: Bearer` 헤더로만 붙는다. URL 쿼리에 토큰을 넣는 곳은 로그아웃 revoke 호출뿐이다(`google.ts:125`, 구글 공식 방식이며 본인 토큰을 구글에 반납하는 호출).

## 2. Google Analytics (GA4)

- **측정 ID 위치**: 코드에 하드코딩돼 있지 않다. `src/lib/analytics.ts:4`가 빌드 환경변수 `VITE_GA_ID`를 읽고, 공식 배포는 GitHub Actions 변수 `GA_MEASUREMENT_ID`로 주입한다(`.github/workflows/pages.yml:35`). **ID가 없으면 gtag 스크립트 자체를 넣지 않아 완전히 무동작**이다(테스트로도 고정됨: `src/lib/analytics.test.ts` "does nothing without a measurement id").
- **보내는 이벤트** (`analytics.ts:44-53`의 타입이 곧 전수 목록이며, 호출 지점도 전부 확인):
  - `page_view` — page_title은 `sign_in|setup|onboarding|main` 중 하나 (고정값)
  - `login`, `sheet_create` — 파라미터 없음
  - `task_send` — `category`(task/briefing/idea/quick_action 중 하나), `source`(composer/preset/onboarding), `images`(첨부 개수, 숫자)
  - `prompt_copy` — `backfill_days`(0/7/30)
  - `onboarding_step` — `step`(고정 문자열), `onboarding_done` — `skipped`(불리언)
  - `share` — `method`(clipboard/failed)
  - 공통: `page_location`(origin+pathname만 — **쿼리와 `#access_token` 해시를 제거**한 값, `analytics.ts:40`), `display_mode`(standalone/browser)
- **사용자 콘텐츠 유출 가능성**: 작업 본문, 이메일, 시트 ID/주소, 토큰은 어떤 이벤트에도 들어가지 않는다. 타입 정의상 문자열 파라미터는 위 열거형뿐이라 임의 텍스트가 섞일 구조가 아니다. `analytics.test.ts`가 실제로 토큰 문자열이 dataLayer에 포함되지 않음을 검증한다.
- **설정**: `send_page_view: false`, `allow_google_signals: false`, `allow_ad_personalization_signals: false` (`analytics.ts:29-33`). 다만 GA4 기본 수집(기기·브라우저·대략적 지역, 쿠키 기반 방문자 구분)은 그대로 동작한다 — `public/privacy.html` 2-1절 고지와 일치.
- **주의 (미세한 부분)**: 개발자는 이 통계를 매일 아침 디스코드로 받아 본다 — `.github/workflows/daily-stats.yml` + `tool/daily_stats.mjs`가 GA4 Data API로 어제 사용자 수와 이벤트 이름별 건수를 개발자 디스코드 웹훅으로 전송한다. 단, 이 워크플로는 `github.repository == 'techinpark/pickle-desk'` 조건 + 개발자 시크릿이 있어야 돌아가므로 **포크/개인 레포에서는 실행되지 않는다**. 그래도 개인 사본에서는 제거하는 게 깔끔하다(사본에서 제거함).

## 3. 개발자에게 가는 또 하나의 길: "업데이트 요청하기" 구글 폼

- `src/lib/feedback.ts:6-8`에 개발자 소유 구글 폼 주소(`docs.google.com/forms/d/e/1FAIpQLSeV0WwoDswhMwR5…/viewform`)와 항목 ID(`entry.1757267059`)가 기본값으로 들어 있다. 메뉴(`src/components/MenuSheet.tsx:69`)에서 누르면 새 탭으로 열린다.
- **미리 채우는 값**: `v {버전} · {iOS/Android/macOS/Windows/other} · {home screen app|browser} · {언어}` (`feedback.ts:17-27`). 이메일·시트 주소·작업 내용은 포함되지 않는다(코드 확인).
- 사용자가 직접 누르고, 폼에서 직접 제출해야만 개발자에게 전달된다. 자동으로 전송되는 것은 아니다. 그래도 개인 사본에서는 메뉴 항목 자체를 제거했다.

## 4. 저장소 (로컬)

IndexedDB 사용 없음. 앱이 직접 쓰는 쿠키 없음(GA4 로드 시 구글이 `_ga` 쿠키를 심는 것은 별개). 서비스 워커 캐시는 6절 참조.

| 키 | 위치 | 내용 | 수명 |
|---|---|---|---|
| `pickledesk.token.v1` | localStorage | `{accessToken, expiresAt, email}` (`google.ts:10, 27-39`) | 토큰 자체가 1시간 만료. 만료 후에도 이메일은 재로그인 힌트로 남음. **로그아웃 시 삭제** (`google.ts:121-127`의 `saveToken(null)`) |
| `pickledesk.workbook.v1` | localStorage | `{spreadsheetId, url, email}` (`useSession.ts:9, 23-35`) | 로그아웃 시 삭제. 계정이 다르면 무효 처리 |
| `pickledesk.settings.v1` | localStorage | 폴링 주기, 언어, 테마, 알림 여부 (`settings.ts:17`) | 로그아웃해도 유지 (개인정보 아님) |
| `pickledesk.onboarding.v1` | localStorage | `{sheetId, step, testId}` (`onboarding.ts:8`) | 온보딩 완료 시 정리 |
| `pickledesk.oauth.state` | sessionStorage | OAuth state (CSRF 방지용 UUID) | 리디렉트 처리 즉시 삭제 (`google.ts:104`) |
| `pickledesk.oauth.silentAt` | sessionStorage | 조용한 재로그인 마지막 시도 시각 | 탭 종료 시 소멸 |

- **토큰 취급**: implicit flow(`response_type=token`)라 토큰이 URL 해시로 돌아오지만, 읽는 즉시 `history.replaceState`로 주소창에서 지운다(`google.ts:101-112`). state 불일치나 `drive.file` scope 미포함 응답은 버린다(`google.ts:82-92`).
- **로그아웃**: 로컬 토큰 삭제 + 구글 revoke 호출로 서버 측에서도 폐기한다(`google.ts:121-127`). 단, 작업함 시트와 첨부 파일은 드라이브에 남는다(고지대로, 직접 지워야 함).

## 5. OAuth

- **클라이언트 ID 위치**: `src/lib/google.ts:5` — `import.meta.env.VITE_GOOGLE_CLIENT_ID` 빌드 변수로 주입. 소스에 실제 ID 문자열은 없다(테스트용 더미만 존재: `vite.config.ts:58`, `package.json`의 e2e 스크립트).
- **요청 scope**: `drive.file`, `openid`, `email` 셋뿐 (`google.ts:7`). `drive.file`이라 구글 정책상 앱이 만든 파일만 접근 가능 — 방침 설명과 코드가 일치한다.
- **토큰이 붙는 곳**: Sheets/Drive/userinfo 호출의 Authorization 헤더만. 제3자 도메인으로 토큰이 가는 경로는 없다.

## 6. 제3자 리소스 · 서비스 워커

- **외부 스크립트/폰트 CDN 없음.** 폰트(Pretendard)는 npm 패키지(`pretendard`)로 번들에 포함돼 같은 출처에서 서빙된다(`src/index.css:1`). 런타임에 동적으로 넣는 외부 스크립트는 GA gtag 하나뿐이다.
- **서비스 워커** (`vite.config.ts`의 VitePWA + `public/sw-notify.js`):
  - 캐시 대상은 자기 출처의 앱 셸(js/css/html/svg/png)만(`globPatterns`). 구글 API 응답은 교차 출처라 캐시하지 않는다(주석과 설정 일치).
  - woff2 폰트 조각만 CacheFirst 런타임 캐시(최대 120개).
  - `sw-notify.js`는 알림 클릭 시 앱 창을 포커스/오픈하는 처리만 하며, 어떤 요청도 가로채거나 전송하지 않는다.
  - `registerType: 'autoUpdate'` — 새 버전이 같은 배포 출처에서 자동 갱신된다. **공식 주소를 쓰는 한, 코드 변경은 곧 내 브라우저 코드 변경**이라는 뜻이라, 개인 사용이면 자기 배포를 쓰는 게 안전하다는 판단 근거 중 하나다.
- **기타**: 알림은 로컬 알림만(푸시 서버 없음, `src/lib/notify.ts`). 클립보드 복사는 사용자 클릭 시에만. `og.png` 등 메타 이미지는 정적 파일.

## 7. 그 밖의 미세 사항

- `vite.config.ts:11`: `VITE_SITE_URL` 미설정 + GitHub Actions 밖에서 빌드하면 og 메타 기본값이 공식 주소(`techinpark.github.io/pickle-desk`)가 된다. 데이터 전송은 아니고 링크 미리보기용 메타데이터지만, 개인 빌드에서는 자기 주소로 바뀌는 게 맞다(Actions 빌드에서는 레포 기준으로 자동 설정됨).
- 공유 메뉴는 앱 주소(`VITE_SITE_URL` 또는 현재 origin)를 클립보드에 복사할 뿐 외부 전송이 없다(`App.tsx:218-228`).
- 테스트 코드(`src/test/`, `tests/`)와 `tool/` 스크립트는 배포 번들에 포함되지 않는다. 단 `tool/daily_stats.mjs`는 2절에서 말한 대로 개발자 CI 전용이다.
- `public/privacy.html`의 고지 내용(권한, 저장, GA, 철회 방법)은 코드 실측과 **모두 일치**했다. 고지가 코드보다 과장되거나 축소된 부분을 찾지 못했다.

## 8. 판정: 혼자 쓰는 사람이 바꿀 것

필수:
1. **자기 OAuth 클라이언트 ID로 교체** — 공식 빌드의 클라이언트 ID는 개발자 소유 프로젝트 소속이다. 그 ID로 로그인한다는 것은 내 구글 동의가 개발자 프로젝트에 묶인다는 뜻이라, 개인 사용이면 본인 Google Cloud 프로젝트에서 웹 클라이언트를 만들어 본인 배포 origin을 등록하고 그 ID로 빌드해야 한다 (`src/lib/google.ts:5`, 빌드 변수 `VITE_GOOGLE_CLIENT_ID`).
2. **GA4를 비우거나 본인 ID로 교체** — 공식 주소를 그대로 쓰면 내 사용 이벤트(화면 이름, 작업 분류, 첨부 개수 등)가 개발자 GA 속성으로 쌓인다. 콘텐츠는 안 가지만 "언제, 어떤 분류의 일을, 몇 번" 같은 사용 패턴 메타데이터는 간다. 개인 사본은 플레이스홀더 상태에서는 GA가 완전히 꺼지게 했다.
3. **업데이트 요청 폼 제거** — 개발자 폼으로 가는 메뉴는 개인 사본에 필요 없다 (사본에서 제거함). 남겨 두면 실수로 눌렀을 때 기기 종류·버전·언어가 개발자에게 제출될 수 있다.

선택:
4. `daily-stats` 워크플로/스크립트 제거 — 개인 레포에서는 어차피 안 돌지만, 흔적을 없애는 편이 낫다(사본에서 제거함).
5. 토큰이 localStorage에 평문으로 있다는 점은 이 구조(서버 없는 웹앱)의 본질적 한계다. 브라우저 프로필 자체를 신뢰할 수 있는 기기에서만 쓰고, 공용 PC에서는 쓰지 않는 게 좋다. 1시간 만료 + 로그아웃 시 revoke로 완화돼 있다.

유지해도 되는 것 (확인 완료):
- scope 3종, drive.file 한정 접근, 작업 데이터의 종착지는 본인 구글 시트뿐이라는 구조
- 토큰 처리(해시 즉시 제거, state 검증, 로그아웃 revoke)
- GA 이벤트 설계 자체는 콘텐츠를 안 보내게 잘 만들어져 있다 — 문제는 "누구의 GA로 가는가"뿐이다.
