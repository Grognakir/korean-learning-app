import { COLOR_BY_ID, patternInk, type ColorId, type PatternId } from "./colors";
import { COLORED_BASE, ICON_BASE, PATTERN_BASE } from "./items";

const SIZE = 256;

const cache = new Map<string, Promise<string | null>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function pixels(draw: (ctx: CanvasRenderingContext2D) => void): Uint8ClampedArray | null {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  draw(ctx);
  return ctx.getImageData(0, 0, SIZE, SIZE).data;
}

/** Готовая цветная версия вещи (colored/<id>/<color>.webp). */
function coloredSrc(id: string, color: ColorId): string {
  return `${COLORED_BASE}/${id}/${color}.webp`;
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Запасные метки узора (важна только альфа), пока нет маски по крою вещи. */
function drawPattern(ctx: CanvasRenderingContext2D, pattern: PatternId) {
  ctx.fillStyle = "#fff";
  if (pattern === "stripes") {
    const p = SIZE * 0.055;
    for (let x = 0; x < SIZE; x += p) ctx.fillRect(x, 0, p * 0.36, SIZE);
  } else if (pattern === "check") {
    const p = SIZE * 0.075;
    ctx.globalAlpha = 0.5;
    for (let x = 0; x < SIZE; x += p) ctx.fillRect(x, 0, p / 2, SIZE);
    for (let y = 0; y < SIZE; y += p) ctx.fillRect(0, y, SIZE, p / 2);
    ctx.globalAlpha = 1;
  } else if (pattern === "dots" || pattern === "floral") {
    const p = SIZE * (pattern === "dots" ? 0.06 : 0.105);
    const petal = p * 0.13;
    for (let row = 0, y = 0; y < SIZE + p; row++, y += p * 0.87)
      for (let x = row % 2 ? p / 2 : 0; x < SIZE + p; x += p) {
        if (pattern === "dots") {
          circle(ctx, x, y, p * 0.2);
          continue;
        }
        const turn = row * 0.7 + x * 0.05;
        for (let i = 0; i < 5; i++) {
          const a = turn + (i * Math.PI * 2) / 5;
          circle(ctx, x + Math.cos(a) * petal * 1.15, y + Math.sin(a) * petal * 1.15, petal);
        }
        ctx.globalCompositeOperation = "destination-out";
        circle(ctx, x, y, petal * 0.55);
        ctx.globalCompositeOperation = "source-over";
      }
  }
}

/** Если у вещи есть готовая цветная версия, берётся она, а узор рисуется
 * поверх. Иначе — перекраска «градиентной картой»: светлые места ткани
 * получают выбранный цвет, тени — его же тёмный оттенок. Узор — маска по
 * крою вещи (patterns/<id>/<pattern>.png); затеняется по складкам исходной
 * белой иконки и не ложится на её линии. */
async function render(id: string, color: ColorId, pattern: PatternId): Promise<string | null> {
  const [colored, icon, mask, patternMask] = await Promise.all([
    color === "white" ? null : loadImage(coloredSrc(id, color)).catch(() => null),
    loadImage(`${ICON_BASE}/${id}.png`),
    loadImage(`${ICON_BASE}/${id}_fabric.png`),
    pattern === "plain" ? null : loadImage(`${PATTERN_BASE}/${id}/${pattern}.png`).catch(() => null),
  ]);
  if (colored && pattern === "plain") return coloredSrc(id, color);

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(colored ?? icon, 0, 0, SIZE, SIZE);
  const image = ctx.getImageData(0, 0, SIZE, SIZE);
  const out = image.data;

  const source = colored ? pixels((c) => c.drawImage(icon, 0, 0, SIZE, SIZE)) : out.slice();
  const fabric = pixels((c) => c.drawImage(mask, 0, 0, SIZE, SIZE));
  const marks =
    pattern === "plain"
      ? null
      : pixels((c) => (patternMask ? c.drawImage(patternMask, 0, 0, SIZE, SIZE) : drawPattern(c, pattern)));
  if (!fabric || !source) return null;

  const base = hexToRgb(COLOR_BY_ID[color].hex).map((v) => v / 255);
  const lum = 0.299 * base[0] + 0.587 * base[1] + 0.114 * base[2];
  const high = base.map((v) => (lum < 0.35 ? v + (1 - v) * 0.12 : v));
  const shadow = base.map((v) => v * 0.55);
  const [inkR, inkG, inkB, inkA] = patternInk(color);

  for (let i = 0; i < out.length; i += 4) {
    const m = fabric[i + 3] / 255;
    if (m === 0) continue;
    const light = (source[i] + source[i + 1] + source[i + 2]) / 765;
    if (!colored) {
      const t = Math.min(1, Math.max(0, (light - 0.45) / 0.55));
      out[i] += ((shadow[0] + (high[0] - shadow[0]) * t) * 255 - out[i]) * m;
      out[i + 1] += ((shadow[1] + (high[1] - shadow[1]) * t) * 255 - out[i + 1]) * m;
      out[i + 2] += ((shadow[2] + (high[2] - shadow[2]) * t) * 255 - out[i + 2]) * m;
    }
    if (!marks) continue;
    // Линии и швы исходника остаются чистыми.
    const clear = Math.min(1, Math.max(0, (light - 0.42) / 0.25));
    const p = (marks[i + 3] / 255) * (inkA / 255) * m * clear;
    if (p === 0) continue;
    // Метка в складке темнеет так же, как ткань под ней.
    const shade = Math.min(1, light / 0.93);
    out[i] += (inkR * shade - out[i]) * p;
    out[i + 1] += (inkG * shade - out[i + 1]) * p;
    out[i + 2] += (inkB * shade - out[i + 2]) * p;
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

/** data:URL перекрашенной иконки; null — перекраска не нужна или canvas
 * недоступен (тогда показывается исходная иконка). */
export function recolorIcon(id: string, color: ColorId, pattern: PatternId): Promise<string | null> {
  if (color === "white" && pattern === "plain") return Promise.resolve(null);
  const key = `${id}:${color}:${pattern}`;
  let result = cache.get(key);
  if (!result) {
    result = render(id, color, pattern).catch(() => null);
    cache.set(key, result);
  }
  return result;
}
