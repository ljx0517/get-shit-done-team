/**
 * Capture — Fragment storage, graph I/O, and milestone trigger check
 *
 * Design: NO domain-specific logic here.
 * Entity extraction and graph inference are handled by Claude in the workflow.
 * This module is pure I/O + trigger math.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { planningPaths, withPlanningLock, output, error } = require('./core.cjs');
const { extractFrontmatter, reconstructFrontmatter } = require('./frontmatter.cjs');

// ─── Fragment storage ─────────────────────────────────────────────────────────

/**
 * Generate next fragment filename: YYYY-MM-DD-NNN.md
 */
function nextFragmentName(fragmentsDir) {
  const today = new Date().toISOString().slice(0, 10);
  let seq = 1;
  if (fs.existsSync(fragmentsDir)) {
    const existing = fs.readdirSync(fragmentsDir)
      .filter(f => f.startsWith(today) && f.endsWith('.md'));
    seq = existing.length + 1;
  }
  return `${today}-${String(seq).padStart(3, '0')}.md`;
}

/**
 * Save a raw fragment.
 * @param {string} fragmentsDir
 * @param {string} filename
 * @param {{ raw: string, intent: string, entities: string[] }} data  — provided by Claude
 */
function saveFragment(fragmentsDir, filename, data) {
  fs.mkdirSync(fragmentsDir, { recursive: true });
  const entityLines = (data.entities || []).map(e => `  - ${e}`).join('\n') || '  []';
  const content =
    `---\nid: ${path.basename(filename, '.md')}\nintent: ${data.intent || 'unknown'}\nentities:\n${entityLines}\ndate: ${new Date().toISOString()}\n---\n\n${data.raw}\n`;
  fs.writeFileSync(path.join(fragmentsDir, filename), content, 'utf-8');
}

// ─── Graph I/O ────────────────────────────────────────────────────────────────

/**
 * Load graph from graph.md frontmatter.
 * @returns {{ nodes: string[], edges: string[][], evidence: Record<string,string[]> }}
 */
function loadGraph(graphPath) {
  try {
    const content = fs.readFileSync(graphPath, 'utf-8');
    const fm = extractFrontmatter(content);
    return {
      nodes:    Array.isArray(fm.nodes)    ? fm.nodes    : [],
      edges:    Array.isArray(fm.edges)
        ? fm.edges.map(e => (typeof e === 'string' ? e.split('→') : e))
        : [],
      evidence: (fm.evidence && typeof fm.evidence === 'object') ? fm.evidence : {},
    };
  } catch {
    return { nodes: [], edges: [], evidence: {} };
  }
}

/**
 * Merge Claude-inferred nodes/edges into graph, add evidence, and persist.
 * @param {string} graphPath
 * @param {object} graph  — current graph (from loadGraph)
 * @param {string[]} newNodes  — Claude-provided new node ids
 * @param {string[][]} newEdges — Claude-provided new edges [[src,dst], ...]
 * @param {string[]} entities  — entities found in this fragment (for evidence)
 * @param {string} fragmentId
 */
function updateGraph(graphPath, graph, newNodes, newEdges, entities, fragmentId) {
  // Merge nodes (dedup)
  const nodeSet = new Set(graph.nodes);
  for (const n of (newNodes || [])) {
    nodeSet.add(n);
  }
  graph.nodes = [...nodeSet];

  // Merge edges (dedup by src→dst key)
  const edgeSet = new Set(graph.edges.map(e => `${e[0]}→${e[1]}`));
  for (const e of (newEdges || [])) {
    const key = `${e[0]}→${e[1]}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      graph.edges.push(e);
    }
  }

  // Evidence: record which fragment referenced each entity
  for (const entity of (entities || [])) {
    if (!graph.evidence[entity]) graph.evidence[entity] = [];
    if (!graph.evidence[entity].includes(fragmentId)) {
      graph.evidence[entity].push(fragmentId);
    }
  }

  // Persist
  const edgesStr = graph.edges.map(e => `${e[0]}→${e[1]}`);
  const fm = {
    nodes:    graph.nodes,
    edges:    edgesStr,
    evidence: graph.evidence,
    updated:  new Date().toISOString().slice(0, 10),
  };
  const nodeList = graph.nodes.map(n => `- ${n}`).join('\n') || '_(none yet)_';
  const edgeList = edgesStr.map(e => `- ${e}`).join('\n') || '_(none yet)_';
  const fmBlock = reconstructFrontmatter(fm);
  const body = `\n# Feature Graph\n\nAuto-generated from captured fragments.\n\n## Nodes\n\n${nodeList}\n\n## Edges\n\n${edgeList}\n`;
  const fileContent = `---\n${fmBlock}\n---\n${body}`;
  fs.mkdirSync(path.dirname(graphPath), { recursive: true });
  fs.writeFileSync(graphPath, fileContent, 'utf-8');
}

// ─── Trigger check ────────────────────────────────────────────────────────────

/**
 * Return raw graph statistics for AI judgment.
 * ready is always null — AI decides whether to trigger discuss-phase.
 * @param {{ nodes, edges, evidence }} graph
 * @returns {{ ready: null, nodeCount, edgeCount, multiEvidenceCount }}
 */
function checkMilestoneTrigger(graph) {
  const nodeCount = graph.nodes.length;
  const edgeCount = graph.edges.length;
  const multiEvidenceCount = Object.values(graph.evidence)
    .filter(arr => arr.length > 1).length;
  return { ready: null, nodeCount, edgeCount, multiEvidenceCount };
}

// ─── Subcommands ──────────────────────────────────────────────────────────────

/**
 * `capture save` — store a new fragment.
 * Called by Claude workflow after it has done entity extraction.
 *
 * Args: --text <raw> --intent <intent> --entities <e1,e2,...>
 *       --nodes <n1,n2,...> --edges <src1:dst1,src2:dst2,...>
 */
function cmdCaptureSave(cwd, args, raw) {
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 ? (args[i + 1] || '') : '';
  };

  const text     = get('--text');
  const intent   = get('--intent') || 'unknown';
  const entities = get('--entities') ? get('--entities').split(',').map(s => s.trim()).filter(Boolean) : [];
  const nodes    = get('--nodes')    ? get('--nodes').split(',').map(s => s.trim()).filter(Boolean) : [];
  const edgesRaw = get('--edges')    ? get('--edges').split(',').map(s => s.trim()).filter(Boolean) : [];
  const edges    = edgesRaw.map(e => e.split(':'));

  if (!text) { error('--text is required'); return; }

  const paths        = planningPaths(cwd);
  const capturesDir  = path.join(paths.planning, 'captures');
  const fragmentsDir = path.join(capturesDir, 'fragments');
  const graphPath    = path.join(capturesDir, 'graph.md');
  const statePath    = path.join(capturesDir, 'state.json');

  withPlanningLock(cwd, () => {
    const fragmentName = nextFragmentName(fragmentsDir);
    const fragmentId   = path.basename(fragmentName, '.md');

    saveFragment(fragmentsDir, fragmentName, { raw: text, intent, entities });

    const graph = loadGraph(graphPath);
    updateGraph(graphPath, graph, nodes, edges, entities, fragmentId);

    const trigger = checkMilestoneTrigger(graph);

    fs.mkdirSync(capturesDir, { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify({
      nodeCount:    trigger.nodeCount,
      edgeCount:    trigger.edgeCount,
      last_fragment: fragmentId,
      updated:      new Date().toISOString(),
    }, null, 2), 'utf-8');

    output({ fragment: fragmentId, entities, new_nodes: nodes, new_edges: edgesRaw, trigger }, raw,
      `fragment=${fragmentId}\nnodes=${trigger.nodeCount}\nedges=${trigger.edgeCount}\nmultiEvidence=${trigger.multiEvidenceCount}`
    );
  });
}

/**
 * `capture graph` — read current graph state.
 */
function cmdCaptureGraph(cwd, raw) {
  const paths      = planningPaths(cwd);
  const graphPath  = path.join(paths.planning, 'captures', 'graph.md');
  const graph      = loadGraph(graphPath);
  const trigger    = checkMilestoneTrigger(graph);
  output({ graph, trigger }, raw,
    `节点: ${graph.nodes.join(', ') || '(无)'}\n边: ${graph.edges.map(e => e.join('→')).join(', ') || '(无)'}\n${trigger.message}`
  );
}

/**
 * `capture fragments` — list all fragments with id + content.
 */
function cmdCaptureFragments(cwd, raw) {
  const paths = planningPaths(cwd);
  const fragmentsDir = path.join(paths.planning, 'captures', 'fragments');
  if (!fs.existsSync(fragmentsDir)) {
    output({ fragments: [], count: 0 }, raw, '(无碎片)');
    return;
  }
  const files = fs.readdirSync(fragmentsDir)
    .filter(f => f.endsWith('.md'))
    .sort();
  const fragments = files.map(f => ({
    id: f.replace('.md', ''),
    content: fs.readFileSync(path.join(fragmentsDir, f), 'utf-8'),
  }));
  output({ fragments, count: fragments.length }, raw,
    fragments.map(f => `[${f.id}]\n${f.content}`).join('\n---\n')
  );
}

module.exports = {
  loadGraph,
  updateGraph,
  checkMilestoneTrigger,
  cmdCaptureSave,
  cmdCaptureGraph,
  cmdCaptureFragments,
};
