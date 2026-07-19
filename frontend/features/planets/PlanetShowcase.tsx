"use client";

/**
 * 행성 상세의 주인공 연출 — 행성 + 궤도 링 + 발광(glow).
 *
 * - 궤도 링 둘: 서로 다른 속도·방향으로 천천히 회전 (앱 이름 Orbit).
 * - 발광은 진행도가 높을수록 강해지고, 완성(100%) 행성은 더 강하게 맥동.
 * - 색은 행성 난이도의 대기색 토큰을 따른다. reduced-motion 이면 회전·맥동 정지.
 */

import { Planet } from "@/components/Planet";
import type { Difficulty } from "@/types/planet";

interface Props {
  progress: number; // 0~100
  difficulty: Difficulty;
  isCompleted: boolean;
  size?: number;
  /** 확대 전환용 view-transition-name (우주 지도의 같은 이름 행성과 모핑) */
  viewTransitionName?: string;
}

export function PlanetShowcase({
  progress,
  difficulty,
  isCompleted,
  size = 260,
  viewTransitionName,
}: Props) {
  const p = Math.min(100, Math.max(0, progress));
  // 발광 세기: 진행도 0.15 → 0.55 로 증가, 완성이면 최대
  const glow = isCompleted ? 0.6 : 0.15 + (p / 100) * 0.4;
  const glowColor = `var(--color-planet-${difficulty}-atmosphere)`;

  return (
    <div className="orbit-showcase" style={{ width: size, height: size }}>
      {/* 바깥 궤도 (크고 느리게) */}
      <div
        className="orbit-ring-tilt"
        style={{ width: size * 1.92, height: size * 1.92, ["--tilt" as string]: 0.4 }}
      >
        <div className="orbit-ring orbit-ring--spin" style={{ ["--dur" as string]: "40s" }}>
          <span className="orbit-ring__sat" />
        </div>
      </div>

      {/* 안쪽 궤도 (작고 빠르게, 반대 방향) */}
      <div
        className="orbit-ring-tilt"
        style={{ width: size * 1.44, height: size * 1.44, ["--tilt" as string]: 0.55 }}
      >
        <div
          className="orbit-ring orbit-ring--spin"
          style={{ ["--dur" as string]: "26s", ["--dir" as string]: "reverse" }}
        >
          <span className="orbit-ring__sat" />
        </div>
      </div>

      {/* 발광 (행성 뒤) */}
      <div
        className={`orbit-planet-glow ${isCompleted ? "orbit-planet-glow--pulse" : ""}`}
        style={{ ["--glow" as string]: glow, ["--glow-color" as string]: glowColor }}
      />

      {/* 행성 본체 (링·발광 위로) */}
      <div className="relative z-10" style={viewTransitionName ? { viewTransitionName } : undefined}>
        <Planet progress={p} difficulty={difficulty} size={size} animate />
      </div>
    </div>
  );
}
