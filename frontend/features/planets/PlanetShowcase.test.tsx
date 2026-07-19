import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PlanetShowcase } from "./PlanetShowcase";

// 인라인 CSS 변수 --glow 값을 읽어 진행도별 발광 세기를 확인
function glowOf(container: HTMLElement): number {
  const el = container.querySelector<HTMLElement>(".orbit-planet-glow");
  return Number(el?.style.getPropertyValue("--glow"));
}

describe("PlanetShowcase", () => {
  it("궤도 링을 렌더한다", () => {
    const { container } = render(
      <PlanetShowcase progress={40} difficulty="easy" isCompleted={false} />,
    );
    expect(container.querySelectorAll(".orbit-ring").length).toBeGreaterThan(0);
  });

  it("진행도가 높을수록 발광이 강해진다", () => {
    const low = render(
      <PlanetShowcase progress={10} difficulty="normal" isCompleted={false} />,
    ).container;
    const high = render(
      <PlanetShowcase progress={90} difficulty="normal" isCompleted={false} />,
    ).container;
    expect(glowOf(high)).toBeGreaterThan(glowOf(low));
  });

  it("완성 행성은 발광이 맥동(pulse)한다", () => {
    const { container } = render(
      <PlanetShowcase progress={100} difficulty="hard" isCompleted />,
    );
    expect(container.querySelector(".orbit-planet-glow--pulse")).not.toBeNull();
  });
});
