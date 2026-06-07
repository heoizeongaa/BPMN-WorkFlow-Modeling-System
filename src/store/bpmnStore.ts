import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { NodeChange, EdgeChange, Node, Edge, Connection } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import type { BpmnNodeData, BpmnEdgeData, ConditionItem } from '@/types/bpmn';
import type { AiConfig, AiMessage, AiParseStatus } from '@/types/ai';
import { parseDsl, dslToFlow } from '@/utils/dslParser';
import { applyInferenceRules } from '@/utils/inferenceEngine';
import { parsedFlowToReactFlow } from '@/utils/flowConverter';
import { layoutWithElk } from '@/utils/layoutEngine';
import { parseWithAi } from '@/services/aiParser';
import { structuredFlowWithConditions } from '@/utils/structuredFlowConverter';
import { loadAiConfig } from '@/services/aiConfig';

interface BpmnStore {
  nodes: Node<BpmnNodeData>[];
  edges: Edge<BpmnEdgeData>[];
  dslText: string;
  processName: string;
  conditions: ConditionItem[];
  isLayouting: boolean;

  // AI 状态
  aiConfig: AiConfig | null;
  aiStatus: AiParseStatus;
  aiMessages: AiMessage[];
  aiError: string | null;

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

  // AI actions
  setAiConfig: (config: AiConfig | null) => void;
  parseWithAiAction: (userInput: string) => Promise<void>;
  clearAiMessages: () => void;
}

const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
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

export const useBpmnStore = create<BpmnStore>((set, get) => ({
  nodes: [],
  edges: [],
  dslText: '',
  processName: 'Process_1',
  conditions: [],
  isLayouting: false,

  // AI 初始状态
  aiConfig: loadAiConfig(),
  aiStatus: 'idle' as AiParseStatus,
  aiMessages: [],
  aiError: null,

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

  setAiConfig: (config) => {
    set({ aiConfig: config });
  },

  parseWithAiAction: async (userInput: string) => {
    const { aiConfig, nodes, edges, processName } = get();
    if (!aiConfig) {
      set({ aiError: '请先配置 AI API Key', aiStatus: 'error' });
      return;
    }
    if (!userInput.trim()) return;

    // 构造已有流程上下文
    const existingFlow = nodes.length > 0
      ? JSON.stringify({
          processName,
          nodes: nodes.map(n => ({ id: n.id, type: n.data.type, label: n.data.label })),
          edges: edges.map(e => ({ source: e.source, target: e.target })),
        })
      : undefined;

    const userMsg: AiMessage = { role: 'user', content: userInput, timestamp: Date.now() };
    set(state => ({
      aiStatus: 'parsing',
      aiError: null,
      aiMessages: [...state.aiMessages, userMsg],
    }));

    const result = await parseWithAi(aiConfig, userInput, existingFlow);

    if (result.error || !result.flow) {
      const assistantMsg: AiMessage = {
        role: 'assistant',
        content: result.error || '解析失败',
        timestamp: Date.now(),
      };
      set(state => ({
        aiStatus: 'error',
        aiError: result.error || '解析失败',
        aiMessages: [...state.aiMessages, assistantMsg],
      }));
      return;
    }

    // 转换并渲染
    const { parsedFlow, conditionMap } = structuredFlowWithConditions(result.flow);
    let flow = applyInferenceRules(parsedFlow);
    const { nodes: rfNodes, edges: rfEdges } = parsedFlowToReactFlow(flow);

    // 附加条件信息
    const edgesWithConditions = rfEdges.map(e => {
      const key = `${e.source}->${e.target}`;
      const cond = conditionMap.get(key);
      if (cond) {
        return { ...e, data: { ...e.data, conditionName: cond, conditionExpression: cond } };
      }
      return e;
    });

    set({ isLayouting: true });
    try {
      const layouted = await layoutWithElk(rfNodes, edgesWithConditions);
      const assistantMsg: AiMessage = {
        role: 'assistant',
        content: `✅ 已生成 ${result.flow.processName}：${result.flow.nodes.length} 个节点，${result.flow.edges.length} 条连线`,
        timestamp: Date.now(),
      };
      set(state => ({
        nodes: layouted.nodes,
        edges: layouted.edges,
        processName: result.flow!.processName,
        isLayouting: false,
        aiStatus: 'success',
        aiMessages: [...state.aiMessages, assistantMsg],
      }));
    } catch {
      const assistantMsg: AiMessage = {
        role: 'assistant',
        content: `⚠️ 流程已解析但布局失败`,
        timestamp: Date.now(),
      };
      set(state => ({
        nodes: rfNodes,
        edges: edgesWithConditions,
        processName: result.flow!.processName,
        isLayouting: false,
        aiStatus: 'success',
        aiMessages: [...state.aiMessages, assistantMsg],
      }));
    }
  },

  clearAiMessages: () => {
    set({ aiMessages: [], aiError: null, aiStatus: 'idle' });
  },
}));
