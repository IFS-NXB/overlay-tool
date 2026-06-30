import { useCallback, useEffect, useRef, useState } from 'react';
import { Connection, InteractionMode, Measurement, Node, StyleConfig } from './types';
import { toGrayscale, sobelMagnitude, normalizeMag } from './lib/imageProcessing';
import { pickNodes } from './lib/nodePicking';
import { autoConnect, measureConnections, spawnConnect } from './lib/connections';
import { exportPng, exportSvg } from './lib/export';
import { Controls } from './components/Controls';
import { SvgOverlay } from './components/SvgOverlay';
import { DebugCanvas } from './components/DebugCanvas';

function nearestNode(nodes: Node[], x: number, y: number, snapRadius = 60): Node | null {
  let best: Node | null = null;
  let bestD2 = snapRadius * snapRadius;
  for (const n of nodes) {
    const d2 = (n.x - x) ** 2 + (n.y - y) ** 2;
    if (d2 < bestD2) { bestD2 = d2; best = n; }
  }
  return best;
}

export default function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [normMap, setNormMap] = useState<Float32Array | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [edgeSensitivity, setEdgeSensitivity] = useState(30);
  const [nodeSpacing, setNodeSpacing] = useState(30);
  const [enableConnections, setEnableConnections] = useState(true);
  const [maxConnectionDistance, setMaxConnectionDistance] = useState(150);
  const [styleConfig, setStyleConfig] = useState<StyleConfig>({
    nodeStyle: ['square'],
    lineStyle: 'dashed',
    strokeWidth: 1,
    dashPattern: '4 4',
  });

  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
  const [spawnPoint, setSpawnPoint] = useState<Node | null>(null);
  const [spawnConnections, setSpawnConnections] = useState<Connection[]>([]);
  const [faultNodeIds, setFaultNodeIds] = useState<string[]>([]);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.15);

  const imgRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    setNormMap(null);
    setNodes([]);
    setConnections([]);
    setMeasurements([]);
    setProcessing(true);
    setShowDebug(false);
    setInteractionMode('none');
    setSpawnPoint(null);
    setSpawnConnections([]);
    setFaultNodeIds([]);

    const tmp = new Image();
    tmp.onload = () => {
      const w = tmp.naturalWidth, h = tmp.naturalHeight;
      setImgSize({ w, h });

      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(tmp, 0, 0);
        const { data } = ctx.getImageData(0, 0, w, h);

        const gray = toGrayscale(data, w * h);
        const raw = sobelMagnitude(gray, w, h);
        const norm = normalizeMag(raw);
        setNormMap(norm);
        setProcessing(false);
      }, 16);
    };
    tmp.src = url;
  }, []);

  useEffect(() => {
    if (!normMap || !imgSize) { setNodes([]); return; }
    setNodes(pickNodes(normMap, imgSize.w, imgSize.h, edgeSensitivity, nodeSpacing));
  }, [normMap, imgSize, edgeSensitivity, nodeSpacing]);

  useEffect(() => {
    if (!enableConnections || nodes.length === 0) {
      setConnections([]);
      setMeasurements([]);
      return;
    }
    const conns = autoConnect(nodes, maxConnectionDistance);
    setConnections(conns);
    setMeasurements(measureConnections(nodes, conns));
  }, [nodes, enableConnections, maxConnectionDistance]);

  useEffect(() => {
    if (!spawnPoint || nodes.length === 0) { setSpawnConnections([]); return; }
    setSpawnConnections(spawnConnect(spawnPoint, nodes, maxConnectionDistance));
  }, [spawnPoint, nodes, maxConnectionDistance]);

  const handleSvgClick = useCallback((x: number, y: number) => {
    if (interactionMode === 'place-spawn') {
      setSpawnPoint({ id: 'spawn', x, y, isSpawn: true });
      setInteractionMode('none');
    } else if (interactionMode === 'mark-fault') {
      const clicked = nearestNode(nodes, x, y);
      if (!clicked) return;
      setFaultNodeIds(prev =>
        prev.includes(clicked.id)
          ? prev.filter(id => id !== clicked.id)
          : [...prev, clicked.id],
      );
    }
  }, [interactionMode, nodes]);

  const handleInteractionModeChange = useCallback((mode: InteractionMode) => {
    setInteractionMode(prev => prev === mode ? 'none' : mode);
  }, []);

  const handleClearSpawn = useCallback(() => {
    setSpawnPoint(null);
    setSpawnConnections([]);
  }, []);

  const handleClearFaults = useCallback(() => {
    setFaultNodeIds([]);
  }, []);

  const handleExportPng = async () => {
    if (!imgRef.current || !svgRef.current || !imgSize) return;
    await exportPng(imgRef.current, svgRef.current, imgSize.w, imgSize.h, 'overlay');
  };

  const handleExportSvg = async () => {
    if (!imgRef.current || !svgRef.current || !imgSize) return;
    await exportSvg(imgRef.current, svgRef.current, imgSize.w, imgSize.h, 'overlay');
  };

  const updateStyle = useCallback((patch: Partial<StyleConfig>) => {
    setStyleConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleUpload(file);
  }, [handleUpload]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}>
      <Controls
        hasImage={!!imageUrl}
        nodeCount={nodes.length}
        connectionCount={connections.length}
        edgeSensitivity={edgeSensitivity}
        nodeSpacing={nodeSpacing}
        enableConnections={enableConnections}
        maxConnectionDistance={maxConnectionDistance}
        styleConfig={styleConfig}
        showDebug={showDebug}
        interactionMode={interactionMode}
        hasSpawnPoint={!!spawnPoint}
        hasFaultNodes={faultNodeIds.length > 0}
        backgroundOpacity={backgroundOpacity}
        onSensitivityChange={setEdgeSensitivity}
        onSpacingChange={setNodeSpacing}
        onEnableConnectionsChange={setEnableConnections}
        onMaxDistChange={setMaxConnectionDistance}
        onStyleChange={updateStyle}
        onToggleDebug={() => setShowDebug(p => !p)}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onUpload={handleUpload}
        onInteractionModeChange={handleInteractionModeChange}
        onClearSpawn={handleClearSpawn}
        onClearFaults={handleClearFaults}
        onBackgroundOpacityChange={setBackgroundOpacity}
      />

      <main
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: 32 }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {!imageUrl ? (
          <label style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px dashed #1e1e1e', cursor: 'pointer', minHeight: 300,
          }}>
            <input
              type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#2e2e2e', letterSpacing: '0.14em', marginBottom: 8 }}>
                DROP IMAGE HERE
              </div>
              <div style={{ fontSize: 9, color: '#1e1e1e', letterSpacing: '0.08em' }}>
                or click to browse — JPEG, PNG, WebP, etc.
              </div>
            </div>
          </label>
        ) : (
          <>
            <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start' }}>
              <img
                ref={imgRef}
                src={imageUrl}
                alt=""
                style={{ display: 'block', maxWidth: '100%', maxHeight: '75vh' }}
              />
              {imgSize && (
                <SvgOverlay
                  w={imgSize.w}
                  h={imgSize.h}
                  nodes={nodes}
                  connections={connections}
                  measurements={measurements}
                  style={styleConfig}
                  svgRef={svgRef as React.RefObject<SVGSVGElement>}
                  spawnPoint={spawnPoint}
                  spawnConnections={spawnConnections}
                  faultNodeIds={new Set(faultNodeIds)}
                  backgroundOpacity={backgroundOpacity}
                  onSvgClick={interactionMode !== 'none' ? handleSvgClick : undefined}
                />
              )}
            </div>

            {processing && (
              <div style={{ marginTop: 12, fontSize: 9, color: '#333', letterSpacing: '0.1em' }}>
                PROCESSING EDGE MAP…
              </div>
            )}

            {showDebug && normMap && imgSize && (
              <div style={{ maxWidth: '100%', marginTop: 0 }}>
                <DebugCanvas normMap={normMap} w={imgSize.w} h={imgSize.h} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
