"use client";

/**
 * 3D 행성 (R3F) — SVG 버전 Planet.tsx 와 같은 props 를 받는다.
 *
 * 왜 dynamic(ssr:false) 인가:
 *   Three.js 는 WebGL 컨텍스트를 만들려고 브라우저의 canvas/window 에 접근한다.
 *   Next.js 는 기본적으로 컴포넌트를 서버에서 미리 HTML 로 렌더(SSR)하는데,
 *   서버에는 window 도 canvas 도 없으니 그대로 두면 빌드/요청 단계에서 터진다.
 *   그래서 이 컴포넌트만 "서버에서는 건너뛰고 브라우저에서만 불러오라"고 지정한다.
 *
 *   주의: ssr:false 는 클라이언트 컴포넌트 안에서만 쓸 수 있다.
 *   그래서 이 파일 맨 위에 "use client" 가 있고, 서버 컴포넌트인 페이지는
 *   이 파일을 그냥 import 해서 쓰면 된다.
 */

import dynamic from "next/dynamic";
import type { Difficulty } from "@/types/planet";
import { difficultyLabel } from "@/lib/utils/difficulty";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export interface Planet3DProps {
  /** 테라포밍 진행도 0~100 */
  progress: number;
  /** 행성 타입(색 변형) */
  difficulty: Difficulty;
  /** 렌더 크기(px). 기본 160 */
  size?: number;
  /** 자전 애니메이션 (기본 true). reduced-motion 이면 자동 정지 */
  animate?: boolean;
}

// dynamic() 은 모듈 최상단에서 한 번만 호출한다.
// 렌더 안에서 부르면 매 렌더마다 새 컴포넌트가 만들어져 계속 언마운트/재마운트된다.
const PlanetScene = dynamic(() => import("./planet3d/PlanetScene"), {
  ssr: false,
  // 불러오는 동안 같은 크기의 빈 자리를 잡아둔다 (레이아웃이 흔들리지 않게)
  loading: () => null,
});

export function Planet3D({ progress, difficulty, size = 160, animate = true }: Planet3DProps) {
  const reducedMotion = usePrefersReducedMotion();
  const p = Math.min(100, Math.max(0, progress));

  return (
    <div
      role="img"
      aria-label={`테라포밍 ${Math.round(p)}% ${difficultyLabel(difficulty)}`}
      style={{ width: size, height: size }}
    >
      <PlanetScene
        progress={p}
        difficulty={difficulty}
        size={size}
        spinning={animate && !reducedMotion}
      />
    </div>
  );
}
