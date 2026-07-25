"use client";

/**
 * 단일 3D 행성 씬 (프리뷰·상세용) — WebGL 을 실제로 쓰는 부분.
 * 반드시 클라이언트에서만 로드된다. (Planet3D.tsx 가 dynamic(ssr:false) 로 불러온다)
 *
 * 구성
 *   <Canvas>            : WebGL 캔버스 + 씬/카메라/렌더러를 한 번에 만들어 준다
 *     <ambientLight>    : 전체를 고르게 밝히는 바닥 조명 (그늘이 새까매지지 않게)
 *     <directionalLight>: 한 방향 광원 — 입체감은 사실상 이 하나가 만든다
 *     <PlanetBody>      : 행성 물체 자체 (궤도 지도와 공유)
 */

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { Difficulty } from "@/types/planet";
import { sphereSegments } from "@/lib/utils/planet3d";
import { PlanetBody } from "./PlanetBody";

interface SceneProps {
  progress: number;
  difficulty: Difficulty;
  size: number;
  spinning: boolean;
}

export default function PlanetScene({ progress, difficulty, size, spinning }: SceneProps) {
  return (
    <Canvas
      // dpr 상한 — 레티나에서 픽셀 수가 4배로 뛰는 걸 막는다
      dpr={[1, 2]}
      // 거리 4.6 / fov 32 → 화면 반높이 1.32 (행성 반지름 1).
      // 행성 바깥에 여백을 남겨야 대기 헤일로가 0 으로 사라질 자리가 생긴다.
      camera={{ position: [0, 0, 4.6], fov: 32 }}
      // 자전하지 않을 땐 "demand": 바뀔 때만 그리고 평소엔 GPU 를 쉬게 한다
      frameloop={spinning ? "always" : "demand"}
      // 톤매핑 끔: 기본값(ACES)은 사진처럼 밝은 색을 눌러 색을 살짝 바꾼다.
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
      style={{ width: size, height: size }}
    >
      {/* 전체를 은은하게 깔아주는 빛 — 너무 세면 툰 구획이 사라진다 */}
      <ambientLight intensity={0.45} />
      {/* 한 방향 광원: 좌상단에서 비스듬히. 입체감과 툰 구획은 이 하나가 만든다 */}
      <directionalLight position={[-3, 2, 1.5]} intensity={1.5} />
      <PlanetBody
        progress={progress}
        difficulty={difficulty}
        segments={sphereSegments(size)}
        spinning={spinning}
      />
    </Canvas>
  );
}
