import { useEffect, useRef, useState } from "react";

/**
 * target 이 바뀌면 현재값에서 target 으로 duration(ms) 동안 부드럽게 보간한다.
 * (진행도 숫자/바/행성이 뚝 바뀌지 않고 스르륵 오르도록)
 */
export function useAnimatedNumber(target: number, duration = 700): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);

  // 최신 표시값을 ref 로 추적 (애니메이션 중 target 이 또 바뀌면 여기서 이어감)
  useEffect(() => {
    valueRef.current = value;
  });

  useEffect(() => {
    const from = valueRef.current;
    if (Math.abs(from - target) < 0.01) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = p * p * (3 - 2 * p); // smoothstep
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
