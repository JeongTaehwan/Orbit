"use client";

/**
 * 행성 상세의 주인공 연출 — 행성 + 궤도 링 + 발광(glow).
 *
 * - 궤도 링 둘: 서로 다른 속도·방향으로 천천히 회전 (앱 이름 Orbit).
 * - 발광은 진행도가 높을수록 강해지고, 완성(100%) 행성은 더 강하게 맥동.
 * - 색은 행성 난이도의 대기색 토큰을 따른다. reduced-motion 이면 회전·맥동 정지.
 */

import { Planet3D } from "@/components/Planet3D";
import { PLANET_3D_BOX } from "@/lib/utils/planet3d";
import type { Difficulty } from "@/types/planet";

interface Props {
  progress: number; // 0~100
  difficulty: Difficulty;
  isCompleted: boolean;
  size?: number;
  /** 확대 전환용 view-transition-name (우주 지도의 같은 이름 행성과 모핑) */
  viewTransitionName?: string;
  /** 완성 축하 연출 재생 중 (빛 발산 + 별가루 + 배경 후광) */
  celebrating?: boolean;
  /** 행성별 seed(보통 행성 id) — 대륙·색조를 조금씩 다르게 */
  seed?: number;
  /**
   * 기록 반영 펄스 — 진행도가 오르면 행성이 살짝 번쩍인다.
   * token 이 바뀔 때마다 다시 재생(remount). kind="stage" 는 단계 경계용(더 큼).
   */
  pulse?: { kind: "soft" | "stage"; token: number } | null;
}

export function PlanetShowcase({
  progress,
  difficulty,
  isCompleted,
  size = 260,
  viewTransitionName,
  celebrating = false,
  seed = 0,
  pulse = null,
}: Props) {
  const p = Math.min(100, Math.max(0, progress));
  // 발광 세기: 진행도 0.15 → 0.55 로 증가, 완성이면 최대
  const glow = isCompleted ? 0.6 : 0.15 + (p / 100) * 0.4;
  const glowColor = `var(--color-planet-${difficulty}-atmosphere)`;
  // 3D 캔버스 박스는 구체보다 크다(대기 헤일로 여백). 레이아웃도 그만큼 잡아야
  // 아래 제목과 겹치지 않는다. 궤도 링·발광은 size 기준 그대로라 비율은 유지된다.
  const box = Math.round(size * PLANET_3D_BOX);

  return (
    <div className="orbit-showcase" style={{ width: box, height: box }}>
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

      {/* 축하 후광 — 완성 순간 뒤에서 확 번졌다 사그라드는 배경 빛 (1회) */}
      {celebrating && (
        <div className="orbit-celebrate-halo" style={{ ["--glow-color" as string]: glowColor }} />
      )}

      {/* 기록 반영 펄스 — 진행도가 오를 때 살짝 번쩍 (token 마다 remount 해 재생) */}
      {pulse && (
        <div
          key={pulse.token}
          className={`orbit-pulse-halo ${pulse.kind === "stage" ? "orbit-pulse-halo--stage" : ""}`}
          style={{ ["--glow-color" as string]: glowColor }}
        />
      )}

      {/* 행성 본체 (링·발광 위로).
          3D 는 대기 헤일로가 번질 자리를 남기려고 카메라를 물려 두어서, 같은 px 박스면
          구체가 작게 보인다. 그만큼 박스를 키워 링·발광과의 크기 비율을 맞춘다. */}
      <div
        className="relative z-10"
        style={viewTransitionName ? { viewTransitionName } : undefined}
      >
        <Planet3D
          progress={p}
          difficulty={difficulty}
          size={box}
          animate
          celebrating={celebrating}
          seed={seed}
        />
      </div>
    </div>
  );
}
