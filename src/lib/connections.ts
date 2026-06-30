import { Connection, Measurement, Node } from '../types';

export function spawnConnect(spawnNode: Node, nodes: Node[], maxDist: number): Connection[] {
  const conns: Connection[] = [];
  const d2 = maxDist * maxDist;
  for (const n of nodes) {
    const dx = spawnNode.x - n.x, dy = spawnNode.y - n.y;
    if (dx * dx + dy * dy <= d2) {
      conns.push({ id: `c${++_seq}`, fromNodeId: spawnNode.id, toNodeId: n.id });
    }
  }
  return conns;
}

let _seq = 0;

const MAX_CONNECTIONS = 2000;

export function autoConnect(nodes: Node[], maxDist: number): Connection[] {
  const conns: Connection[] = [];
  const d2 = maxDist * maxDist;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
      if (dx * dx + dy * dy <= d2) {
        conns.push({ id: `c${++_seq}`, fromNodeId: nodes[i].id, toNodeId: nodes[j].id });
        if (conns.length >= MAX_CONNECTIONS) return conns;
      }
    }
  }
  return conns;
}

export function measureConnections(nodes: Node[], conns: Connection[]): Measurement[] {
  const map = new Map(nodes.map(n => [n.id, n]));
  return conns.map(c => {
    const a = map.get(c.fromNodeId)!, b = map.get(c.toNodeId)!;
    const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    return { connectionId: c.id, label: d.toFixed(2) };
  });
}
