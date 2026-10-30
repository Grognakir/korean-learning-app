"use client";

import dynamic from "next/dynamic";

/** ОС живёт на состоянии из браузера (раскладка, звонки, задание), поэтому
 * рендерится только на клиенте — без расхождения с серверной разметкой. */
export const SolomonOsClient = dynamic(() => import("./SolomonOs").then((m) => m.SolomonOs), {
  ssr: false,
  loading: () => <div style={{ position: "fixed", inset: 0, background: "#0d1410" }} />,
});
