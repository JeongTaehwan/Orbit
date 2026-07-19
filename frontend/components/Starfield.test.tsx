import { vi, describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { Starfield } from "./Starfield";

// jsdom 엔 matchMedia 가 없어 mock (모션 최소화 = 아님)
beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
});

describe("Starfield", () => {
  it("여러 개의 별을 렌더한다", () => {
    const { container } = render(<Starfield />);
    const stars = container.querySelectorAll(".orbit-star");
    expect(stars.length).toBeGreaterThan(50);
  });

  it("일부 별만 반짝임(twinkle) 클래스를 갖는다", () => {
    const { container } = render(<Starfield />);
    const all = container.querySelectorAll(".orbit-star").length;
    const twinkling = container.querySelectorAll(".orbit-star--tw").length;
    expect(twinkling).toBeGreaterThan(0);
    expect(twinkling).toBeLessThan(all); // 전부는 아님
  });

  it("좌표가 결정론적이라 두 번 렌더해도 동일하다(하이드레이션 안전)", () => {
    const a = render(<Starfield />).container.innerHTML;
    const b = render(<Starfield />).container.innerHTML;
    expect(a).toBe(b);
  });
});
