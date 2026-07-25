"use client";

/**
 * 궤도 지도 3D 장면 — 행성 전부를 캔버스 하나에 담는다.
 *
 * 왜 캔버스 하나인가: 캔버스마다 WebGL 컨텍스트를 하나씩 잡는데 브라우저 상한이
 * 보통 8~16개다. 한 장면에 모아 담으면 행성이 몇 개든 컨텍스트는 1개다.
 *
 * 카메라: OrbitControls 로 자유롭게 둘러본다.
 *   끌기 = 360도 회전 / 휠 = 줌 / 우클릭·두 손가락 끌기 = 평행이동
 *
 * 라벨은 캔버스 "밖"의 평범한 HTML 이다.
 * R3F 는 별도의 리액트 렌더러라 캔버스 안에서는 Next 라우터 같은 React context 가
 * 끊긴다(= <Link> 가 동작하지 않는다). 그래서 라벨은 바깥 트리에 두고,
 * 매 프레임 행성의 3D 좌표를 화면 좌표로 투영해 DOM 을 직접 옮긴다.
 * 덕분에 링크·키보드 접근·화면 전환이 평소 HTML 과 똑같이 동작한다.
 */

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { TransitionLink } from "@/components/TransitionLink";
import { PlanetBody, useGlowTexture } from "@/components/planet3d/PlanetBody";
import { difficultyLabel, requiredRecords } from "@/lib/utils/difficulty";
import { GLOW_EDGE } from "@/lib/utils/planetTexture";
import { startViewTransition } from "@/lib/utils/viewTransition";
import {
  STAR_RADIUS,
  computeOrbitSystem,
  fitDistance,
  maxViewDistance,
  type OrbitBody,
} from "@/lib/utils/orbitSystem";
import type { Planet } from "@/types/planet";

interface Props {
  planets: Planet[];
  /** 공전·자전 여부 (reduced-motion 이면 false) */
  animate: boolean;
}

/** 궤도선 — 얇고 납작한 링. WebGL 은 선 굵기를 못 키우므로 면으로 그린다. */
function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.012, radius + 0.012, 128]} />
      <meshBasicMaterial
        color="#5cc9d6"
        transparent
        opacity={0.16}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/** 중심 항성 — 밝은 구 + 카메라를 따라 도는 빛무리 */
function Star() {
  const glow = useGlowTexture();
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ camera }) => {
    glowRef.current?.quaternion.copy(camera.quaternion);
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[STAR_RADIUS, 32, 16]} />
        <meshBasicMaterial color="#a8f0f7" />
      </mesh>
      {/* 항성이 광원 역할도 한다 */}
      <pointLight color="#bff2f8" intensity={12} distance={0} decay={1.4} />
      {glow && (
        <mesh ref={glowRef} renderOrder={-2} scale={(STAR_RADIUS / GLOW_EDGE) * 1.05}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={glow}
            color="#5cc9d6"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * 클릭·호버를 받는 행성 하나.
 *
 * 캔버스 안에서는 Next 라우터 context 가 끊겨 여기서 직접 이동할 수 없다.
 * 대신 바깥에 있는 같은 행성의 라벨 링크를 눌러(onSelect) TransitionLink 의
 * 이동 로직(화면 전환 포함)을 그대로 재사용한다.
 */
function OrbitPlanet({
  body,
  animate,
  groupRef,
  onSelect,
  onHover,
}: {
  body: OrbitBody;
  animate: boolean;
  groupRef: (el: THREE.Group | null) => void;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
}) {
  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={() => onHover(false)}
      onPointerMissed={() => onHover(false)}
    >
      <PlanetBody
        progress={body.planet.progress}
        difficulty={body.planet.difficulty}
        // 지도에서는 작게 보이므로 분할 수를 낮춰 여러 개를 감당한다
        segments={24}
        spinning={animate}
        scale={body.size}
        // 행성마다 대륙·색조를 조금씩 다르게 (id 를 seed 로)
        seed={body.planet.id}
      />
    </group>
  );
}

const _v = new THREE.Vector3();

/** 호버 시 행성이 커지는 배율 */
const HOVER_SCALE = 1.22;

/** 순차 등장 — 행성 하나가 나타나는 시간(초)과 행성 간 간격(초) */
const ENTER_DUR = 0.42;
const ENTER_STAGGER = 0.09;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** 살짝 튀어올랐다 안착하는 등장 곡선 (경쾌한 pop-in) */
function easeOutBack(x: number): number {
  const c1 = 1.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** 행성으로 날아 들어가는 시간(초) */
const DIVE_SEC = 1.05;

/** 구름이 몰려들기 시작하는 지점 (다이브 진행도 0~1) — 행성에 거의 닿았을 때 */
const CLOUD_FROM = 0.5;

/**
 * 구름이 화면을 완전히 덮는 지점 (다이브 진행도 0~1).
 *
 * 이 순간 상세로 넘어간다. 화면 전환(View Transition)이 '완전히 흰' 상태를
 * 스냅샷으로 잡은 뒤 상세로 크로스페이드하므로, 구름이 걷히며 드러나는 것은
 * 줌된 지도 행성이 아니라 상세 화면이 된다.
 * (여기서 넘기지 않고 다이브 끝까지 두면 구름이 갈라지며 지도 행성이 먼저 보인다)
 */
const COVER_AT = 0.82;

/** 도착 지점 — 행성 반지름의 몇 배 앞까지 다가갈지 (작을수록 화면을 꽉 채운다) */
const DIVE_STOP = 2.5;

/** 가속했다가 감속 — 우주선이 다가가는 느낌 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** 진행 중인 다이브 상태 (OrbitScene 이 요청하고 OrbitMotion 이 굴린다) */
interface Dive {
  index: number;
  t: number;
  from: THREE.Vector3;
  fromTarget: THREE.Vector3;
}

type ControlsRef = React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;

/**
 * 공전 · 호버 반응 · 라벨 위치 · 다이브를 한 프레임 루프에서 처리한다.
 *
 * 프레임마다 React state 를 건드리면 초당 60번 리렌더가 나므로,
 * three 객체와 DOM 스타일을 직접 쓴다.
 */
function OrbitMotion({
  bodies,
  animate,
  hovered,
  diveIndex,
  onArrive,
  controlsRef,
  veilRef,
  cloudLeftRef,
  cloudRightRef,
  groupRefs,
  labelRefs,
}: {
  bodies: OrbitBody[];
  animate: boolean;
  /** 지금 가리키고 있는 행성 인덱스 (없으면 null) */
  hovered: React.RefObject<number | null>;
  /** 날아 들어갈 행성 인덱스가 들어오면 다이브 시작 */
  diveIndex: React.RefObject<number | null>;
  /** 다이브가 끝나 상세로 넘어갈 때 */
  onArrive: (index: number) => void;
  /** 다이브 중 카메라 조작을 잠그기 위해 필요 */
  controlsRef: ControlsRef;
  /** 헤집고 지나갈 구름 — 덮개와 좌우 덩이 */
  veilRef: React.RefObject<HTMLDivElement | null>;
  cloudLeftRef: React.RefObject<HTMLDivElement | null>;
  cloudRightRef: React.RefObject<HTMLDivElement | null>;
  groupRefs: React.RefObject<(THREE.Group | null)[]>;
  labelRefs: React.RefObject<(HTMLAnchorElement | null)[]>;
}) {
  const elapsed = useRef(0);
  const dive = useRef<Dive | null>(null);
  // 호버 배율(1↔HOVER_SCALE)을 행성별로 부드럽게 damp. 등장 배율과 곱해 쓴다.
  const hoverFactors = useRef<number[]>([]);
  // 마운트 후 흐른 시간 — 순차 등장(stagger)용
  const enterElapsed = useRef(0);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useFrame((_, delta) => {
    const controls = controlsRef.current;

    // 다이브 요청이 들어오면 출발 지점을 붙잡아 둔다
    if (diveIndex.current !== null && dive.current === null) {
      dive.current = {
        index: diveIndex.current,
        t: 0,
        from: camera.position.clone(),
        fromTarget: controls ? controls.target.clone() : new THREE.Vector3(),
      };
      if (controls) controls.enabled = false; // 다이브 중엔 카메라 조작을 막는다
    }

    // 호버 중이거나 날아가는 중에는 공전을 멈춘다
    // (움직이는 과녁은 누르기 어렵고, 목표가 도망가면 다이브가 어긋난다)
    if (animate && hovered.current === null && dive.current === null) {
      elapsed.current += delta;
    }
    enterElapsed.current += delta;

    bodies.forEach((body, i) => {
      const group = groupRefs.current[i];
      if (!group) return;

      // 공전: XZ 평면 위 원 궤도
      const angle = body.phase + (elapsed.current / body.duration) * Math.PI * 2;
      group.position.set(
        Math.cos(angle) * body.radius,
        0,
        Math.sin(angle) * body.radius,
      );

      // 호버 반응: 목표 배율로 부드럽게 다가간다 (CSS transition 을 손으로 구현한 셈)
      const target = hovered.current === i ? HOVER_SCALE : 1;
      const hf = THREE.MathUtils.damp(hoverFactors.current[i] ?? 1, target, 12, delta);
      hoverFactors.current[i] = hf;

      // 순차 등장: 안쪽 행성부터 톡톡 나타난다 (reduced-motion 이면 즉시 1)
      let entrance = 1;
      if (animate) {
        const e = clamp01((enterElapsed.current - i * ENTER_STAGGER) / ENTER_DUR);
        entrance = easeOutBack(e);
      }

      group.scale.setScalar(hf * entrance);

      // 라벨: 행성 아래쪽 지점을 화면 좌표로 투영해 DOM 을 옮긴다
      const el = labelRefs.current[i];
      if (!el) return;
      _v.set(group.position.x, group.position.y - body.size - 0.35, group.position.z);
      _v.project(camera);

      // z > 1 이면 카메라 뒤 → 화면에 보일 자리가 없다
      if (_v.z > 1) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        return;
      }
      // 등장 중에는 라벨도 함께 페이드, 날아가는 동안에는 걷어낸다
      const enterFade = Math.min(1, entrance);
      el.style.opacity = dive.current
        ? String(Math.max(0, 1 - dive.current.t * 2))
        : String(enterFade);
      el.style.pointerEvents = dive.current || enterFade < 0.9 ? "none" : "auto";
      const x = (_v.x * 0.5 + 0.5) * size.width;
      const y = (-_v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, 0)`;
    });

    // ── 다이브: 카메라가 목표 행성 앞까지 날아간다 ──
    const d = dive.current;
    if (!d) return;

    const group = groupRefs.current[d.index];
    const body = bodies[d.index];
    if (!group || !body) return;

    d.t = Math.min(1, d.t + delta / DIVE_SEC);
    const s = easeInOutCubic(d.t);

    // 출발 방향은 유지한 채, 행성 바로 앞까지 접근한다
    _to.copy(group.position);
    _dir.subVectors(d.from, _to).normalize();
    _to.addScaledVector(_dir, body.size * DIVE_STOP);

    camera.position.lerpVectors(d.from, _to, s);
    if (controls) {
      controls.target.lerpVectors(d.fromTarget, group.position, s);
      controls.update();
    } else {
      camera.lookAt(group.position);
    }

    // ── 구름이 몰려들어 화면을 덮는다 ──
    // CLOUD_FROM → COVER_AT 동안 뿌옇게 짙어지고, 두 덩이가 커지며 다가온다.
    // 좌우로 갈라내지 않는다 — 갈라짐(=상세 드러내기)은 화면 전환이 대신한다.
    const c = Math.min(1, Math.max(0, (d.t - CLOUD_FROM) / (COVER_AT - CLOUD_FROM)));
    const veil = veilRef.current;
    if (veil) {
      veil.style.opacity = String(c);
      // 구름 덩이 사이 틈까지 메워 완전히 불투명하게
      veil.style.backgroundColor = `rgba(244, 249, 255, ${c.toFixed(3)})`;
      const grow = 1 + c * 1.1; // 다가올수록 커진다
      const left = cloudLeftRef.current;
      const right = cloudRightRef.current;
      if (left) left.style.transform = `scale(${grow})`;
      if (right) right.style.transform = `scale(${grow}) scaleX(-1)`;
    }

    // 완전히 덮인 순간 상세로. 화면 전환이 이 흰 화면을 스냅샷으로 잡아
    // 상세와 크로스페이드하므로, 걷히며 나오는 것은 상세다.
    if (d.t >= COVER_AT) {
      const arrived = d.index;
      dive.current = null;
      onArrive(arrived);
    }
  });

  return null;
}

const _to = new THREE.Vector3();
const _dir = new THREE.Vector3();

export default function OrbitScene({ planets, animate }: Props) {
  const system = useMemo(() => computeOrbitSystem(planets), [planets]);
  const distance = fitDistance(system.maxRadius);

  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const cloudLeftRef = useRef<HTMLDivElement>(null);
  const cloudRightRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const labelRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  // 가리키고 있는 행성. 매 프레임 도는 useFrame 이 읽으므로 ref 로 즉시 반영하고,
  // 커서 모양은 화면에 보이는 변화라 state 로도 둔다.
  const hovered = useRef<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const setHover = (index: number, on: boolean) => {
    if (on) hovered.current = index;
    else if (hovered.current === index) hovered.current = null;
    setHovering(hovered.current !== null);
  };

  // 클릭 → 카메라가 그 행성으로 날아간 뒤 상세로 이동
  const router = useRouter();
  const diveIndex = useRef<number | null>(null);

  function select(index: number) {
    if (diveIndex.current !== null) return; // 이미 날아가는 중
    // 모션을 줄이는 설정이면 연출 없이 바로 이동한다
    if (!animate) {
      router.push(`/planets/${system.bodies[index].planet.id}`);
      return;
    }
    diveIndex.current = index;
  }

  /**
   * 다이브가 끝나는 순간의 이동.
   *
   * 그냥 push 하면 화면이 뚝 끊긴다. View Transition 으로 감싸면 도착한 지도 화면과
   * 상세 화면이 서로 녹아들듯 이어진다 — 행성이 화면을 채운 채 넘어가므로
   * 상세의 큰 행성으로 자연스럽게 연결된다.
   */
  function goDetail(index: number) {
    const href = `/planets/${system.bodies[index].planet.id}`;
    startViewTransition(() => router.push(href), href);
  }

  // 높이는 바깥(SpaceMap)이 정한다 — 화면 크기에 맞춰 커지도록
  return (
    <div className={`relative h-full ${hovering ? "cursor-pointer" : ""}`}>
      <Canvas
        dpr={[1, 2]}
        camera={{
          // 위에서 비스듬히 내려다보는 시점에서 시작 (2.5D 느낌 유지)
          position: [0, distance * 0.55, distance * 0.85],
          fov: 40,
          near: 0.1,
          // 멀리까지 줌아웃해도 잘리지 않게 넉넉히
          far: 3000,
        }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
        style={{ touchAction: "none" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[-6, 8, 6]} intensity={1.2} />

        <Star />
        {system.bodies.map((b) => (
          <OrbitRing key={`ring-${b.planet.id}`} radius={b.radius} />
        ))}
        {system.bodies.map((b, i) => (
          <OrbitPlanet
            key={b.planet.id}
            body={b}
            animate={animate}
            groupRef={(el) => {
              groupRefs.current[i] = el;
            }}
            onSelect={() => select(i)}
            onHover={(on) => setHover(i, on)}
          />
        ))}

        <OrbitMotion
          bodies={system.bodies}
          animate={animate}
          hovered={hovered}
          diveIndex={diveIndex}
          onArrive={goDetail}
          controlsRef={controlsRef}
          veilRef={veilRef}
          cloudLeftRef={cloudLeftRef}
          cloudRightRef={cloudRightRef}
          groupRefs={groupRefs}
          labelRefs={labelRefs}
        />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan
          enableZoom
          enableRotate
          enableDamping
          dampingFactor={0.08}
          zoomSpeed={0.7}
          rotateSpeed={0.6}
          panSpeed={0.7}
          minDistance={2.5}
          maxDistance={maxViewDistance(system.maxRadius)}
          // 위아래로 완전히 뒤집히면 방향 감각을 잃으므로 양 끝만 살짝 막는다
          minPolarAngle={0.12}
          maxPolarAngle={Math.PI - 0.12}
        />
      </Canvas>

      {/* 행성에 뛰어들 때 헤집고 지나가는 구름.
          화면 전체를 덮어야 하므로 지도 영역이 아니라 body 에 직접 붙인다.
          (위치·투명도는 useFrame 이 DOM 에 직접 쓴다) */}
      {createPortal(
        <div ref={veilRef} aria-hidden className="orbit-dive-veil">
          <div ref={cloudLeftRef} className="orbit-dive-cloud" />
          <div ref={cloudRightRef} className="orbit-dive-cloud" />
        </div>,
        document.body,
      )}

      {/* 라벨 층 — 캔버스 위에 겹친다. 층 자체는 클릭을 통과시키고(카메라 조작),
          라벨만 클릭을 받는다(pointerEvents 는 위 useFrame 이 켜고 끈다). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {system.bodies.map((b, i) => (
          <TransitionLink
            key={b.planet.id}
            ref={(el: HTMLAnchorElement | null) => {
              labelRefs.current[i] = el;
            }}
            href={`/planets/${b.planet.id}`}
            aria-label={`${b.planet.name} — ${difficultyLabel(b.planet.difficulty)}, 진행도 ${Math.round(b.planet.progress)}%`}
            className="orbit-map-label absolute left-0 top-0 outline-none"
            // 라벨 위에서도 그 행성을 가리킨 것으로 본다 (키보드 포커스 포함)
            onPointerEnter={() => setHover(i, true)}
            onPointerLeave={() => setHover(i, false)}
            onFocus={() => setHover(i, true)}
            onBlur={() => setHover(i, false)}
            onClick={(e) => {
              // 새 탭·가운데 클릭 등은 브라우저 기본 동작을 유지한다
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault(); // 즉시 이동 대신 다이브 연출을 먼저
              select(i);
            }}
          >
            {/* 확대 효과는 안쪽 요소에 준다.
                바깥 <a> 의 transform 은 매 프레임 위치 계산이 덮어쓰기 때문. */}
            <span className="orbit-map-label-inner flex flex-col items-center whitespace-nowrap text-center leading-tight">
              <span className="text-[13px] font-medium text-fg">{b.planet.name}</span>
              <span className="text-[11px] text-fg-muted">
                진행도 {Math.round(b.planet.progress)}%
              </span>
              <span className="orbit-map-detail text-[11px] text-brand">
                {difficultyLabel(b.planet.difficulty)} · 기록 {b.planet.record_count}/
                {requiredRecords(b.planet.difficulty)}
              </span>
            </span>
          </TransitionLink>
        ))}
      </div>
    </div>
  );
}
