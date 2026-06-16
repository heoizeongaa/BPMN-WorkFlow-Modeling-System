import type { Node, Edge } from '@xyflow/react';
import type { BpmnNodeData, BpmnEdgeData } from '@/types/bpmn';

export type BpmnExportVersion = 'bpmn-io' | 'activiti';

/** bpmn.io / Camunda 风格尺寸 */
const DIMENSIONS_BPMN_IO: Record<string, { width: number; height: number }> = {
  startEvent: { width: 40, height: 40 },
  endEvent: { width: 40, height: 40 },
  userTask: { width: 160, height: 60 },
  serviceTask: { width: 160, height: 60 },
  scriptTask: { width: 160, height: 60 },
  sendTask: { width: 160, height: 60 },
  receiveTask: { width: 160, height: 60 },
  exclusiveGateway: { width: 50, height: 50 },
  parallelGateway: { width: 50, height: 50 },
  inclusiveGateway: { width: 50, height: 50 },
  subProcess: { width: 200, height: 120 },
};

/** Activiti 风格尺寸 */
const DIMENSIONS_ACTIVITI: Record<string, { width: number; height: number }> = {
  startEvent: { width: 30, height: 30 },
  endEvent: { width: 28, height: 28 },
  userTask: { width: 100, height: 80 },
  serviceTask: { width: 100, height: 80 },
  scriptTask: { width: 100, height: 80 },
  sendTask: { width: 100, height: 80 },
  receiveTask: { width: 100, height: 80 },
  exclusiveGateway: { width: 40, height: 40 },
  parallelGateway: { width: 40, height: 40 },
  inclusiveGateway: { width: 40, height: 40 },
  subProcess: { width: 200, height: 120 },
};

function getNodeDimensions(type: string, version: BpmnExportVersion): { width: number; height: number } {
  const map = version === 'activiti' ? DIMENSIONS_ACTIVITI : DIMENSIONS_BPMN_IO;
  return map[type] || { width: 100, height: 80 };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getBpmnElementType(type: string): string {
  switch (type) {
    case 'startEvent': return 'startEvent';
    case 'endEvent': return 'endEvent';
    case 'userTask': return 'userTask';
    case 'serviceTask': return 'serviceTask';
    case 'scriptTask': return 'scriptTask';
    case 'sendTask': return 'sendTask';
    case 'receiveTask': return 'receiveTask';
    case 'exclusiveGateway': return 'exclusiveGateway';
    case 'parallelGateway': return 'parallelGateway';
    case 'inclusiveGateway': return 'inclusiveGateway';
    case 'subProcess': return 'subProcess';
    default: return 'userTask';
  }
}

function isGatewayType(type: string): boolean {
  return type === 'exclusiveGateway' || type === 'parallelGateway' || type === 'inclusiveGateway';
}

/**
 * 生成 Activiti 格式的 BPMN XML
 * 对标文件 2：无前缀标签、omgdc/omgdi、CDATA 条件、网关无 name
 */
function exportActivitiFormat(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<BpmnEdgeData>[],
  processName: string,
): string {
  const processId = processName.replace(/[^a-zA-Z0-9]/g, '_');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" ';
  xml += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
  xml += 'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ';
  xml += 'xmlns:activiti="http://activiti.org/bpmn" ';
  xml += 'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ';
  xml += 'xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" ';
  xml += 'xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" ';
  xml += 'typeLanguage="http://www.w3.org/2001/XMLSchema" ';
  xml += 'expressionLanguage="http://www.w3.org/1999/XPath" ';
  xml += 'targetNamespace="http://www.activiti.org/processdef">\n';

  // Process 元素（无 collaboration）
  xml += `  <process id="${escapeXml(processId)}" name="${escapeXml(processName)}" isExecutable="true">\n`;
  xml += `    <documentation>${escapeXml(processName)}</documentation>\n`;

  // 节点定义
  for (const node of nodes) {
    const elementType = getBpmnElementType(node.data.type);
    const label = node.data.label || '';

    // 网关不输出 name
    if (isGatewayType(node.data.type)) {
      xml += `    <${elementType} id="${escapeXml(node.id)}"></${elementType}>\n`;
    } else if (node.data.type === 'startEvent') {
      xml += `    <startEvent id="${escapeXml(node.id)}" name="${escapeXml(label)}"></startEvent>\n`;
    } else if (node.data.type === 'endEvent') {
      xml += `    <endEvent id="${escapeXml(node.id)}"></endEvent>\n`;
    } else {
      xml += `    <${elementType} id="${escapeXml(node.id)}" name="${escapeXml(label)}"></${elementType}>\n`;
    }
  }

  // 连线定义（带条件的用 CDATA）
  for (const edge of edges) {
    const nameAttr = edge.data?.conditionName ? ` name="${escapeXml(edge.data.conditionName)}"` : '';
    xml += `    <sequenceFlow id="${escapeXml(edge.id)}" sourceRef="${escapeXml(edge.source)}" targetRef="${escapeXml(edge.target)}"${nameAttr}`;

    if (edge.data?.conditionExpression) {
      xml += `>\n`;
      xml += `      <conditionExpression xsi:type="tFormalExpression"><![CDATA[${edge.data.conditionExpression}]]></conditionExpression>\n`;
      xml += `    </sequenceFlow>\n`;
    } else {
      xml += `></sequenceFlow>\n`;
    }
  }

  xml += '  </process>\n';

  // Diagram Interchange
  xml += `  <bpmndi:BPMNDiagram id="BPMNDiagram_${escapeXml(processId)}">\n`;
  xml += `    <bpmndi:BPMNPlane bpmnElement="${escapeXml(processId)}" id="BPMNPlane_${escapeXml(processId)}">\n`;

  // Shape 定义
  for (const node of nodes) {
    const dims = getNodeDimensions(node.data.type, 'activiti');
    const width = node.style?.width || dims.width;
    const height = node.style?.height || dims.height;
    const x = node.position.x;
    const y = node.position.y;

    xml += `      <bpmndi:BPMNShape bpmnElement="${escapeXml(node.id)}" id="BPMNShape_${escapeXml(node.id)}">\n`;
    xml += `        <omgdc:Bounds height="${height}.0" width="${width}.0" x="${x}.0" y="${y}.0"></omgdc:Bounds>\n`;
    xml += `      </bpmndi:BPMNShape>\n`;
  }

  // Edge 定义
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    xml += `      <bpmndi:BPMNEdge bpmnElement="${escapeXml(edge.id)}" id="BPMNEdge_${escapeXml(edge.id)}">\n`;

    if (sourceNode && targetNode) {
      const srcDims = getNodeDimensions(sourceNode.data.type, 'activiti');
      const tgtDims = getNodeDimensions(targetNode.data.type, 'activiti');
      const srcW = sourceNode.style?.width || srcDims.width;
      const srcH = sourceNode.style?.height || srcDims.height;
      const tgtH = targetNode.style?.height || tgtDims.height;

      const sx = sourceNode.position.x + (srcW as number);
      const sy = sourceNode.position.y + (srcH as number) / 2;
      const tx = targetNode.position.x;
      const ty = targetNode.position.y + (tgtH as number) / 2;

      xml += `        <omgdi:waypoint x="${sx}.0" y="${sy}.0"></omgdi:waypoint>\n`;
      if (Math.abs(sy - ty) > 2) {
        const midX = Math.round((sx + tx) / 2);
        xml += `        <omgdi:waypoint x="${midX}.0" y="${sy}.0"></omgdi:waypoint>\n`;
        xml += `        <omgdi:waypoint x="${midX}.0" y="${ty}.0"></omgdi:waypoint>\n`;
      }
      xml += `        <omgdi:waypoint x="${tx}.0" y="${ty}.0"></omgdi:waypoint>\n`;
    }

    xml += `      </bpmndi:BPMNEdge>\n`;
  }

  xml += '    </bpmndi:BPMNPlane>\n';
  xml += '  </bpmndi:BPMNDiagram>\n';
  xml += '</definitions>\n';

  return xml;
}

/**
 * 生成 bpmn.io / Camunda 格式的 BPMN XML（原始版本）
 */
function exportBpmnIoFormat(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<BpmnEdgeData>[],
  processName: string,
): string {
  const processId = processName.replace(/[^a-zA-Z0-9]/g, '_');
  const collaborationId = `Collaboration_${processId}`;

  const participants = new Map<string, string>();
  nodes.forEach(n => {
    if (n.data.type === 'startEvent' || n.data.type === 'endEvent') {
      if (!participants.has('Participant_1')) {
        participants.set('Participant_1', processId);
      }
    }
  });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ';
  xml += 'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ';
  xml += 'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ';
  xml += 'xmlns:di="http://www.omg.org/spec/DD/20100524/DI" ';
  xml += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
  xml += 'id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">\n';

  xml += `  <bpmn:collaboration id="${escapeXml(collaborationId)}">\n`;
  for (const [participantId, procRef] of participants) {
    xml += `    <bpmn:participant id="${escapeXml(participantId)}" name="${escapeXml(processName)}" processRef="${escapeXml(procRef)}" />\n`;
  }
  xml += '  </bpmn:collaboration>\n';

  xml += `  <bpmn:process id="${escapeXml(processId)}" isExecutable="false">\n`;

  for (const node of nodes) {
    const elementType = getBpmnElementType(node.data.type);
    const label = node.data.label || node.data.type;
    xml += `    <bpmn:${elementType} id="${escapeXml(node.id)}" name="${escapeXml(label)}" />\n`;
  }

  for (const edge of edges) {
    xml += `    <bpmn:sequenceFlow id="${escapeXml(edge.id)}" sourceRef="${escapeXml(edge.source)}" targetRef="${escapeXml(edge.target)}"`;
    if (edge.data?.conditionExpression) {
      xml += `>\n`;
      xml += `      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(edge.data.conditionExpression)}</bpmn:conditionExpression>\n`;
      xml += `    </bpmn:sequenceFlow>\n`;
    } else {
      xml += ` />\n`;
    }
  }

  xml += '  </bpmn:process>\n';

  xml += '  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n';
  xml += `    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${escapeXml(collaborationId)}">\n`;

  for (const node of nodes) {
    const dims = getNodeDimensions(node.data.type, 'bpmn-io');
    const width = node.style?.width || dims.width;
    const height = node.style?.height || dims.height;
    const x = node.position.x;
    const y = node.position.y;

    xml += `      <bpmndi:BPMNShape id="${escapeXml(node.id)}_di" bpmnElement="${escapeXml(node.id)}">\n`;
    xml += `        <dc:Bounds x="${Math.round(x)}" y="${Math.round(y)}" width="${width}" height="${height}" />\n`;
    xml += `      </bpmndi:BPMNShape>\n`;
  }

  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    xml += `      <bpmndi:BPMNEdge id="${escapeXml(edge.id)}_di" bpmnElement="${escapeXml(edge.id)}">\n`;

    if (sourceNode && targetNode) {
      const srcDims = getNodeDimensions(sourceNode.data.type, 'bpmn-io');
      const tgtDims = getNodeDimensions(targetNode.data.type, 'bpmn-io');
      const srcW = sourceNode.style?.width || srcDims.width;
      const srcH = sourceNode.style?.height || srcDims.height;
      const tgtW = targetNode.style?.width || tgtDims.width;
      const tgtH = targetNode.style?.height || tgtDims.height;

      const sx = sourceNode.position.x + (srcW as number);
      const sy = sourceNode.position.y + (srcH as number) / 2;
      const tx = targetNode.position.x;
      const ty = targetNode.position.y + (tgtH as number) / 2;

      xml += `        <di:waypoint x="${Math.round(sx)}" y="${Math.round(sy)}" />\n`;
      if (Math.abs(sy - ty) > 2) {
        const midX = Math.round((sx + tx) / 2);
        xml += `        <di:waypoint x="${midX}" y="${Math.round(sy)}" />\n`;
        xml += `        <di:waypoint x="${midX}" y="${Math.round(ty)}" />\n`;
      }
      xml += `        <di:waypoint x="${Math.round(tx)}" y="${Math.round(ty)}" />\n`;
    }

    xml += `      </bpmndi:BPMNEdge>\n`;
  }

  xml += '    </bpmndi:BPMNPlane>\n';
  xml += '  </bpmndi:BPMNDiagram>\n';
  xml += '</bpmn:definitions>\n';

  return xml;
}

/**
 * 导出 BPMN XML（根据版本选择格式）
 */
export function exportToBpmnXml(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<BpmnEdgeData>[],
  processName: string = 'Process_1',
  version: BpmnExportVersion = 'activiti',
): string {
  if (version === 'activiti') {
    return exportActivitiFormat(nodes, edges, processName);
  }
  return exportBpmnIoFormat(nodes, edges, processName);
}
