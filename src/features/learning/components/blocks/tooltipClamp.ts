// Тултипы (VocabChip, LabelInfo) центрируются CSS-ом (left:50% +
// translateX(-50%)) — для элемента у края экрана это выталкивает часть
// тултипа за пределы вьюпорта. Тултип visibility:hidden, но всё равно
// участвует в layout — на очень узких экранах это даже раздувало
// document.documentElement.scrollWidth без какого-либо наведения.
// Сдвигаем только при необходимости, небольшим transform-оффсетом
// поверх центрирования.
//
// Если у предка есть data-tooltip-boundary (карточка с overflow:hidden,
// которая иначе обрезает тултип), границы берутся от него, а не от окна;
// тултип, не помещающийся над чипом внутри такой области, открывается под ним.
const EDGE_PADDING = 8;

export function clampTooltipToViewport(tooltip: HTMLElement) {
  tooltip.style.transform = "translateX(-50%)";
  tooltip.style.bottom = "";
  tooltip.style.top = "";
  const boundary = tooltip.closest<HTMLElement>("[data-tooltip-boundary]");
  const bounds = boundary
    ? boundary.getBoundingClientRect()
    : { left: 0, right: window.innerWidth, top: 0 };
  const rect = tooltip.getBoundingClientRect();
  let shift = 0;
  if (rect.left < bounds.left + EDGE_PADDING) {
    shift = bounds.left + EDGE_PADDING - rect.left;
  } else if (rect.right > bounds.right - EDGE_PADDING) {
    shift = bounds.right - EDGE_PADDING - rect.right;
  }
  if (shift !== 0) {
    tooltip.style.transform = `translateX(calc(-50% + ${shift}px))`;
  }
  if (boundary && rect.top < bounds.top) {
    tooltip.style.bottom = "auto";
    tooltip.style.top = "calc(100% + var(--chip-tip-gap, 1px))";
  }
}
