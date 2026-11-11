// ── 개인 설정 (이 파일 한 곳에서만 바꾼다) ─────────────────────────────
// 이 사본은 원본 개발자에게 어떤 데이터도 보내지 않도록 맞춘 개인용 빌드다.

// [GA4 측정 ID]
// 본인 Google Analytics 4 속성의 측정 ID(예: G-ABCD1234EF)를 쓰려면
// 아래 플레이스홀더를 본인 ID로 바꾸거나, 빌드할 때 환경변수 VITE_GA_ID로 넣어라.
// 플레이스홀더("G-XXXXXXXXXX") 그대로면 통계 코드는 아예 켜지지 않는다(완전 무동작).
// 원본 개발자의 GA로 보내고 싶지 않다면 이 값을 절대로 원본 배포의 ID로 바꾸지 말 것.
export const GA_MEASUREMENT_ID_PLACEHOLDER = 'G-XXXXXXXXXX'
export const GA_MEASUREMENT_ID: string = import.meta.env.VITE_GA_ID ?? GA_MEASUREMENT_ID_PLACEHOLDER

/** GA를 실제로 켤 수 있는 ID인지. 플레이스홀더/빈 값이면 통계 전송을 하지 않는다. */
export const gaConfigured = (): boolean => GA_MEASUREMENT_ID !== '' && GA_MEASUREMENT_ID !== GA_MEASUREMENT_ID_PLACEHOLDER

// [Google OAuth 클라이언트 ID]
// 실제 값은 src/lib/google.ts 의 CLIENT_ID가 빌드 변수 VITE_GOOGLE_CLIENT_ID에서 읽는다.
// 개인 배포에서는 반드시 본인 Google Cloud 프로젝트에서 만든 웹 클라이언트 ID를 써야 한다
// (google.ts 의 CLIENT_ID 정의 옆 주석 참조).
