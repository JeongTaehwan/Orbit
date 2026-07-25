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

/** 코드로 그린 대륙 마스크를 three 텍스처로 감싼다 (난이도·seed 가 바뀔 때만 새로 만듦) */
function useLandMask(difficulty: Difficulty, seed: number): THREE.CanvasTexture | null {
  const texture = useMemo(() => {
    const canvas = createLandMask(difficulty, seed);
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.NoColorSpace; // 색이 아니라 '값'이므로 색공간 변환을 하지 않는다
    return t;
  }, [difficulty, seed]);

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
  /** 완성 축하 연출(빛 발산 + 파티클). 상승 엣지에 한 번 재생된다. */
  celebrating?: boolean;
  /** 행성별 seed(보통 행성 id) — 대륙 배치·색조를 조금씩 다르게 한다 */
  seed?: number;
}

export function PlanetBody({
  progress,
  difficulty,
  segments,
  spinning,
  scale = 1,
  celebrating = false,
  seed = 0,
}: PlanetBodyProps) {
  const spinRef = useRef<THREE.Group>(null);
  const visual = useMemo(
    () => planetVisual(progress, difficulty, seed),
    [progress, difficulty, seed],
  );
  const gradientMap = useToonGradient();
  const landMask = useLandMask(difficulty, seed);
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

      {/* 완성 축하: 빛 발산 + 별가루 (celebrating 상승 엣지에 한 번 재생) */}
      <CelebrationFX celebrating={celebrating} color={visual.atmosphere} segments={segments} />
    </group>
  );
}

/** 별가루 개수 — 과하지 않게 절제 */
const PARTICLE_COUNT = 90;
/** 연출 길이(초) */
const FX_LIFETIME = 2.2;

/** 결정적 난수기 (mulberry32) — 렌더를 순수하게 유지하려고 Math.random 대신 쓴다 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 완성 축하 3D 이펙트 — 확 빛나는 플레어 + 바깥으로 퍼지는 별가루.
 *
 * celebrating 이 false→true 로 바뀌는 순간 시작해, 프레임 시간(age)으로 스스로
 * 재생·정리한다. React state 를 매 프레임 건드리지 않도록 three 객체·버퍼를 직접 쓴다.
 */
function CelebrationFX({
  celebrating,
  color,
  segments,
}: {
  celebrating: boolean;
  color: string;
  segments: number;
}) {
  const flareRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const age = useRef<number>(Infinity); // Infinity = 대기(정지)
  const wasCelebrating = useRef(false);

  // 방향·속도를 미리 계산 (구면에 고르게 흩뿌린 별가루).
  // 결정적 PRNG 를 써서 렌더가 순수하고(매번 같은 배치) 재현 가능하다.
  const { positions, dirs, speeds } = useMemo(() => {
    const rand = mulberry32(0x5eed);
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const dirs = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // 구면 균등 분포
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      dirs[i * 3] = s * Math.cos(theta);
      dirs[i * 3 + 1] = s * Math.sin(theta);
      dirs[i * 3 + 2] = u;
      speeds[i] = 0.9 + rand() * 1.3;
    }
    return { positions, dirs, speeds };
  }, []);

  useEffect(() => {
    // 버퍼는 R3F 가 언마운트 시 자동 dispose (JSX primitive)
    const dirsBuf = dirs;
    return () => void dirsBuf;
  }, [dirs]);

  useFrame((_, delta) => {
    // 상승 엣지에서 시작
    if (celebrating && !wasCelebrating.current) age.current = 0;
    wasCelebrating.current = celebrating;

    const flare = flareRef.current;
    const pts = pointsRef.current;
    if (age.current === Infinity) {
      if (flare) flare.visible = false;
      if (pts) pts.visible = false;
      return;
    }

    age.current += delta;
    const t = age.current / FX_LIFETIME;
    if (t >= 1) {
      age.current = Infinity; // 정리 — 다음 프레임에 숨김
      return;
    }

    // 플레어: 행성 자체가 확 밝아지는 플래시.
    // 캔버스(정사각형) 반높이가 1.32 뿐이라, 구체가 그걸 넘으면 사각형으로 잘린다.
    // 그래서 크기는 1.14 이하로 가둬 캔버스 안에 두고, 밝기(opacity)로만 번쩍인다.
    // '바깥으로 퍼지는 둥근 빛'은 캔버스 밖 DOM 후광(orbit-celebrate-halo)이 맡는다.
    if (flare) {
      flare.visible = true;
      const rise = Math.min(1, t / 0.18);
      const fall = Math.max(0, 1 - (t - 0.18) / 0.82);
      const mat = flare.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.8 * rise * fall;
      flare.scale.setScalar(1.05 + t * 0.09);
    }

    // 별가루: 바깥으로 퍼지며 감속(easeOut), 서서히 사라진다.
    // 캔버스 반높이(1.32)를 넘으면 사각형 경계에서 뚝 잘리므로, 최대 반경을
    // 그 안(1.3)으로 가둔다. 더 멀리 퍼지는 느낌은 DOM 후광이 대신 낸다.
    if (pts) {
      pts.visible = true;
      const ease = 1 - Math.pow(1 - t, 3);
      const arr = pts.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const r = 1.02 + speeds[i] * ease * 0.13; // 최대 ~1.3, 캔버스 안
        arr[i * 3] = dirs[i * 3] * r;
        arr[i * 3 + 1] = dirs[i * 3 + 1] * r;
        arr[i * 3 + 2] = dirs[i * 3 + 2] * r;
      }
      pts.geometry.attributes.position.needsUpdate = true;
      const mat = pts.material as THREE.PointsMaterial;
      mat.opacity = (t < 0.12 ? t / 0.12 : 1) * (1 - t); // 반짝 켜졌다 서서히 꺼짐
    }
  });

  return (
    <>
      {/* 확 빛나는 플레어 — 행성을 감싸는 밝은 구 (더하기 합성) */}
      <mesh ref={flareRef} visible={false} scale={1.1} raycast={() => null}>
        <sphereGeometry args={[1, segments, segments / 2]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 별가루 */}
      <points ref={pointsRef} visible={false} raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.07}
          sizeAttenuation
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
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
