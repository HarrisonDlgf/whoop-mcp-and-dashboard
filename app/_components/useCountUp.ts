"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(
  target: number | null,
  { duration = 900, decimals = 0 }: { duration?: number; decimals?: number } = {},
): number | null {
  const [value, setValue] = useState<number | null>(target);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) {
      setValue(null);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }

    const factor = 10 ** decimals;
    let startTs: number | null = null;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const t = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased * factor) / factor);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target, duration, decimals]);

  return value;
}
