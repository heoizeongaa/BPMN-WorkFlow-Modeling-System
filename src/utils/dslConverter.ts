const ROUTE_KEYWORDS = ['销司', '总部', '分支', '分公司', '分部', '区域', '路径', '线路', '路线', '渠道', '司', '部'];

function isRouteName(name: string): boolean {
  return ROUTE_KEYWORDS.some(kw => name.includes(kw));
}

function isBranchName(name: string): boolean {
  if (/[()（）\[\]【】]/.test(name)) return true;
  if (name.includes('+')) return true;
  if (name.includes('＋')) return true;
  return false;
}

function removeNumbering(line: string): string {
  let r = line;
  r = r.replace(/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮]\s*/g, '');
  r = r.replace(/^[\d]+\s*[.、．)）]\s*/g, '');
  r = r.replace(/^\(\d+\)\s*/g, '');
  r = r.replace(/^[（]\d+[）]\s*/g, '');
  r = r.replace(/^[一二三四五六七八九十]+\s*[、.．]\s*/g, '');
  return r.trim();
}

function normalizeArrows(line: string): string {
  return line
    .replace(/：/g, ':')
    .replace(/→/g, '->')
    .replace(/—>/g, '->')
    .replace(/──>/g, '->')
    .replace(/─>/g, '->')
    .replace(/➜/g, '->')
    .replace(/➡/g, '->')
    .replace(/⟶/g, '->');
}

function cleanHeaderName(name: string): string {
  return name.replace(/流程$/g, '').trim();
}

function splitChain(text: string): string[] {
  return text.split('->').map(s => s.trim()).filter(s => s.length > 0);
}

interface HeaderInfo {
  isHeader: boolean;
  headerName: string;
  hasChain: boolean;
  chainNodes: string[];
}

function parseHeaderLine(line: string): HeaderInfo {
  const colonIdx = line.indexOf(':');
  if (colonIdx === -1) {
    return { isHeader: false, headerName: '', hasChain: false, chainNodes: [] };
  }

  const before = line.substring(0, colonIdx).trim();
  const after = line.substring(colonIdx + 1).trim();

  if (!before) {
    return { isHeader: false, headerName: '', hasChain: false, chainNodes: [] };
  }

  const looksLikeHeader =
    before.includes('流程') ||
    ROUTE_KEYWORDS.some(kw => before.includes(kw)) ||
    isBranchName(before) ||
    before.length <= 8;

  if (!looksLikeHeader && after.includes('->')) {
    return { isHeader: false, headerName: '', hasChain: false, chainNodes: [] };
  }

  if (!looksLikeHeader && after.length > 0 && !after.includes('->')) {
    return { isHeader: false, headerName: '', hasChain: false, chainNodes: [] };
  }

  if (after.includes('->')) {
    return { isHeader: true, headerName: before, hasChain: true, chainNodes: splitChain(after) };
  }

  if (!after) {
    return { isHeader: true, headerName: before, hasChain: false, chainNodes: [] };
  }

  return { isHeader: false, headerName: '', hasChain: false, chainNodes: [] };
}

type Level = 'process' | 'branch' | 'route' | 'chain';

function classifyHeader(name: string): Level {
  if (isBranchName(name)) return 'branch';
  if (isRouteName(name)) return 'route';
  return 'branch';
}

export function convertRawTextToDsl(rawText: string): string {
  if (!rawText.trim()) return '';

  const rawLines = rawText.split('\n');
  const lines: string[] = [];

  for (const raw of rawLines) {
    let line = raw.trim();
    line = removeNumbering(line);
    line = normalizeArrows(line);
    line = line.trim();
    if (line) lines.push(line);
  }

  const result: string[] = [];
  let state: 'idle' | 'process' | 'branch' | 'route' | 'chain' = 'idle';

  for (const line of lines) {
    const hdr = parseHeaderLine(line);

    if (hdr.isHeader && !hdr.hasChain) {
      const name = cleanHeaderName(hdr.headerName);
      const level = classifyHeader(hdr.headerName);

      if (state === 'idle') {
        if (level === 'route') {
          result.push('Process:');
          result.push('  DefaultBranch:');
          result.push(`    ${name}:`);
          state = 'route';
        } else if (level === 'branch') {
          if (name.length > 4 || isBranchName(hdr.headerName)) {
            result.push('Process:');
            result.push(`  ${name}:`);
            state = 'branch';
          } else {
            result.push(`${name}:`);
            state = 'process';
          }
        } else {
          result.push(`${name}:`);
          state = 'process';
        }
      } else if (state === 'process') {
        if (level === 'route') {
          result.push('  DefaultBranch:');
          result.push(`    ${name}:`);
          state = 'route';
        } else if (level === 'branch') {
          result.push(`  ${name}:`);
          state = 'branch';
        } else {
          result.push(`  ${name}:`);
          state = 'branch';
        }
      } else if (state === 'branch') {
        result.push(`    ${name}:`);
        state = 'route';
      } else {
        if (level === 'branch' && isBranchName(hdr.headerName)) {
          result.push(`  ${name}:`);
          state = 'branch';
        } else {
          result.push(`    ${name}:`);
          state = 'route';
        }
      }
      continue;
    }

    if (hdr.isHeader && hdr.hasChain) {
      const name = cleanHeaderName(hdr.headerName);
      const level = classifyHeader(hdr.headerName);

      if (state === 'idle') {
        if (level === 'route') {
          result.push('Process:');
          result.push('  DefaultBranch:');
          result.push(`    ${name}:`);
          state = 'route';
        } else if (level === 'branch') {
          result.push('Process:');
          result.push(`  ${name}:`);
          result.push('    default:');
          state = 'route';
        } else {
          result.push(`${name}:`);
          result.push('  default:');
          state = 'route';
        }
      } else if (state === 'process') {
        if (level === 'route') {
          result.push('  DefaultBranch:');
          result.push(`    ${name}:`);
          state = 'route';
        } else if (level === 'branch') {
          result.push(`  ${name}:`);
          result.push('    default:');
          state = 'route';
        } else {
          result.push(`  ${name}:`);
          result.push('    default:');
          state = 'route';
        }
      } else if (state === 'branch') {
        result.push(`    ${name}:`);
        state = 'route';
      } else {
        if (level === 'branch' && isBranchName(hdr.headerName)) {
          result.push(`  ${name}:`);
          result.push('    default:');
          state = 'route';
        } else {
          result.push(`    ${name}:`);
          state = 'route';
        }
      }

      appendChain(hdr.chainNodes, result);
      state = 'chain';
      continue;
    }

    if (line.includes('->')) {
      const nodes = splitChain(line);

      if (state === 'idle') {
        result.push('Process:');
        result.push('  DefaultBranch:');
        result.push('    default:');
        state = 'route';
      } else if (state === 'process') {
        result.push('  DefaultBranch:');
        result.push('    default:');
        state = 'route';
      } else if (state === 'branch') {
        result.push('    default:');
        state = 'route';
      }

      appendChain(nodes, result);
      state = 'chain';
      continue;
    }

    if (state === 'idle') {
      result.push(`${line}:`);
      state = 'process';
    } else if (state === 'process') {
      result.push(`  ${line}:`);
      state = 'branch';
    } else if (state === 'branch') {
      result.push(`    ${line}:`);
      state = 'route';
    } else {
      result.push(`      ${line}`);
      state = 'chain';
    }
  }

  return result.join('\n');
}

function appendChain(nodes: string[], result: string[]): void {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i].trim();
    if (!n) continue;
    if (i === 0) {
      result.push(`      ${n}`);
    } else {
      result.push(`      -> ${n}`);
    }
  }
}
