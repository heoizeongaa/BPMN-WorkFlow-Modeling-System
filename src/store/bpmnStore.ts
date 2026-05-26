import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { NodeChange, EdgeChange, Node, Edge, Connection } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import type { BpmnNodeData, BpmnEdgeData, ConditionItem } from '@/types/bpmn';
import { parseDsl, dslToFlow } from '@/utils/dslParser';
import { applyInferenceRules } from '@/utils/inferenceEngine';
import { parsedFlowToReactFlow } from '@/utils/flowConverter';
import { layoutWithElk } from '@/utils/layoutEngine';

interface BpmnStore {
  nodes: Node<BpmnNodeData>[];
  edges: Edge<BpmnEdgeData>[];
  dslText: string;
  processName: string;
  conditions: ConditionItem[];
  isLayouting: boolean;

  setDslText: (text: string) => void;
  setProcessName: (name: string) => void;
  generateFromDsl: () => Promise<void>;
  onNodesChange: (changes: NodeChange<Node<BpmnNodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange<Edge<BpmnEdgeData>>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, label: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  addCondition: (name: string, expression: string) => void;
  removeCondition: (id: string) => void;
  assignConditionToEdge: (edgeId: string, conditionId: string) => void;
  relayout: () => Promise<void>;
}

const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  startEvent: { width: 40, height: 40 },
  endEvent: { width: 40, height: 40 },
  userTask: { width: 160, height: 60 },
  exclusiveGateway: { width: 50, height: 50 },
  parallelGateway: { width: 50, height: 50 },
  inclusiveGateway: { width: 50, height: 50 },
};

export const useBpmnStore = create<BpmnStore>((set, get) => ({
  nodes: [],
  edges: [],
  dslText: '',
  processName: 'Process_1',
  conditions: [],
  isLayouting: false,

  setDslText: (text) => set({ dslText: text }),
  setProcessName: (name) => set({ processName: name }),

  generateFromDsl: async () => {
    const { dslText, processName } = get();
    if (!dslText.trim()) return;

    const processes = parseDsl(dslText);
    let flow = dslToFlow(processes);
    flow = applyInferenceRules(flow);
    const { nodes, edges } = parsedFlowToReactFlow(flow);

    set({ isLayouting: true });
    try {
      const layouted = await layoutWithElk(nodes, edges);
      set({ nodes: layouted.nodes, edges: layouted.edges, isLayouting: false });
    } catch {
      set({ nodes, edges, isLayouting: false });
    }
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    const newEdge: Edge<BpmnEdgeData> = {
      id: `edge_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'bpmnEdge',
      data: {},
    };
    set({ edges: [...get().edges, newEdge] });
  },

  addNode: (type, label, position) => {
    const dims = NODE_DIMENSIONS[type] || NODE_DIMENSIONS.userTask;
    const newNode: Node<BpmnNodeData> = {
      id: `${type}_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      type,
      position,
      data: { label, type: type as BpmnNodeData['type'] },
      style: { width: dims.width, height: dims.height },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter(n => n.id !== id),
      edges: get().edges.filter(e => e.source !== id && e.target !== id),
    });
  },

  addCondition: (name, expression) => {
    const condition: ConditionItem = {
      id: `cond_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      name,
      expression,
    };
    set({ conditions: [...get().conditions, condition] });
  },

  removeCondition: (id) => {
    set({ conditions: get().conditions.filter(c => c.id !== id) });
  },

  assignConditionToEdge: (edgeId, conditionId) => {
    const condition = get().conditions.find(c => c.id === conditionId);
    if (!condition) return;
    set({
      edges: get().edges.map(e =>
        e.id === edgeId
          ? { ...e, data: { ...e.data, conditionName: condition.name, conditionExpression: condition.expression } }
          : e
      ),
    });
  },

  relayout: async () => {
    const { nodes, edges } = get();
    set({ isLayouting: true });
    try {
      const layouted = await layoutWithElk(nodes, edges);
      set({ nodes: layouted.nodes, edges: layouted.edges, isLayouting: false });
    } catch {
      set({ isLayouting: false });
    }
  },
}));
