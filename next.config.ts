import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // В деве 0, а не дефолтные 30с: страницы уроков/словаря ходят в Supabase
  // на каждый рендер, а не в fetch-кэш, поэтому клиентский Router Cache
  // там только маскирует свежие данные под старые (например "урок скоро
  // появится" ещё долго после того, как контент уже импортирован
  // локально). На проде контент меняется редко — там 30с ощутимо быстрее
  // навигация, и цена этого — секунды устаревания, а не спутанный экран.
  experimental: {
    staleTimes: { dynamic: process.env.NODE_ENV === "development" ? 0 : 30 },
  },
};

export default nextConfig;
