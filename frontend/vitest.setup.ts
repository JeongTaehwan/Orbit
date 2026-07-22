// @testing-library/jest-dom 의 추가 matcher 를 vitest 에 등록.
// 예: expect(el).toBeInTheDocument(), toHaveTextContent() 등
import "@testing-library/jest-dom/vitest";

// jsdom 은 window.matchMedia 를 구현하지 않는다.
// prefers-reduced-motion 을 읽는 컴포넌트(Planet3D, Starfield, Modal 등)가
// 렌더 도중 이걸 호출하면 그대로 터지므로 최소 구현을 채워 넣는다.
// 기본값은 "일치하지 않음"(= 모션 허용) — 실제 브라우저 기본과 같다.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {}, // 구식 API (일부 라이브러리가 아직 참조)
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
