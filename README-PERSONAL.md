# Pickle Desk 개인 사본 (Personal Fork)

원본: https://github.com/techinpark/pickle-desk (MIT). 이 사본은 "나만 사용"을 전제로,
원본 개발자에게 데이터가 가는 길을 모두 끊고, 바꿔야 할 값을 한 곳에 모은 버전이다.
자세한 근거는 상위 폴더의 `AUDIT.md` 참조.

## 원본과 다르게 바꾼 것

| # | 변경 | 이유 |
|---|---|---|
| 1 | GA4 측정 ID를 `src/config.ts`의 `GA_MEASUREMENT_ID` 상수로 이동. 기본값은 플레이스홀더 `G-XXXXXXXXXX`이며, 이 상태에서는 **통계가 완전히 꺼진다** (gtag 스크립트 자체를 넣지 않음). 빌드 변수 `VITE_GA_ID`가 있으면 그 값이 우선한다. | 공식 빌드에서는 내 사용 이벤트(화면 이름, 작업 분류, 첨부 개수 등)가 원본 개발자의 GA 속성으로 쌓인다. 콘텐츠는 안 가지만 사용 패턴은 간다. |
| 2 | 메뉴의 "업데이트 요청하기" 항목과 `src/lib/feedback.ts` 삭제 | 원본 개발자 소유 구글 폼으로 앱 버전·기기 종류·언어를 미리 채워 보내는 항목이라 개인 사본에는 불필요하다. |
| 3 | `.github/workflows/daily-stats.yml`과 `tool/daily_stats.mjs` 삭제 | 개발자가 GA 통계를 매일 디스코드로 받아 보는 CI. 개인 레포에서는 비밀값이 없어 원래 동작하지 않지만, 흔적을 제거했다. |
| 4 | `src/lib/google.ts`의 `CLIENT_ID` 정의에 교체 안내 주석 추가 (값 자체는 그대로 빌드 변수 주입) | 개인 배포에서는 본인 Google Cloud 프로젝트의 OAuth 클라이언트 ID를 써야 한다는 것을 코드에서 바로 알 수 있게 했다. |

그 외 기능·동작은 원본과 동일하다: OAuth scope(`drive.file`, `openid`, `email`),
작업함/첨부 구조, 토큰 처리 방식 모두 건드리지 않았다.

## 남은 설정 (배포 전에 직접 해야 할 것)

1. **본인 OAuth 클라이언트 ID 발급**
   - Google Cloud Console에서 본인 프로젝트 → API 및 서비스 → 사용자 인증 정보 → OAuth 클라이언트 ID(웹 애플리케이션) 생성.
   - "승인된 JavaScript 원본"에 본인 배포 주소를 등록 (예: `https://<내 GitHub 계정>.github.io`). 리디렉션 URI는 이 앱이 origin + 경로를 쓰므로 같은 주소를 리디렉션 URI에도 넣어 둔다.
   - 발급한 ID를 빌드에 주입: 로컬이면 `.env.local`에 `VITE_GOOGLE_CLIENT_ID=<ID>`, GitHub Pages면 레포 Settings → Secrets and variables → Actions → Variables에 `GOOGLE_CLIENT_ID` 등록 (워크플로 `.github/workflows/pages.yml`이 이미 이 변수를 읽는다).
2. **(선택) 본인 GA4 ID 연결**
   - 통계를 아예 안 쓰려면 아무것도 하지 않으면 된다(기본값이 꺼진 상태).
   - 본인 GA로만 받고 싶으면 `src/config.ts`의 플레이스홀더를 본인 측정 ID로 바꾸거나, Actions 변수 `GA_MEASUREMENT_ID`에 본인 ID를 등록한다.
3. **GitHub Pages 배포**
   - 이 사본을 본인 GitHub 레포에 올리고 Settings → Pages에서 배포 소스를 GitHub Actions로 설정하면, 포함된 `pages.yml` 워크플로가 빌드·배포한다. 하위 경로 배포라 `BASE_PATH=/<레포명>/`이 워크플로 기본값과 맞아야 한다(레포명이 pickle-desk가 아니면 `pages.yml`의 BASE_PATH를 확인).
   - 배포 후에는 공식 주소가 아닌 **본인 주소로만** 접속해서 쓴다. 공식 주소(techinpark.github.io)는 여전히 개발자 빌드다.

## 검증 결과

- `npm ci && npm run build` 성공, `npm test` 98/98 통과 (메뉴 항목 제거에 맞춰 `src/App.test.tsx`의 해당 단언 1건을 개인 사본 기준으로 갱신).
- 플레이스홀더 상태로 빌드한 번들에는 `googletagmanager` 문자열 자체가 포함되지 않는다(죽은 코드로 제거됨) — 통계가 꺼져 있다는 것을 빌드 산출물로도 확인했다.

## 주의

- 토큰은 구조상 브라우저 localStorage에 평문으로 저장된다(원본과 동일). 신뢰하는 개인 기기에서만 사용할 것.
- 작업 데이터 자체는 처음부터 본인 구글 시트에만 저장되는 구조라, 이 사본이 바꾸는 것은 "메타데이터가 누구에게 가는가"뿐이다.
