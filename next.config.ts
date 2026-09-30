import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 0, а не дефолтные 30с: страницы уроков/словаря ходят в Supabase на
  // каждый рендер, а не в fetch-кэш, поэтому клиентский Router Cache
  // здесь только маскирует свежие данные под старые (например "урок
  // скоро появится" ещё долго после того, как контент уже импортирован).
  experimental: {
    staleTimes: { dynamic: 0 },
  },
};

export default nextConfig;
