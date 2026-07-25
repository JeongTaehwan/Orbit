"use client";

/**
 * 3D 행성 본체 — 캔버스 없이 "씬 안에 놓이는 물체"만 담당한다.
 *
 * 프리뷰(PlanetScene)와 궤도 지도(OrbitScene) 가 이걸 함께 쓴다.
 * 캔버스·조명·카메라는 각 씬이 알아서 준비한다.
 *
 * 스타일: 사실적 음영 대신 meshToonMaterial + 4단계 그라디언트로 색 구획을 만든다.
 * 표면은 이미지 파일 없이 코드로 그린 흑백 대륙 마스크 한 장만 쓴다.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Difficulty } from "@/types/planet";
import { planetVisual } from "@/lib/utils/planet3d";
import { GLOW_EDGE, createGlowTexture, createLandMask } from "@/lib/utils/planetTexture";

/** 자전 속도 (라디안/초) — 한 바퀴에 약 35초 */
const SPIN_SPEED = 0.18;

/**
 * 툰 셰이딩용 그라디언트 맵.
 *
 * 사실적 재질은 빛의 세기를 연속적으로 보간해 부드럽게 어두워진다.
 * 툰 재질은 이 1픽셀짜리 띠를 "단계표"로 삼아 가장 가까운 칸으로 스냅시킨다.
 * → 명암이 4개 구획으로 뚝뚝 나뉘어 일러스트처럼 보인다.
 */
export function useToonGradient(steps = 4): THREE.DataTexture {
  return useMemo(() => {
    const data = new Uint8Array(steps);
    for (let i = 0; i < steps; i++) {
      data[i] = Math.round(((i + 1) / steps) * 255);
    }
    const texture = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
    // NearestFilter = 칸 사이를 섞지 않는다 (섞으면 툰이 아니라 그냥 부드러운 음영)
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }, [steps]);
}

/** 코드로 그린 대륙 마스크를 three 텍스처로 감싼다 (난이도가 바뀔 때만 새로 만듦) */
function useLandMask(difficulty: Difficulty): THREE.CanvasTexture | null {
  const texture = useMemo(() => {
    const canvas = createLandMask(difficulty);
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.NoColorSpace; // 색이 아니라 '값'이므로 색공간 변환을 하지 않는다
    return t;
  }, [difficulty]);

  // GPU 메모리는 자동으로 회수되지 않는다 — 언마운트 시 직접 반납
  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

/** 대기 헤일로용 텍스처 (흰 링 한 장 — 색은 재질에서 입힌다) */
export function useGlowTexture(): THREE.CanvasTexture | null {
  const texture = useMemo(() => {
    const canvas = createGlowTexture();
    return canvas ? new THREE.CanvasTexture(canvas) : null;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

export interface PlanetBodyProps {
  progress: number;
  difficulty: Difficulty;
  /** 구체 분할 수 (작게 그릴수록 낮춰 성능을 아낀다) */
  segments: number;
  /** 자전 여부 */
  spinning: boolean;
  /** 반지름 배율 (기본 1 = 반지름 1) */
  scale?: number;
}

export function PlanetBody({
  progress,
  difficulty,
  segments,
  spinning,
  scale = 1,
}: PlanetBodyProps) {
  const spinRef = useRef<THREE.Group>(null);
  const visual = useMemo(() => planetVisual(progress, difficulty), [progress, difficulty]);
  const gradientMap = useToonGradient();
  const landMask = useLandMask(difficulty);
  const glowTexture = useGlowTexture();

  // useFrame: 매 프레임(보통 초당 60회) 호출되는 콜백.
  // delta = 지난 프레임에서 흐른 초. 곱해주면 기기 성능과 무관하게 같은 속도로 돈다.
  // setState 를 쓰지 않고 객체를 직접 건드리므로 React 리렌더가 일어나지 않는다.
  useFrame((_, delta) => {
    if (spinning && spinRef.current) {
      spinRef.current.rotation.y += delta * SPIN_SPEED;
    }
  });

  return (
    // 살짝 기울인 자전축 — 정면으로 도는 것보다 입체감이 산다
    <group scale={scale} rotation={[0.3, 0, 0.14]}>
      <group ref={spinRef}>
        {/* 지표: 암석 ↔ 바다 */}
        <mesh>
          <sphereGeometry args={[1, segments, segments / 2]} />
          <meshToonMaterial color={visual.surface} gradientMap={gradientMap} />
        </mesh>

        {/* 대륙: 같은 구를 아주 살짝 키워 덮고, 마스크가 흰 곳에만 보이게 한다.
            (색을 텍스처에 굽지 않으므로 진행도에 따라 완전히 부드럽게 바뀐다) */}
        {landMask && (
          <mesh scale={1.002}>
            <sphereGeometry args={[1, segments, segments / 2]} />
            <meshToonMaterial
              color={visual.land}
              gradientMap={gradientMap}
              alphaMap={landMask}
              transparent
              opacity={visual.landAmount}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* 대기 헤일로: 행성 뒤에 깐 평면 한 장.
          궤도 지도에서는 카메라가 돌아가므로 항상 카메라를 보도록 billboard 로 둔다. */}
      {glowTexture && visual.atmosphereOpacity > 0.01 && (
        <Billboard>
          {/* raycast 비활성: 이 평면은 행성 반지름의 4배라, 클릭 판정을 남겨두면
              행성 주변 허공까지 눌리는 거대한 투명 버튼이 되어 버린다. */}
          <mesh renderOrder={-1} scale={1 / GLOW_EDGE} raycast={() => null}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={glowTexture}
              color={visual.atmosphere}
              transparent
              opacity={visual.atmosphereOpacity}
              // 더하기 합성 — 어두운 우주 배경 위에서 '빛'처럼 보인다
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </Billboard>
      )}

      {/* 대기 림: 실루엣에 딱 붙는 밝은 테두리 (대기층의 단면) */}
      {visual.atmosphereOpacity > 0.01 && (
        <mesh scale={1.045}>
          <sphereGeometry args={[1, segments, segments / 2]} />
          <meshBasicMaterial
            color={visual.atmosphere}
            transparent
            opacity={visual.atmosphereOpacity * 0.75}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * 자식을 항상 카메라 쪽으로 돌려세운다.
 *
 * 프리뷰는 카메라가 고정이라 필요 없었지만, 궤도 지도는 카메라가 360도 도는 탓에
 * 평면으로 만든 헤일로가 옆에서 보면 종잇장처럼 사라진다. 매 프레임 카메라를
 * 바라보게 돌려 어느 각도에서든 같은 빛무리로 보이게 한다.
 */
function Billboard({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (!ref.current) return;
    // 부모의 회전을 상쇄하고 카메라 방향만 따르게 한다
    ref.current.quaternion.copy(camera.quaternion);
    ref.current.parent?.getWorldQuaternion(_q).invert();
    ref.current.quaternion.premultiply(_q);
  });

  return <group ref={ref}>{children}</group>;
}

const _q = new THREE.Quaternion();
