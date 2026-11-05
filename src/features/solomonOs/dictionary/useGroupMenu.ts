import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export function useGroupMenu(control: RefObject<HTMLDivElement | null>, open: boolean, count: number) {
  const [position, setPosition] = useState<CSSProperties>();
  useLayoutEffect(() => {
    if (!open) return;
    let frame = 0;
    const place = () => {
      const rect = control.current?.getBoundingClientRect();
      if (!rect) return;
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
      const width = Math.min(Math.max(rect.width, 180), (viewport?.width ?? window.innerWidth) - 16);
      const bottom = top + (viewport?.height ?? window.innerHeight);
      const below = bottom - rect.bottom - 8, above = rect.top - top - 8;
      const flip = below < Math.min(count * 40 + 6, 180) && above > below;
      setPosition({ position: "fixed", width, left: Math.max(left + 8, Math.min(rect.left, left + (viewport?.width ?? window.innerWidth) - width - 8)), top: flip ? rect.top - 4 : rect.bottom + 4, maxHeight: Math.max(40, Math.min(220, flip ? above : below)), transform: flip ? "translateY(-100%)" : undefined });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(place); };
    place();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    if (control.current) { observer?.observe(control.current); const dialog = control.current.closest('[role="dialog"]'); if (dialog) observer?.observe(dialog); }
    window.addEventListener("resize", schedule); window.addEventListener("scroll", schedule, true);
    window.addEventListener("pointermove", schedule); window.addEventListener("pointerup", schedule);
    window.visualViewport?.addEventListener("resize", schedule); window.visualViewport?.addEventListener("scroll", schedule);
    return () => { observer?.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule, true); window.removeEventListener("pointermove", schedule); window.removeEventListener("pointerup", schedule); window.visualViewport?.removeEventListener("resize", schedule); window.visualViewport?.removeEventListener("scroll", schedule); };
  }, [control, open, count]);
  return position;
}
