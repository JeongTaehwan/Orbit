"use client";

/**
 * OS 의 "동작 줄이기" 설정을 구독한다.
 *
 * useSyncExternalStore 는 React 밖의 값(여기선 matchMedia)을 읽을 때 쓰는 훅이다.
 * useState + useEffect 로 흉내내면 첫 렌더가 한 번 어긋났다가 다시 그려지는데,
 * 이 훅은 그 과정 없이 곧바로 올바른 값을 준다. (서버에서는 false)
 */

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false; // 서버엔 미디어 쿼리가 없다

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
