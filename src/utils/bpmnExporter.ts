import type { Node, Edge } from '@xyflow/react';
import type { BpmnNodeData, BpmnEdgeData } from '@/types/bpmn';

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
    case 'exclusiveGateway': return 'exclusiveGateway';
    case 'parallelGateway': return 'parallelGateway';
    case 'inclusiveGateway': return 'inclusiveGateway';
    default: return 'userTask';
  }
}

function getShapeSymbol(type: string): string {
  switch (type) {
    case 'startEvent': return 'bpmn:start-event';
    case 'endEvent': return 'bpmn:end-event';
    case 'userTask': return 'bpmn:user-task';
    case 'exclusiveGateway': return 'bpmn:exclusive-gateway';
    case 'parallelGateway': return 'bpmn:parallel-gateway';
    case 'inclusiveGateway': return 'bpmn:inclusive-gateway';
    default: return 'bpmn:user-task';
  }
}

export function exportToBpmnXml(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<BpmnEdgeData>[],
  processName: string = 'Process_1'
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
    const width = node.style?.width || (node.data.type === 'userTask' ? 160 : node.data.type.includes('Gateway') ? 50 : 40);
    const height = node.style?.height || (node.data.type === 'userTask' ? 60 : node.data.type.includes('Gateway') ? 50 : 40);
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
      const srcW = sourceNode.style?.width || (sourceNode.data.type === 'userTask' ? 160 : sourceNode.data.type.includes('Gateway') ? 50 : 40);
      const srcH = sourceNode.style?.height || (sourceNode.data.type === 'userTask' ? 60 : sourceNode.data.type.includes('Gateway') ? 50 : 40);
      const tgtW = targetNode.style?.width || (targetNode.data.type === 'userTask' ? 160 : targetNode.data.type.includes('Gateway') ? 50 : 40);
      const tgtH = targetNode.style?.height || (targetNode.data.type === 'userTask' ? 60 : targetNode.data.type.includes('Gateway') ? 50 : 40);

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
