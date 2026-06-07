# BPMN 画布 UI 升级：设计理念 + 技术方案

## 你要理解的核心问题

我们的 BPMN 项目画布"能用但不好看"。目标是**对标 n8n 的画布体验** —— 不是抄它的代码，而是理解它**为什么好看、好用在哪里**，然后用我们自己的 React 技术栈达到同样的质感。

n8n 的画布在 `F:\Code\n8n`，你需要打开它、实际操作它、感受它，然后带着这些感受回来改我们的项目。

---

## 第一步：去 n8n 里体验（必做）

先在 `F:\Code\n8n` 运行 `npm run dev`，然后亲手做以下操作，**用身体记住感受**：

1. **画几个节点，连线，然后缩放画布** —— 特别注意缩放到 0.3x 时，节点边框和连线是否还能清晰分辨。这就是缩放自适应的全部意义
2. **选中一个节点** —— 看那个 box-shadow 光晕效果，不是换颜色，是"被聚光灯照亮"
3. **hover 一个节点** —— 看 Handle 是怎么从无到有"弹"出来的（scale(0) → scale(1)）
4. **hover 一条连线，然后快速移开** —— 感受那 600ms 的"粘滞感"，效果不会立即消失
5. **拖拽画布** —— 看小地图怎么淡入，停下来后看它怎么 1 秒后淡出
6. **如果能触发运行状态** —— 观察节点周围的旋转渐变光圈，那是整个画布最亮的特效

带着这些感受回来，然后进入下面的技术方案。

---

## 第二步：我心目中的最终效果（7 个设计理念）

### 理念 1：画布应该有"呼吸感"

现在的画布是死的 —— 节点像贴纸一样贴在画布上，线条一动不动。

**目标状态：**
- 节点应该是"浮"在画布上的实体：极淡的阴影（`0 2px 8px rgba(0,0,0,0.06)`），细微但存在的半透明边框（`oklch` 10% 透明度），让它有立体感
- 缩放时视觉重量保持一致：边框透明度随 zoom 动态变化（近看时 0.1 极淡，远看时 0.7 加实），确保任何缩放比例都能看清节点边界
- 连线亮度也随缩放变化：近看时浅灰，远看时深灰，用 gamma 校正插值保证感知平滑

**缩放自适应数值参考**（来源：n8n 的 `useZoomAdjustedValues.ts`）：

| 属性 | zoom=1.0（默认） | zoom=0.2（最小） | 插值公式 |
|------|------|------|------|
| 节点边框透明度（亮色） | 0.1 | 0.7 | `base + pow(t, 2.2) * (max - base)` |
| 连线亮度（亮色） | 0.84 | 0.6 | 同上 |
| Handle 亮度（亮色） | 0.68 | 0.3 | 同上 |
| hover 时连线变暗 | -30% | -30% | `Math.max(0, lightness - 0.3)` |

插值不是线性的，gamma=2.2 让变化在感知上均匀，不会在某个缩放级别突然跳变。

---

### 理念 2：节点应该有"状态语义"

现在节点只有两种状态：普通 和 selected（变蓝）。目标是完整的状态语言：

| 状态 | 视觉效果 | 目的 |
|------|------|------|
| **selected** | box-shadow 光晕（`0 0 0 6px hsla(220,47%,30%,0.1)`）| "被聚光灯照亮"，不是换颜色 |
| **success** | 绿色边框，2px 加粗 | "这步成功了" |
| **error** | 红色边框 | "这步出错了" |
| **running** | 边框消失，旋转渐变光圈（1.5s/圈，橙红色）| **n8n 最标志性的特效**，能量在节点周围流动 |
| **waiting** | 同样的光圈，但 4.5s/圈（慢 3 倍）| "在等" |
| **disabled** | 灰色边框，整体变暗 | "不可用" |

**running 动画的实现原理**（CSS Houdini，可直接用在 React 的 CSS 中）：

```css
/* 注册一个可动画的自定义属性 */
@property --node--gradient-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
}

/* 用 ::after 伪元素画旋转渐变边框 */
.running::after,
.waiting::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 14px;
    z-index: -1;
    background: conic-gradient(
        from var(--node--gradient-angle),
        rgba(255, 109, 90, 1),          /* 实色段开始 */
        rgba(255, 109, 90, 1) 20%,      /* 实色段结束 */
        rgba(255, 109, 90, 0.2) 35%,    /* 透明段开始 */
        rgba(255, 109, 90, 0.2) 65%,    /* 透明段结束 */
        rgba(255, 109, 90, 1) 90%,      /* 实色段开始 */
        rgba(255, 109, 90, 1)           /* 实色段结束 */
    );
}

.running::after {
    animation: border-rotate 1.5s linear infinite;
}
.waiting::after {
    animation: border-rotate 4.5s linear infinite;
}

@keyframes border-rotate {
    from { --node--gradient-angle: 0deg; }
    to   { --node--gradient-angle: 360deg; }
}
```

运行态节点的 `border` 本身要设为 `transparent`，由 `::after` 的 conic-gradient 接管视觉。

---

### 理念 3：Handle 应该有"出现的仪式感"

现在 Handle 只是 `opacity: 0 → 1`。目标是从 `scale(0)` 弹性放大到 `scale(1)`，配合 opacity，像节点在说"嘿，可以连接我了"：

```css
.react-flow__handle {
    opacity: 0;
    transform: scale(0);
    transition: opacity 0.2s ease, transform 0.2s ease;
    transform-origin: center;
}
.react-flow__node:hover .react-flow__handle {
    opacity: 1;
    transform: scale(1);
}
```

另外 Handle 大小也要做缩放补偿：`calc(16px * var(--canvas-zoom-compensation-factor, 1))`，确保远看时不会变成看不见的小点。

---

### 理念 4：连线应该有"路径智慧"

现在所有连线都用 `getSmoothStepPath`（直角折线）。目标：

- **正向连线**（target 在 source 右侧）：用 `getBezierPath`（贝塞尔曲线），弧线更优雅
- **反向连线**（target 在 source 左侧，形成环路）：拆成两段 `getSmoothStepPath`，第一段从 source 往下走 130px 到中间点，第二段折回 target，borderRadius=16 圆角过渡，避免和节点重叠

**连线 hover 延迟**：鼠标离开后效果持续 600ms 才淡出（防工具栏闪烁），这是"高级感"的关键细节。

---

### 理念 5：小地图应该有"出现的时机"

现在小地图永远显示。目标：默认隐藏，拖拽画布时淡入（0.3s opacity transition），停止拖拽后 1 秒自动淡出。鼠标悬停在小地图上时保持显示，离开后重新倒计时。

目的：减少视觉噪音，把屏幕空间留给画布本身。

---

### 理念 6：所有颜色应该有"单一来源"

现在颜色散落在各组件的 inline style 里，改一个蓝色要找 10 个文件。目标：所有颜色定义为 CSS 自定义属性，在一个地方改就能全局生效。这不仅是代码整洁问题，更是暗色模式的基础。

---

### 理念 7：暗色模式（可选，有它才算完整）

有了 Design Token 系统后，暗色模式只需在 `[data-theme='dark']` 下覆盖颜色变量：深色背景 `#141414`、浅色文字 `#e8e8e8`、暗色画布 `#1a1a1a`，连线和 Handle 亮度值反转。支持 `prefers-color-scheme` 自动跟随系统主题。

---

## 第三步：技术参考（n8n 源码提取）

以下是 n8n 中每个理念的具体实现，供你在实现时参考。n8n 源码路径：`F:\Code\n8n`

### 3.1 缩放自适应核心函数

**来源**: `n8n/packages/frontend/editor-ui/src/features/workflows/canvas/composables/useZoomAdjustedValues.ts`

```ts
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

// 连线亮度计算（支持 hover 加深）
function calculateEdgeLightness(hovered = false) {
    const zoom = viewport.zoom;
    let lightnessLight = calculateZoomAdjustedValue(zoom, 0.84, 0.6);
    let lightnessDark = calculateZoomAdjustedValue(zoom, 0.42, 0.66);
    if (hovered) {
        lightnessLight = Math.max(0, lightnessLight - 0.3);
        lightnessDark = Math.min(1, lightnessDark + 0.2);
    }
    return { light: lightnessLight.toFixed(3), dark: lightnessDark.toFixed(3) };
}

// 节点边框透明度
function calculateNodeBorderOpacity() {
    const zoom = viewport.zoom;
    return {
        light: calculateZoomAdjustedValue(zoom, 0.1, 0.7).toFixed(3),
        dark: calculateZoomAdjustedValue(zoom, 0.2, 0.7).toFixed(3),
    };
}

// Handle 亮度
function calculateHandleLightness() {
    const zoom = viewport.zoom;
    return {
        light: calculateZoomAdjustedValue(zoom, 0.68, 0.3).toFixed(3),
        dark: calculateZoomAdjustedValue(zoom, 0.5, 0.7).toFixed(3),
    };
}
```

**React 实现要点**：n8n 是 Vue composable，你需要改写为 React Hook。关键问题是如何在 zoom 变化时更新值而不触发过多重渲染。推荐方案：
- 用 `useOnViewportChange`（@xyflow/react 提供）监听 viewport 变化
- 将计算值写入 CSS 自定义属性（`style` 属性），而非 React state
- 这样 zoom 变化只修改 DOM style，不触发 React 组件重渲染

### 3.2 节点边框的 oklch + light-dark 模式

**来源**: `n8n/.../render-types/CanvasNodeDefault.vue`

```css
.node {
    border: 1.5px solid
        oklch(from #000 l c h / var(--canvas-node--border--opacity-light, 0.1));
    /* 暗色模式下用：oklch(from #fff l c h / var(--canvas-node--border--opacity-dark, 0.15)) */
}
```

`oklch(from #000 l c h / 0.1)` 的意思是：取 `#000` 的亮度/色度/色相，把透明度设为 0.1。这样边框颜色会随主题自动适配。

### 3.3 连线路径选择逻辑

**来源**: `n8n/.../edges/utils/getEdgeRenderData.ts`

```ts
const HANDLE_SIZE = 20;
const EDGE_PADDING_BOTTOM = 130;
const EDGE_PADDING_X = 40;
const EDGE_BORDER_RADIUS = 16;

function isBackward(sourceX, targetX) {
    return sourceX - HANDLE_SIZE > targetX;
}

function getEdgeRenderData({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition }) {
    // 正向：贝塞尔曲线
    if (!isBackward(sourceX, targetX)) {
        return { segments: [getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })] };
    }

    // 反向：两段 SmoothStep 绕过节点
    const midX = (sourceX + targetX) / 2;
    const midY = sourceY + EDGE_PADDING_BOTTOM;
    const seg1 = getSmoothStepPath({
        sourceX, sourceY, targetX: midX, targetY: midY,
        sourcePosition, targetPosition: Position.Right,
        borderRadius: EDGE_BORDER_RADIUS, offset: EDGE_PADDING_X,
    });
    const seg2 = getSmoothStepPath({
        sourceX: midX, sourceY: midY, targetX, targetY,
        sourcePosition: Position.Left, targetPosition,
        borderRadius: EDGE_BORDER_RADIUS, offset: EDGE_PADDING_X,
    });
    return { segments: [seg1, seg2], labelPosition: [midX, midY] };
}
```

### 3.4 连线 hover 延迟逻辑

**来源**: `n8n/.../edges/CanvasEdge.vue`

```ts
const delayedHovered = ref(false);
const HOVER_DELAY = 600;

watch(() => props.hovered, (isHovered) => {
    if (isHovered) {
        clearTimeout(timeout);
        delayedHovered.value = true;
    } else {
        timeout = setTimeout(() => delayedHovered.value = false, HOVER_DELAY);
    }
});
```

### 3.5 连线颜色用 oklch 随缩放变化

```css
.edge {
    stroke: light-dark(
        oklch(var(--canvas-edge--color--lightness--light) 0 0),
        oklch(var(--canvas-edge--color--lightness--dark) 0 0)
    );
    stroke-width: calc(2 * var(--canvas-zoom-compensation-factor, 1));
}
```

### 3.6 小地图淡入淡出

**来源**: `n8n/.../canvas/components/Canvas.vue`

```ts
const minimapVisibilityDelay = 1000;
const isMinimapVisible = ref(false);
let hideTimeout = null;

watch(isPaneMoving, (moving) => {
    if (moving) {
        clearTimeout(hideTimeout);
        isMinimapVisible.value = true;
    } else {
        hideTimeout = setTimeout(() => isMinimapVisible.value = false, minimapVisibilityDelay);
    }
});

// 鼠标悬停在小地图上时保持显示
onMinimapMouseEnter = () => { clearTimeout(hideTimeout); isMinimapVisible.value = true; };
onMinimapMouseLeave = () => { hideTimeout = setTimeout(() => isMinimapVisible.value = false, minimapVisibilityDelay); };
```

```css
/* 淡入淡出动画 */
.minimap-enter-active, .minimap-leave-active { transition: opacity 0.3s ease; }
.minimap-enter-from, .minimap-leave-to { opacity: 0; }
```

### 3.7 Handle 缩放补偿

**来源**: `n8n/.../handles/CanvasHandleRenderer.vue`

```css
.react-flow__handle {
    width: calc(16px * var(--canvas-zoom-compensation-factor, 1));
    height: calc(16px * var(--canvas-zoom-compensation-factor, 1));
    border: 0;
    background: transparent;
}
```

---

## 第四步：当前项目信息

- **项目路径**：`F:\Code\BPMN-WorkFlow-Modeling-System`
- **技术栈**：React 18 + TypeScript + Vite + @xyflow/react + Zustand + ELK.js
- **画布引擎**：@xyflow/react (React Flow)，和 n8n 的 @vue-flow/core 同源，API 几乎一致

**需要修改的文件清单**：

| 文件 | 改动内容 |
|------|------|
| `src/index.css` | Design Token 系统（CSS 变量）+ 暗色主题 + Handle/Edge 动画 |
| `src/components/BpmnCanvas.tsx` | 缩放自适应注入 + 小地图淡入淡出 + 连线配置 |
| `src/components/nodes/UserTaskNode.tsx` | 状态语义 + oklch 边框 + CSS 变量 |
| `src/components/nodes/StartEventNode.tsx` | 同上 |
| `src/components/nodes/EndEventNode.tsx` | 同上 |
| `src/components/nodes/ExclusiveGatewayNode.tsx` | 同上（SVG 菱形） |
| `src/components/nodes/ParallelGatewayNode.tsx` | 同上（SVG 菱形） |
| `src/components/edges/BpmnEdge.tsx` | Bezier/SmoothStep 路径选择 + hover 延迟 + oklch 颜色 |
| `src/components/Toolbar.tsx` | 暗色模式切换按钮 + CSS 变量 |
| `src/App.tsx` | 主题状态管理 + data-theme 属性 |
| `src/hooks/useZoomAdjustedValues.ts` | **新建**，缩放自适应 React Hook |
| `src/utils/getEdgeRenderData.ts` | **新建**，连线路径选择逻辑 |

**绝对不能动的东西**：
- `src/store/bpmnStore.ts` — Zustand store 的数据操作
- `src/utils/dslParser.ts` / `dslConverter.ts` — DSL 解析逻辑
- `src/utils/bpmnExporter.ts` — BPMN XML 导出逻辑
- `src/utils/layoutEngine.ts` — ELK 自动布局逻辑
- `src/components/panels/` — 左侧面板组件
- 任何业务逻辑

---

## 第五步：执行顺序

按以下顺序执行，每步完成后 `npm run dev` 验证：

### Step 1：Design Token 系统（基础，后续全部依赖它）

在 `src/index.css` 顶部新建 `:root` 块，把所有硬编码颜色抽成 CSS 变量。然后把所有组件 inline style 中的颜色替换为 `var(--xxx)` 引用。

```css
:root {
    --color-primary: #1890ff;
    --color-primary-bg: #e6f7ff;
    --color-success: #52c41a;
    --color-success-bg: #f6ffed;
    --color-danger: #ff4d4f;
    --color-danger-bg: #fff1f0;
    --color-warning: #faad14;
    --color-warning-bg: #fffbe6;
    --color-info: #2f54eb;
    --color-info-bg: #f0f5ff;
    --color-text: #333;
    --color-text-secondary: #666;
    --color-text-muted: #999;
    --color-text-disabled: #bfbfbf;
    --color-border: #e8e8e8;
    --color-bg-page: #f0f2f5;
    --color-bg-canvas: #fafafa;
    --color-bg-surface: #fff;

    --canvas--dot--color: #e8e8e8;
    --canvas--color--selected-transparent: hsla(220, 47%, 30%, 0.1);

    --node--color--background: var(--color-bg-surface);
    --node--border-width: 1.5px;
    --node--border-radius: 12px;
    --node--shadow: 0 2px 6px rgba(0,0,0,0.08);
    --node--shadow--selected: 0 0 0 3px var(--canvas--color--selected-transparent);

    --handle--size: 8px;
    --handle--color: #555;

    --edge--color: #555;
    --edge--color--selected: var(--color-primary);
    --edge--color--reject: var(--color-danger);

    --transition-fast: 0.15s ease;
    --transition-base: 0.2s ease;
    --transition-slow: 0.3s ease;
}
```

验证点：视觉表现不变，但所有颜色通过 CSS 变量控制。

### Step 2：节点样式升级（理念 1 + 理念 2）

修改所有 5 个节点组件：
- 圆角 8px → `var(--node--border-radius)` (12px)
- selected 状态：换颜色 → box-shadow 光晕
- 添加 oklch 半透明边框
- 添加 hover 微上浮效果
- Handle 尺寸 → `var(--handle--size)` (8px)，加 2px 白色边框

### Step 3：缩放自适应（理念 1 的核心，最难的一步）

- 新建 `src/hooks/useZoomAdjustedValues.ts`，把 n8n 的 composable 改写为 React Hook
- 在 `BpmnCanvas.tsx` 中通过 CSS 变量注入值（不走 React state，避免卡顿）
- 节点边框、连线颜色、Handle 大小都随 zoom 动态变化

**性能关键**：用 CSS 变量注入，不用 React state。zoom 变化只修改 DOM style 属性，不触发组件重渲染。

### Step 4：动画边框（理念 2 的视觉核心）

在 `src/index.css` 中添加 `@property --node--gradient-angle` 和 `conic-gradient` 动画。节点组件根据 `data.status` 条件性添加 className（如 `bpmn-node-running`）。运行态节点 border 设为 transparent。

### Step 5：小地图淡入淡出（理念 5）

在 `BpmnCanvas.tsx` 中监听 `onMoveStart`/`onMoveEnd`，用 1000ms timeout 控制显隐，CSS transition 控制 opacity。鼠标悬停小地图时 clearTimeout 保持显示。

### Step 6：连线渲染优化（理念 4）

- 新建 `src/utils/getEdgeRenderData.ts`，实现正向 Bezier + 反向双段 SmoothStep
- 重写 `BpmnEdge.tsx`：多段 path 渲染 + 600ms hover 延迟 + oklch 颜色 + 缩放自适应

### Step 7：暗色模式（理念 7，可选）

在 `src/index.css` 中添加 `[data-theme='dark']` 块覆盖所有颜色变量。在 `App.tsx` 中添加主题状态管理，在 `Toolbar.tsx` 中添加切换按钮。

---

## 完成标准

当你做完之后，一个不了解这个项目的人打开画布，应该会觉得：
1. **精致** —— 颜色和谐、间距均匀、层次分明
2. **缩放流畅** —— 任何缩放级别下节点和连线都清晰可辨
3. **交互有反馈** —— hover 有动画、选中有光晕、拖拽时小地图出现
4. **整体像 n8n** —— 不是抄，而是达到了同样的视觉水准
