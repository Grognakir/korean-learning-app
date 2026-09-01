// Повторяет конфигурацию, которую Next применяет по умолчанию (см.
// docs/pages/guides/post-css: postcss-flexbugs-fixes + postcss-preset-env
// stage 3 без компиляции custom properties) — свой postcss.config
// полностью заменяет дефолтный, поэтому дефолт приходится выписать.
// Добавлено сверх дефолта: custom media queries и общий файл с их
// объявлениями, чтобы порог адаптива жил в одном месте.
const config = {
  plugins: [
    "postcss-flexbugs-fixes",
    [
      "@csstools/postcss-global-data",
      { files: ["./src/styles/media.css"] },
    ],
    [
      "postcss-preset-env",
      {
        autoprefixer: { flexbox: "no-2009" },
        stage: 3,
        features: {
          "custom-properties": false,
          "custom-media-queries": true,
        },
      },
    ],
  ],
};

export default config;
