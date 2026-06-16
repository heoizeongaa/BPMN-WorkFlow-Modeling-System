import { getSmoothStepPath, Position } from '@xyflow/react';

interface EdgeSegment {
  path: string;
  labelX?: number;
  labelY?: number;
}

interface EdgeRenderData {
  segments: EdgeSegment[];
  labelPosition?: { x: number; y: number };
}

const BACKWARD_OFFSET_Y = 60;   // 回环线距节点底部的距离
const BACKWARD_OFFSET_X = 15;   // 横向微偏移（避免多条回环线重叠）

/**
 * BPMN 连线路径逻辑
 * - 正向水平：纯直线
 * - 正向有高差：直角折线
 * - 反向（驳回）：走节点下方的直角回环线
 */
export function getEdgeRenderData({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  sourceNode,
  targetNode,
}: {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  sourceNode?: { position: { x: number; y: number }; height?: number };
  targetNode?: { position: { x: number; y: number }; height?: number };
}): EdgeRenderData {
  const dy = Math.abs(sourceY - targetY);
  const isBackward = sourceX > targetX + 20;

  // 正向水平直线
  if (dy < 20 && !isBackward) {
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    return {
      segments: [{ path: `M ${sourceX} ${sourceY} L ${targetX} ${targetY}` }],
      labelPosition: { x: midX, y: midY },
    };
  }

  // 正向有高度差：直角折线
  if (!isBackward) {
    const [path, labelX, labelY] = getSmoothStepPath({
      sourceX, sourceY, targetX, targetY,
      sourcePosition, targetPosition,
      borderRadius: 0, offset: 20,
    });
    return {
      segments: [{ path, labelX, labelY }],
      labelPosition: { x: labelX, y: labelY },
    };
  }

  // 反向（驳回线）：走节点下方的直角回环
  // 策略：从 source 右侧出发 → 右转 → 下降到节点下方 → 左转到 target 上方 → 下降到 target
  const srcH = sourceNode?.height || 60;
  const tgtH = targetNode?.height || 60;
  const srcBottom = (sourceNode?.position.y || sourceY) + srcH;
  const tgtTop = targetNode?.position.y || targetY;

  // 下降 Y：取 source 底部和 target 底部中较大的那个 + 偏移
  const dropY = Math.max(srcBottom, srcBottom) + BACKWARD_OFFSET_Y;

  // 横向偏移：让回环线稍微偏右，避免多条重叠
  const srcOutX = sourceX + BACKWARD_OFFSET_X;
  const tgtInX = targetX - BACKWARD_OFFSET_X;

  // 四段直角折线：
  // 1. source → 向右一小段
  // 2. 向下到 dropY
  // 3. 向左到 target 上方
  // 4. 向上到 target
  const segments: EdgeSegment[] = [];

  // 段1：source 向右
  segments.push({ path: `M ${sourceX} ${sourceY} L ${srcOutX} ${sourceY}` });
  // 段2：向下
  segments.push({ path: `M ${srcOutX} ${sourceY} L ${srcOutX} ${dropY}` });
  // 段3：向左到 target 上方
  segments.push({ path: `M ${srcOutX} ${dropY} L ${tgtInX} ${dropY}` });
  // 段4：向上到 target
  segments.push({ path: `M ${tgtInX} ${dropY} L ${tgtInX} ${tgtTop}` });
  // 段5：到 target 入口
  segments.push({ path: `M ${tgtInX} ${tgtTop} L ${targetX} ${targetY}` });

  // 标签位置：在回环底部中间
  const labelX = (srcOutX + tgtInX) / 2;
  const labelY = dropY + 15;

  return {
    segments,
    labelPosition: { x: labelX, y: labelY },
  };
}
