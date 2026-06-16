import { useCallback, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';

/**
 * Gamma-corrected zoom-adjusted value calculation
 * 来源：n8n useZoomAdjustedValues.ts，gamma=2.2 让感知变化均匀
 */
function calculateZoomAdjustedValue(
  zoom: number,
  baseValue: number,
  maxValue: number,
  minZoom = 0.2,
  gamma = 2.2,
): number {
  if (zoom >= 1.0) return baseValue;
  if (zoom <= minZoom) return maxValue;
  const t = (1.0 - zoom) / (1.0 - minZoom);
  return baseValue + Math.pow(t, gamma) * (maxValue - baseValue);
}

/**
 * 缩放自适应 Hook
 * 关键：通过 CSS 变量注入 DOM，不走 React state，避免 zoom 变化触发重渲染
 */
export function useZoomAdjustedValues() {
  const { getViewport } = useReactFlow();
  const rafId = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const update = useCallback(() => {
    const viewport = getViewport();
    const zoom = viewport.zoom;

    // 节点边框透明度（亮色/暗色）
    const borderOpacityLight = calculateZoomAdjustedValue(zoom, 0.1, 0.7).toFixed(3);
    const borderOpacityDark = calculateZoomAdjustedValue(zoom, 0.2, 0.7).toFixed(3);

    // 连线亮度
    const edgeLightnessLight = calculateZoomAdjustedValue(zoom, 0.84, 0.6).toFixed(3);
    const edgeLightnessDark = calculateZoomAdjustedValue(zoom, 0.42, 0.66).toFixed(3);

    // Handle 亮度
    const handleLightnessLight = calculateZoomAdjustedValue(zoom, 0.68, 0.3).toFixed(3);
    const handleLightnessDark = calculateZoomAdjustedValue(zoom, 0.5, 0.7).toFixed(3);

    // 缩放补偿因子（保持视觉大小一致）
    const compensationFactor = (1 / Math.max(zoom, 0.3)).toFixed(3);

    // 注入 CSS 变量到 document.documentElement（html 根元素）
    // 这样 React Flow 的 portal 渲染的 Handle 也能读到这些变量
    const root = document.documentElement;
    root.style.setProperty('--canvas-node--border--opacity-light', borderOpacityLight);
    root.style.setProperty('--canvas-node--border--opacity-dark', borderOpacityDark);
    root.style.setProperty('--canvas-edge--color--lightness--light', edgeLightnessLight);
    root.style.setProperty('--canvas-edge--color--lightness--dark', edgeLightnessDark);
    root.style.setProperty('--canvas-handle--lightness--light', handleLightnessLight);
    root.style.setProperty('--canvas-handle--lightness--dark', handleLightnessDark);
    root.style.setProperty('--canvas-zoom-compensation-factor', compensationFactor);
    root.style.setProperty('--canvas-zoom', zoom.toFixed(3));

    // 同时注入到容器（用于辅助线等）
    const container = containerRef.current;
    if (container) {
      container.style.setProperty('--canvas-zoom-compensation-factor', compensationFactor);
      container.style.setProperty('--canvas-zoom', zoom.toFixed(3));
    }
  }, [getViewport]);

  // 使用 requestAnimationFrame 节流，避免每帧都计算
  const scheduleUpdate = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(update);
  }, [update]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  return { containerRef, scheduleUpdate };
}

/**
 * 连线 hover 时亮度变化
 */
export function calculateEdgeLightness(zoom: number, hovered = false) {
  let lightnessLight = calculateZoomAdjustedValue(zoom, 0.84, 0.6);
  let lightnessDark = calculateZoomAdjustedValue(zoom, 0.42, 0.66);
  if (hovered) {
    lightnessLight = Math.max(0, lightnessLight - 0.3);
    lightnessDark = Math.min(1, lightnessDark + 0.2);
  }
  return {
    light: lightnessLight.toFixed(3),
    dark: lightnessDark.toFixed(3),
  };
}
