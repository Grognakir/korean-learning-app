"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";

type Frame = { width: number; height: number; left: number; right: number; top: number; bottom: number };
export function useModalDrag(enabled: boolean, dialog: RefObject<HTMLElement | null>, container: RefObject<HTMLElement | null>, viewport: { width: number; height: number }) {
  const [position, setPosition] = useState<{ x: number; y: number }>();
  const [frame, setFrame] = useState<Frame>({ width: 0, height: 0, left: 16, right: 16, top: 16, bottom: 16 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; clientX: number; clientY: number; x: number; y: number } | null>(null);
  const preferredWidth = useRef<number | undefined>(undefined);
  const measure = useCallback(() => {
    if (!dialog.current || !container.current) return;
    const rect = dialog.current.getBoundingClientRect(), padding = getComputedStyle(container.current);
    setFrame({ width: preferredWidth.current ?? rect.width, height: rect.height, left: parseFloat(padding.paddingLeft) || 8, right: parseFloat(padding.paddingRight) || 8, top: parseFloat(padding.paddingTop) || 8, bottom: parseFloat(padding.paddingBottom) || 8 });
  }, [dialog, container]);
  useEffect(() => {
    if (!enabled || !dialog.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(dialog.current);
    return () => observer.disconnect();
  }, [enabled, dialog, measure]);
  const width = Math.min(frame.width, Math.max(0, viewport.width - frame.left - frame.right));
  const maxHeight = Math.max(0, viewport.height - frame.top - frame.bottom);
  const bound = (point: { x: number; y: number }) => ({ x: Math.max(frame.left, Math.min(point.x, viewport.width - frame.right - width)), y: Math.max(frame.top, Math.min(point.y, viewport.height - frame.bottom - Math.min(frame.height, maxHeight))) });
  const end = (event: PointerEvent<HTMLElement>) => {
    drag.current = null; setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return {
    dragging,
    style: enabled && position ? { position: "absolute", left: bound(position).x, top: bound(position).y, width, maxHeight } as CSSProperties : undefined,
    handlers: {
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (!enabled || event.button !== 0 || (event.target as HTMLElement).closest("button") || !dialog.current || !container.current) return;
        event.preventDefault();
        const rect = dialog.current.getBoundingClientRect(), parent = container.current.getBoundingClientRect();
        const point = { x: rect.left - parent.left, y: rect.top - parent.top };
        preferredWidth.current ??= rect.width;
        measure(); setPosition(point); setDragging(true);
        drag.current = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY, ...point };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        if (!drag.current || drag.current.id !== event.pointerId) return;
        setPosition(bound({ x: drag.current.x + event.clientX - drag.current.clientX, y: drag.current.y + event.clientY - drag.current.clientY }));
      },
      onPointerUp: end,
      onPointerCancel: end,
      onLostPointerCapture: () => { drag.current = null; setDragging(false); },
    },
  };
}
