import { v4 as uuidv4 } from 'uuid';
import type { DslProcess, DslBranch, DslRoute, ParsedFlow, ParsedFlowNode, ParsedFlowEdge } from '@/types/bpmn';

function generateId(prefix: string): string {
  return `${prefix}_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
}

function slugify(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

export function parseDsl(input: string): DslProcess[] {
  const lines = input.split('\n');
  const processes: DslProcess[] = [];
  let currentProcess: DslProcess | null = null;
  let currentBranch: DslBranch | null = null;
  let currentRoute: DslRoute | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    if (indent === 0 && trimmed.endsWith(':')) {
      currentProcess = {
        name: trimmed.slice(0, -1).trim(),
        branches: [],
      };
      processes.push(currentProcess);
      currentBranch = null;
      currentRoute = null;
    } else if (currentProcess && (indent === 2 || indent === 3) && trimmed.endsWith(':')) {
      currentBranch = {
        label: trimmed.slice(0, -1).trim(),
        routes: [],
      };
      currentProcess.branches.push(currentBranch);
      currentRoute = null;
    } else if (currentBranch && (indent === 4 || indent === 5) && trimmed.endsWith(':')) {
      currentRoute = {
        label: trimmed.slice(0, -1).trim(),
        steps: [],
      };
      currentBranch.routes.push(currentRoute);
    } else if (trimmed.startsWith('->')) {
      const step = trimmed.substring(2).trim();
      if (!step) continue;

      if (currentRoute) {
        currentRoute.steps.push(step);
      } else if (currentBranch) {
        if (currentBranch.routes.length === 0) {
          currentRoute = { label: 'default', steps: [] };
          currentBranch.routes.push(currentRoute);
        }
        currentBranch.routes[currentBranch.routes.length - 1].steps.push(step);
      } else if (currentProcess) {
        if (currentProcess.branches.length === 0) {
          currentBranch = { label: 'default', routes: [] };
          currentProcess.branches.push(currentBranch);
        }
        const lastBranch = currentProcess.branches[currentProcess.branches.length - 1];
        if (lastBranch.routes.length === 0) {
          currentRoute = { label: 'default', steps: [] };
          lastBranch.routes.push(currentRoute);
        }
        lastBranch.routes[lastBranch.routes.length - 1].steps.push(step);
      }
    } else if (currentRoute && indent >= 6) {
      currentRoute.steps.push(trimmed);
    } else if (currentBranch && indent >= 4 && indent <= 5) {
      if (currentBranch.routes.length === 0) {
        currentRoute = { label: 'default', steps: [] };
        currentBranch.routes.push(currentRoute);
      }
      currentRoute = currentBranch.routes[currentBranch.routes.length - 1];
      currentRoute.steps.push(trimmed);
    } else if (currentProcess && indent >= 2 && indent <= 3) {
      if (currentProcess.branches.length === 0) {
        currentBranch = { label: 'default', routes: [] };
        currentProcess.branches.push(currentBranch);
      }
      currentBranch = currentProcess.branches[currentProcess.branches.length - 1];
      if (currentBranch.routes.length === 0) {
        currentRoute = { label: 'default', steps: [] };
        currentBranch.routes.push(currentRoute);
      }
      currentRoute = currentBranch.routes[currentBranch.routes.length - 1];
      currentRoute.steps.push(trimmed);
    }
  }

  return processes;
}

export function dslToFlow(processes: DslProcess[]): ParsedFlow {
  const allNodes: ParsedFlowNode[] = [];
  const allEdges: ParsedFlowEdge[] = [];
  const startEventIds = new Map<string, string>();
  const endEventIds = new Map<string, string>();

  function getOrCreateStartEvent(processName: string): ParsedFlowNode {
    if (startEventIds.has(processName)) {
      return allNodes.find(n => n.id === startEventIds.get(processName))!;
    }
    const node: ParsedFlowNode = {
      id: generateId('start'),
      name: 'Start',
      type: 'startEvent',
    };
    startEventIds.set(processName, node.id);
    allNodes.push(node);
    return node;
  }

  function getOrCreateEndEvent(processName: string): ParsedFlowNode {
    if (endEventIds.has(processName)) {
      return allNodes.find(n => n.id === endEventIds.get(processName))!;
    }
    const node: ParsedFlowNode = {
      id: generateId('end'),
      name: 'End',
      type: 'endEvent',
    };
    endEventIds.set(processName, node.id);
    allNodes.push(node);
    return node;
  }

  for (const process of processes) {
    const startNode = getOrCreateStartEvent(process.name);
    const endNode = getOrCreateEndEvent(process.name);

    if (process.branches.length === 0) continue;

    const hasMultipleBranches = process.branches.length > 1;
    const hasMultipleRoutes = process.branches.some(b => b.routes.length > 1);

    if (!hasMultipleBranches && !hasMultipleRoutes) {
      const branch = process.branches[0];
      const route = branch?.routes?.[0];
      if (!route) continue;

      let prevId = startNode.id;
      for (const step of route.steps) {
        const isEnd = step.toUpperCase() === 'END';
        if (isEnd) {
          allEdges.push({ sourceId: prevId, targetId: endNode.id });
          prevId = endNode.id;
          continue;
        }
        const taskNode: ParsedFlowNode = {
          id: generateId(`task_${slugify(step)}`),
          name: step,
          type: 'userTask',
        };
        allNodes.push(taskNode);
        allEdges.push({ sourceId: prevId, targetId: taskNode.id });
        prevId = taskNode.id;
      }
      continue;
    }

    let currentForkId = startNode.id;

    if (hasMultipleBranches) {
      const parallelFork: ParsedFlowNode = {
        id: generateId('pgw_fork'),
        name: '',
        type: 'parallelGateway',
      };
      allNodes.push(parallelFork);
      allEdges.push({ sourceId: startNode.id, targetId: parallelFork.id });
      currentForkId = parallelFork.id;
    }

    const branchLastIds: string[] = [];

    for (const branch of process.branches) {
      let branchEntryId = currentForkId;

      if (branch.routes.length > 1) {
        const exFork: ParsedFlowNode = {
          id: generateId('gw_fork'),
          name: '',
          type: 'exclusiveGateway',
        };
        allNodes.push(exFork);
        allEdges.push({ sourceId: currentForkId, targetId: exFork.id });
        branchEntryId = exFork.id;
      }

      const routeLastIds: string[] = [];

      for (const route of branch.routes) {
        let prevId = branchEntryId;

        for (const step of route.steps) {
          const isEnd = step.toUpperCase() === 'END';
          if (isEnd) {
            allEdges.push({ sourceId: prevId, targetId: endNode.id });
            prevId = endNode.id;
            continue;
          }
          const taskNode: ParsedFlowNode = {
            id: generateId(`task_${slugify(step)}_${slugify(branch.label)}_${slugify(route.label)}`),
            name: step,
            type: 'userTask',
          };
          allNodes.push(taskNode);
          allEdges.push({ sourceId: prevId, targetId: taskNode.id });
          prevId = taskNode.id;
        }
        routeLastIds.push(prevId);
      }

      if (branch.routes.length > 1) {
        const nonEndRouteIds = routeLastIds.filter(id => id !== endNode.id);
        if (nonEndRouteIds.length > 0) {
          const exMerge: ParsedFlowNode = {
            id: generateId('gw_merge'),
            name: '',
            type: 'exclusiveGateway',
          };
          allNodes.push(exMerge);

          for (const lastId of nonEndRouteIds) {
            allEdges.push({ sourceId: lastId, targetId: exMerge.id });
          }

          branchLastIds.push(exMerge.id);
        } else {
          branchLastIds.push(endNode.id);
        }
      } else {
        branchLastIds.push(routeLastIds[0]);
      }
    }

    if (hasMultipleBranches) {
      const nonEndBranchIds = branchLastIds.filter(id => id !== endNode.id);
      if (nonEndBranchIds.length > 0) {
        const parallelMerge: ParsedFlowNode = {
          id: generateId('pgw_merge'),
          name: '',
          type: 'parallelGateway',
        };
        allNodes.push(parallelMerge);

        for (const lastId of nonEndBranchIds) {
          allEdges.push({ sourceId: lastId, targetId: parallelMerge.id });
        }

        allEdges.push({ sourceId: parallelMerge.id, targetId: endNode.id });
      }
    } else if (hasMultipleRoutes) {
      const nonEndBranchIds = branchLastIds.filter(id => id !== endNode.id);
      if (nonEndBranchIds.length > 0) {
        const lastId = nonEndBranchIds[nonEndBranchIds.length - 1];
        if (!allEdges.some(e => e.sourceId === lastId && e.targetId === endNode.id)) {
          allEdges.push({ sourceId: lastId, targetId: endNode.id });
        }
      }
    }
  }

  return { nodes: allNodes, edges: allEdges };
}
