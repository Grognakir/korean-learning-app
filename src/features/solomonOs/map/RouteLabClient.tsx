"use client";

import dynamic from "next/dynamic";

export const RouteLabClient = dynamic(() => import("./RouteLab").then((m) => m.RouteLab), {
  ssr: false,
  loading: () => <div style={{minHeight:"100dvh",background:"#111a17"}} />,
});
