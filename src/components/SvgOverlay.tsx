import React from 'react';
import { Connection, Measurement, Node, StyleConfig } from '../types';

interface Props {
  w: number;
  h: number;
  nodes: Node[];
  connections: Connection[];
  measurements: Measurement[];
  style: StyleConfig;
  svgRef: React.RefObject<SVGSVGElement>;
  spawnPoint: Node | null;
  spawnConnections: Connection[];
  faultNodeIds: Set<string>;
  backgroundOpacity: number;
  onSvgClick?: (x: number, y: number) => void;
}

export function SvgOverlay({
  w, h, nodes, connections, measurements, style, svgRef,
  spawnPoint, spawnConnections, faultNodeIds,
  backgroundOpacity, onSvgClick,
}: Props) {
  const { nodeStyle, lineStyle, strokeWidth, dashPattern } = style;
  const dash = lineStyle === 'dashed' ? (dashPattern ?? '4 4') : undefined;
  const labelSize = Math.max(8, Math.min(14, w * 0.006));
  const hasSpawn = !!spawnPoint;

  const allNodeMap = new Map<string, Node>([
    ...nodes.map(n => [n.id, n] as [string, Node]),
    ...(spawnPoint ? [['spawn', spawnPoint] as [string, Node]] : []),
  ]);

  const measMap = new Map(measurements.map(m => [m.connectionId, m]));
  const nodeIndexMap = new Map(nodes.map((n, i) => [n.id, i]));

  const foregroundNodeIds = new Set(spawnConnections.map(c => c.toNodeId));
  const bgNodes = hasSpawn ? nodes.filter(n => !foregroundNodeIds.has(n.id)) : nodes;
  const fgNodes = hasSpawn ? nodes.filter(n => foregroundNodeIds.has(n.id)) : [];

  function NodeShape({ node, idx }: { node: Node; idx: number }): React.ReactElement {
    const shape = nodeStyle[idx % nodeStyle.length] ?? 'square';
    const common = { fill: 'none', stroke: 'white', strokeWidth } as const;
    if (shape === 'circle') return <circle cx={node.x} cy={node.y} r={4} {...common} />;
    if (shape === 'square') return <rect x={node.x - 4} y={node.y - 4} width={8} height={8} {...common} />;
    return <rect x={node.x - 2.5} y={node.y - 6} width={5} height={12} {...common} />;
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onSvgClick || !svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(ctm.inverse());
    onSvgClick(Math.round(x), Math.round(y));
  }

  const faultNodes = nodes.filter(n => faultNodeIds.has(n.id));
  const badgeH = Math.round(labelSize * 3.4);
  const badgeW = Math.round(labelSize * 22);
  const badgePad = Math.round(labelSize * 1.4);
  const badgeRx = Math.round(labelSize * 1.0);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: onSvgClick ? 'all' : 'none',
        cursor: onSvgClick ? 'crosshair' : 'default',
      }}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onSvgClick ? handleClick : undefined}
    >
      {/* Background: auto-generated connections */}
      <g opacity={hasSpawn ? backgroundOpacity : 1}>
        {connections.map(c => {
          const a = allNodeMap.get(c.fromNodeId), b = allNodeMap.get(c.toNodeId);
          if (!a || !b) return null;
          const meas = measMap.get(c.id);
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          return (
            <g key={c.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="white" strokeWidth={strokeWidth} strokeDasharray={dash} />
              {meas && (
                <text x={mx} y={my - 3} fill="white" fontSize={labelSize}
                  fontFamily="'Courier New', Courier, monospace" textAnchor="middle">
                  {meas.label}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Background: auto-detected nodes not connected to spawn */}
      <g opacity={hasSpawn ? backgroundOpacity : 1}>
        {bgNodes.map(n => (
          <NodeShape key={n.id} node={n} idx={nodeIndexMap.get(n.id) ?? 0} />
        ))}
      </g>

      {/* Foreground: spawn connections with distance labels */}
      {spawnPoint && spawnConnections.map(c => {
        const to = allNodeMap.get(c.toNodeId);
        if (!to) return null;
        const dist = Math.sqrt((spawnPoint.x - to.x) ** 2 + (spawnPoint.y - to.y) ** 2);
        const mx = (spawnPoint.x + to.x) / 2, my = (spawnPoint.y + to.y) / 2;
        return (
          <g key={c.id}>
            <line x1={spawnPoint.x} y1={spawnPoint.y} x2={to.x} y2={to.y}
              stroke="white" strokeWidth={strokeWidth} strokeDasharray={dash} />
            <text x={mx} y={my - 3} fill="white" fontSize={labelSize}
              fontFamily="'Courier New', Courier, monospace" textAnchor="middle">
              {dist.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* Foreground: nodes connected to spawn */}
      {fgNodes.map(n => (
        <NodeShape key={n.id} node={n} idx={nodeIndexMap.get(n.id) ?? 0} />
      ))}

      {/* Spawn node — filled circle + crosshair */}
      {spawnPoint && (
        <g>
          <circle cx={spawnPoint.x} cy={spawnPoint.y} r={5} fill="white" />
          <line x1={spawnPoint.x - 14} y1={spawnPoint.y} x2={spawnPoint.x + 14} y2={spawnPoint.y}
            stroke="white" strokeWidth={strokeWidth} />
          <line x1={spawnPoint.x} y1={spawnPoint.y - 14} x2={spawnPoint.x} y2={spawnPoint.y + 14}
            stroke="white" strokeWidth={strokeWidth} />
        </g>
      )}

      {/* Fault nodes — filled red marker + label badge, always on top */}
      {faultNodes.map(n => (
        <g key={`fault-${n.id}`}>
          <rect x={n.x - 4} y={n.y - 4} width={8} height={8} fill="#e11d48" />
          <rect x={n.x + 10} y={n.y - badgeH / 2} width={badgeW} height={badgeH} rx={badgeRx} fill="#141414" />
          <text
            x={n.x + 10 + badgePad} y={n.y}
            fill="white" fontSize={labelSize * 2}
            fontFamily="'Suisse Intl Mono', 'Courier New', monospace"
            dominantBaseline="middle"
          >
            Fault identified
          </text>
        </g>
      ))}
    </svg>
  );
}
