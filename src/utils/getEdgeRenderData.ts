import { getBezierPath, getSmoothStepPath, Position } from '@xyflow/react';

const HANDLE_SIZE = 20;
const EDGE_PADDING_BOTTOM = 130;
const EDGE_PADDING_X = 40;
const EDGE_BORDER_RADIUS = 16;

function isBackward(sourceX: number, targetX: number): boolean {
  return sourceX - HANDLE_SIZE > targetX;
}

interface EdgeSegment {
  path: string;
  labelX?: number;
  labelY?: number;
}

interface EdgeRenderData {
  segments: EdgeSegment[];
  labelPosition?: { x: number; y: number };
}

/**
 * 连线路径选择逻辑（来自 n8n）
 * - 正向：Bezier 曲线
 * - 反向：两段 SmoothStep 绕过节点底部
 */
export function getEdgeRenderData({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
}: {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
}): EdgeRenderData {
  // 正向：贝塞尔曲线
  if (!isBackward(sourceX, targetX)) {
    const [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    return {
      segments: [{ path, labelX, labelY }],
      labelPosition: { x: labelX, y: labelY },
    };
  }

  // 反向：两段 SmoothStep 绕过节点底部
  const midX = (sourceX + targetX) / 2;
  const midY = sourceY + EDGE_PADDING_BOTTOM;

  const [seg1] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX: midX,
    targetY: midY,
    sourcePosition,
    targetPosition: Position.Right,
    borderRadius: EDGE_BORDER_RADIUS,
    offset: EDGE_PADDING_X,
  });

  const [seg2] = getSmoothStepPath({
    sourceX: midX,
    sourceY: midY,
    targetX,
    targetY,
    sourcePosition: Position.Left,
    targetPosition,
    borderRadius: EDGE_BORDER_RADIUS,
    offset: EDGE_PADDING_X,
  });

  return {
    segments: [{ path: seg1 }, { path: seg2 }],
    labelPosition: { x: midX, y: midY },
  };
}
