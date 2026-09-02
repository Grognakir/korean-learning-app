import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { createClient } from "@/lib/supabase/server";
import { DictionaryCacheProvider } from "@/features/dictionary/DictionaryCacheContext";
import { ActiveLanguageProvider } from "@/features/language/ActiveLanguageContext";
import { readGuestLanguage } from "@/features/language/getActiveLanguage";
import type { Language } from "@/features/dictionary/types";
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
  themeColor: "#1f4e8c",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fontUiVar: string | undefined;
  let fontKrVar: string | undefined;
  let activeLanguage: Language = "ko";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("font_ui, font_kr, active_language")
      .eq("id", user.id)
      .single();
    fontUiVar = fontUiCssVar(profile?.font_ui ?? null);
    fontKrVar = fontKrCssVar(profile?.font_kr ?? null);
    activeLanguage = (profile?.active_language as Language | undefined) ?? "ko";
  } else {
    activeLanguage = await readGuestLanguage();
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
        <ActiveLanguageProvider language={activeLanguage}>
          <DictionaryCacheProvider>{children}</DictionaryCacheProvider>
        </ActiveLanguageProvider>
      </body>
    </html>
  );
}
