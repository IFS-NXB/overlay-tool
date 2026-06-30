import { Node } from '../types';

let _seq = 0;

const MAX_NODES = 1000;

export function pickNodes(
  norm: Float32Array,
  w: number,
  h: number,
  threshold: number,
  minSpacing: number,
): Node[] {
  const candidates: [number, number, number][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const m = norm[y * w + x];
      if (m >= threshold) candidates.push([x, y, m]);
    }
  }
  // Strongest edges first so greedy pick keeps the highest-quality points
  candidates.sort((a, b) => b[2] - a[2]);

  const nodes: Node[] = [];
  const sp2 = minSpacing * minSpacing;

  outer: for (const [x, y] of candidates) {
    for (const nd of nodes) {
      const dx = x - nd.x, dy = y - nd.y;
      if (dx * dx + dy * dy < sp2) continue outer;
    }
    nodes.push({ id: `n${++_seq}`, x, y });
    if (nodes.length >= MAX_NODES) break;
  }

  return nodes;
}
