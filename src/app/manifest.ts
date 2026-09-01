import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "한국어 공부 — изучение корейского",
    short_name: "한국어 공부",
    description: "Приложение для изучения корейского языка",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#1f4e8c",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
