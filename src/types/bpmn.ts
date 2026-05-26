export type BpmnNodeType = 'startEvent' | 'endEvent' | 'userTask' | 'exclusiveGateway' | 'parallelGateway' | 'inclusiveGateway';

export interface BpmnNodeData {
  label: string;
  type: BpmnNodeType;
  [key: string]: unknown;
}

export interface BpmnEdgeData {
  conditionName?: string;
  conditionExpression?: string;
  isRejectFlow?: boolean;
  [key: string]: unknown;
}

export interface ParsedFlowNode {
  id: string;
  name: string;
  type: BpmnNodeType;
}

export interface ParsedFlowEdge {
  sourceId: string;
  targetId: string;
}

export interface ParsedFlow {
  nodes: ParsedFlowNode[];
  edges: ParsedFlowEdge[];
}

export interface DslRoute {
  label: string;
  steps: string[];
}

export interface DslBranch {
  label: string;
  routes: DslRoute[];
}

export interface DslProcess {
  name: string;
  branches: DslBranch[];
}

export interface ConditionItem {
  id: string;
  name: string;
  expression: string;
}
