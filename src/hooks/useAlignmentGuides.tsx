import { useState, useCallback, useRef } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';
import type { BpmnNodeData } from '@/types/bpmn';

type DragHandler = (event: MouseEvent | TouchEvent, node: Node, nodes: Node[]) => void;

const SNAP_THRESHOLD = 5; // 吸附阈值（像素）
const GUIDE_COLOR = '#1890ff';

interface GuideLine {
  type: 'horizontal' | 'vertical';
  position: number; // y for horizontal, x for vertical
  start: number;
  end: number;
}

/**
 * 计算节点的关键对齐点
 */
function getNodeAlignPoints(node: Node<BpmnNodeData>) {
  const x = node.position.x;
  const y = node.position.y;
  const w = (node.style?.width as number) || 160;
  const h = (node.style?.height as number) || 60;

  return {
    centerX: x + w / 2,
    centerY: y + h / 2,
    left: x,
    right: x + w,
    top: y,
    bottom: y + h,
  };
}

/**
 * 对齐辅助线 + 吸附 Hook
 */
export function useAlignmentGuides() {
  const { getNodes, setNodes } = useReactFlow();
  const [guideLines, setGuideLines] = useState<GuideLine[]>([]);
  const dragStartRef = useRef<{ nodeId: string; startPos: { x: number; y: number } } | null>(null);

  const onNodeDragStart: DragHandler = useCallback((_event, node) => {
    dragStartRef.current = {
      nodeId: node.id,
      startPos: { ...node.position },
    };
  }, []);

  const onNodeDrag: DragHandler = useCallback((_event, draggedNode) => {
    const allNodes = getNodes().filter(n => n.id !== draggedNode.id) as Node<BpmnNodeData>[];
    const dragged = getNodeAlignPoints(draggedNode as Node<BpmnNodeData>);

    const guides: GuideLine[] = [];
    let snapX: number | null = null;
    let snapY: number | null = null;

    for (const other of allNodes) {
      const target = getNodeAlignPoints(other);

      // 水平对齐检测（centerY 对 centerY）
      if (Math.abs(dragged.centerY - target.centerY) < SNAP_THRESHOLD) {
        guides.push({
          type: 'horizontal',
          position: target.centerY,
          start: Math.min(dragged.left, target.left) - 20,
          end: Math.max(dragged.right, target.right) + 20,
        });
        snapY = target.centerY - ((draggedNode.style?.height as number) || 60) / 2;
      }

      // 水平对齐（top 对 top）
      if (Math.abs(dragged.top - target.top) < SNAP_THRESHOLD && Math.abs(dragged.centerY - target.centerY) >= SNAP_THRESHOLD) {
        guides.push({
          type: 'horizontal',
          position: target.top,
          start: Math.min(dragged.left, target.left) - 20,
          end: Math.max(dragged.right, target.right) + 20,
        });
        snapY = target.top;
      }

      // 水平对齐（bottom 对 bottom）
      if (Math.abs(dragged.bottom - target.bottom) < SNAP_THRESHOLD && Math.abs(dragged.centerY - target.centerY) >= SNAP_THRESHOLD) {
        guides.push({
          type: 'horizontal',
          position: target.bottom,
          start: Math.min(dragged.left, target.left) - 20,
          end: Math.max(dragged.right, target.right) + 20,
        });
        snapY = target.bottom - ((draggedNode.style?.height as number) || 60);
      }

      // 垂直对齐检测（centerX 对 centerX）
      if (Math.abs(dragged.centerX - target.centerX) < SNAP_THRESHOLD) {
        guides.push({
          type: 'vertical',
          position: target.centerX,
          start: Math.min(dragged.top, target.top) - 20,
          end: Math.max(dragged.bottom, target.bottom) + 20,
        });
        snapX = target.centerX - ((draggedNode.style?.width as number) || 160) / 2;
      }

      // 垂直对齐（left 对 left）
      if (Math.abs(dragged.left - target.left) < SNAP_THRESHOLD && Math.abs(dragged.centerX - target.centerX) >= SNAP_THRESHOLD) {
        guides.push({
          type: 'vertical',
          position: target.left,
          start: Math.min(dragged.top, target.top) - 20,
          end: Math.max(dragged.bottom, target.bottom) + 20,
        });
        snapX = target.left;
      }

      // 垂直对齐（right 对 right）
      if (Math.abs(dragged.right - target.right) < SNAP_THRESHOLD && Math.abs(dragged.centerX - target.centerX) >= SNAP_THRESHOLD) {
        guides.push({
          type: 'vertical',
          position: target.right,
          start: Math.min(dragged.top, target.top) - 20,
          end: Math.max(dragged.bottom, target.bottom) + 20,
        });
        snapX = target.right - ((draggedNode.style?.width as number) || 160);
      }
    }

    setGuideLines(guides);

    // 吸附到对齐位置
    if (snapX !== null || snapY !== null) {
      setNodes(nodes =>
        nodes.map(n => {
          if (n.id !== draggedNode.id) return n;
          return {
            ...n,
            position: {
              x: snapX !== null ? snapX : n.position.x,
              y: snapY !== null ? snapY : n.position.y,
            },
          };
        }),
      );
    }
  }, [getNodes, setNodes]);

  const onNodeDragStop: DragHandler = useCallback((_event, draggedNode) => {
    // 松手后做最终对齐，防止 snapToGrid 或 React Flow 内部逻辑导致位置漂移
    requestAnimationFrame(() => {
      const allNodes = getNodes().filter(n => n.id !== draggedNode.id) as Node<BpmnNodeData>[];
      const current = getNodes().find(n => n.id === draggedNode.id) as Node<BpmnNodeData> | undefined;
      if (!current) return;

      const dragged = getNodeAlignPoints(current);
      let snapX: number | null = null;
      let snapY: number | null = null;

      for (const other of allNodes) {
        const target = getNodeAlignPoints(other);

        // 水平对齐（centerY）
        if (Math.abs(dragged.centerY - target.centerY) < SNAP_THRESHOLD) {
          snapY = target.centerY - ((current.style?.height as number) || 60) / 2;
        }
        // 水平对齐（top）
        if (Math.abs(dragged.top - target.top) < SNAP_THRESHOLD) {
          snapY = target.top;
        }
        // 水平对齐（bottom）
        if (Math.abs(dragged.bottom - target.bottom) < SNAP_THRESHOLD) {
          snapY = target.bottom - ((current.style?.height as number) || 60);
        }

        // 垂直对齐（centerX）
        if (Math.abs(dragged.centerX - target.centerX) < SNAP_THRESHOLD) {
          snapX = target.centerX - ((current.style?.width as number) || 160) / 2;
        }
        // 垂直对齐（left）
        if (Math.abs(dragged.left - target.left) < SNAP_THRESHOLD) {
          snapX = target.left;
        }
        // 垂直对齐（right）
        if (Math.abs(dragged.right - target.right) < SNAP_THRESHOLD) {
          snapX = target.right - ((current.style?.width as number) || 160);
        }
      }

      if (snapX !== null || snapY !== null) {
        setNodes(nodes =>
          nodes.map(n => {
            if (n.id !== draggedNode.id) return n;
            return {
              ...n,
              position: {
                x: snapX !== null ? snapX : n.position.x,
                y: snapY !== null ? snapY : n.position.y,
              },
            };
          }),
        );
      }
    });

    setGuideLines([]);
    dragStartRef.current = null;
  }, [getNodes, setNodes]);

  return {
    guideLines,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  };
}

/**
 * 辅助线渲染组件（支持视口坐标变换）
 */
export function AlignmentGuidesOverlay({
  guideLines,
  viewport,
}: {
  guideLines: GuideLine[];
  viewport: { x: number; y: number; zoom: number };
}) {
  if (guideLines.length === 0) return null;

  const { x: vx, y: vy, zoom } = viewport;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100,
        overflow: 'visible',
      }}
    >
      <g transform={`translate(${vx}, ${vy}) scale(${zoom})`}>
        {guideLines.map((guide, i) => {
          if (guide.type === 'horizontal') {
            return (
              <line
                key={`h-${i}`}
                x1={guide.start}
                y1={guide.position}
                x2={guide.end}
                y2={guide.position}
                stroke={GUIDE_COLOR}
                strokeWidth={1 / zoom}
                strokeDasharray={`${4 / zoom},${3 / zoom}`}
                opacity={0.6}
              />
            );
          }
          return (
            <line
              key={`v-${i}`}
              x1={guide.position}
              y1={guide.start}
              x2={guide.position}
              y2={guide.end}
              stroke={GUIDE_COLOR}
              strokeWidth={1 / zoom}
              strokeDasharray={`${4 / zoom},${3 / zoom}`}
              opacity={0.6}
            />
          );
        })}
      </g>
    </svg>
  );
}
