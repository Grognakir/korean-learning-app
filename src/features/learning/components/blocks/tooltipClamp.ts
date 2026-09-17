// Тултипы (VocabChip, LabelInfo) центрируются CSS-ом (left:50% +
// translateX(-50%)) — для элемента у края экрана это выталкивает часть
// тултипа за пределы вьюпорта. Тултип visibility:hidden, но всё равно
// участвует в layout — на очень узких экранах это даже раздувало
// document.documentElement.scrollWidth без какого-либо наведения.
// Сдвигаем только при необходимости, небольшим transform-оффсетом
// поверх центрирования.
const EDGE_PADDING = 8;

export function clampTooltipToViewport(tooltip: HTMLElement) {
  tooltip.style.transform = "translateX(-50%)";
  const rect = tooltip.getBoundingClientRect();
  let shift = 0;
  if (rect.left < EDGE_PADDING) {
    shift = EDGE_PADDING - rect.left;
  } else if (rect.right > window.innerWidth - EDGE_PADDING) {
    shift = window.innerWidth - EDGE_PADDING - rect.right;
  }
  if (shift !== 0) {
    tooltip.style.transform = `translateX(calc(-50% + ${shift}px))`;
  }
}
