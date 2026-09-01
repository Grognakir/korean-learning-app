import {
  Noto_Sans_KR,
  Noto_Serif_KR,
  Nanum_Gothic,
  Inter,
  PT_Serif,
  Comfortaa,
} from "next/font/google";

// В метаданных next/font этой версии у Noto Sans/Serif KR и Nanum Gothic
// нет subset `korean` (только latin / cyrillic). Хангыль всё равно приезжает
// в CSS Google Fonts; subsets здесь только для preload.
export const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});
export const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  variable: "--font-noto-serif-kr",
  display: "swap",
});
export const nanumGothic = Nanum_Gothic({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-nanum-gothic",
  display: "swap",
});
export const inter = Inter({
  subsets: ["cyrillic", "latin"],
  variable: "--font-inter",
  display: "swap",
});
export const ptSerif = PT_Serif({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "700"],
  variable: "--font-pt-serif",
  display: "swap",
});
export const comfortaa = Comfortaa({
  subsets: ["cyrillic", "latin"],
  variable: "--font-comfortaa",
  display: "swap",
});

export const fontVariables = [
  notoSansKr.variable,
  notoSerifKr.variable,
  nanumGothic.variable,
  inter.variable,
  ptSerif.variable,
  comfortaa.variable,
].join(" ");
