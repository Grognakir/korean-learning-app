import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "한국어 공부",
  description: "Приложение для изучения корейского языка",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
