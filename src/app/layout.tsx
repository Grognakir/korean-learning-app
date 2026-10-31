import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { getAuthUser, getProfileRow } from "@/features/auth/requireUser";
import { DictionaryPreload } from "@/features/dictionary/DictionaryPreload";
import { DictionaryCacheProvider } from "@/features/dictionary/DictionaryCacheContext";
import { StorageUserProvider } from "@/lib/StorageUser";
import { fontVariables } from "@/styles/fonts";
import { fontKrCssVar, fontUiCssVar } from "@/features/settings/fontOptions";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "한국어 공부",
  description: "Приложение для изучения корейского языка",
  appleWebApp: {
    capable: true,
    title: "한국어 공부",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Без cover iOS отдаёт env(safe-area-inset-*) = 0, и полноэкранные блоки
  // уходят под скруглённые углы и полоску «домой».
  viewportFit: "cover",
  themeColor: "#1f4e8c",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { user } = await getAuthUser();

  let fontUiVar: string | undefined;
  let fontKrVar: string | undefined;
  if (user) {
    const profile = await getProfileRow(user.id);
    fontUiVar = fontUiCssVar(profile?.font_ui ?? null);
    fontKrVar = fontKrCssVar(profile?.font_kr ?? null);
  }

  return (
    <html
      lang="ru"
      className={fontVariables}
      style={
        {
          ...(fontUiVar ? { "--font-ui-active": fontUiVar } : {}),
          ...(fontKrVar ? { "--font-kr-active": fontKrVar } : {}),
        } as CSSProperties
      }
    >
      <body>
        <StorageUserProvider key={user?.id ?? "guest"} userId={user?.id}><DictionaryCacheProvider key={user?.id ?? "guest"}><DictionaryPreload userId={user?.id ?? null} />{children}</DictionaryCacheProvider></StorageUserProvider>
      </body>
    </html>
  );
}
