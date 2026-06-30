import React from 'react';
import { InteractionMode, LineStyle, NodeStyle, StyleConfig } from '../types';

interface Props {
  hasImage: boolean;
  nodeCount: number;
  connectionCount: number;
  edgeSensitivity: number;
  nodeSpacing: number;
  enableConnections: boolean;
  maxConnectionDistance: number;
  styleConfig: StyleConfig;
  showDebug: boolean;
  interactionMode: InteractionMode;
  hasSpawnPoint: boolean;
  hasFaultNodes: boolean;
  backgroundOpacity: number;
  onSensitivityChange: (v: number) => void;
  onSpacingChange: (v: number) => void;
  onEnableConnectionsChange: (v: boolean) => void;
  onMaxDistChange: (v: number) => void;
  onStyleChange: (patch: Partial<StyleConfig>) => void;
  onToggleDebug: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onUpload: (file: File) => void;
  onInteractionModeChange: (mode: InteractionMode) => void;
  onClearSpawn: () => void;
  onClearFaults: () => void;
  onBackgroundOpacityChange: (v: number) => void;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, color: '#444', letterSpacing: '0.12em',
      borderBottom: '1px solid #1a1a1a', paddingBottom: 6, marginBottom: 12,
      fontFamily: 'monospace',
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.08em', marginBottom: 5, fontFamily: 'monospace' }}>
      {children}
    </div>
  );
}

function Slider({ value, min, max, step = 1, onChange }: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', cursor: 'pointer', accentColor: 'white' }}
    />
  );
}

const segBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '5px 0', fontSize: 9,
  border: `1px solid ${active ? '#fff' : '#2a2a2a'}`,
  background: 'transparent',
  color: active ? '#fff' : '#484848',
  cursor: 'pointer', letterSpacing: '0.06em',
  fontFamily: 'monospace', textTransform: 'uppercase',
});

const actionBtn: React.CSSProperties = {
  width: '100%', padding: '8px 0', fontSize: 10,
  border: '1px solid #2a2a2a', background: 'transparent',
  color: '#777', cursor: 'pointer', letterSpacing: '0.08em',
  fontFamily: 'monospace',
};

const interactionBtn = (active: boolean, activeColor: string): React.CSSProperties => ({
  width: '100%', padding: '8px 0', fontSize: 10,
  border: `1px solid ${active ? activeColor : '#2a2a2a'}`,
  background: 'transparent',
  color: active ? activeColor : '#777',
  cursor: 'pointer', letterSpacing: '0.08em',
  fontFamily: 'monospace',
});

export function Controls(props: Props) {
  const { styleConfig: sc } = props;

  const nodeStyles: NodeStyle[] = ['circle', 'square', 'rect'];
  const lineStyles: LineStyle[] = ['solid', 'dashed'];

  return (
    <aside style={{
      width: 256, flexShrink: 0,
      background: '#0a0a0a', borderRight: '1px solid #1a1a1a',
      padding: '20px 16px',
      display: 'flex', flexDirection: 'column', gap: 20,
      overflowY: 'auto', fontFamily: 'monospace',
    }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 11, color: '#fff', letterSpacing: '0.14em', marginBottom: 2 }}>
          NxB OVERLAY TOOL
        </div>
        <div style={{ fontSize: 9, color: '#2e2e2e', letterSpacing: '0.08em' }}>v1 — Image Analysis</div>
      </div>

      {/* Upload */}
      <div>
        <SectionHeader>SOURCE</SectionHeader>
        <label style={{ cursor: 'pointer', display: 'block' }}>
          <input
            type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) props.onUpload(f); e.target.value = ''; }}
          />
          <div style={{
            border: '1px solid #2a2a2a', padding: '8px 0',
            fontSize: 10, color: '#777', textAlign: 'center',
            letterSpacing: '0.08em', cursor: 'pointer',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#555')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            UPLOAD IMAGE
          </div>
        </label>
        {props.hasImage && (
          <div style={{ fontSize: 9, color: '#393939', marginTop: 7, letterSpacing: '0.06em' }}>
            {props.nodeCount} nodes {props.connectionCount > 0 ? `· ${props.connectionCount} connections` : ''}
          </div>
        )}
      </div>

      {props.hasImage && (
        <>
          {/* Detection */}
          <div>
            <SectionHeader>DETECTION</SectionHeader>
            <FieldLabel>EDGE SENSITIVITY — {props.edgeSensitivity}</FieldLabel>
            <Slider value={props.edgeSensitivity} min={1} max={255} onChange={props.onSensitivityChange} />
            <div style={{ marginTop: 12 }}>
              <FieldLabel>NODE SPACING — {props.nodeSpacing}px</FieldLabel>
              <Slider value={props.nodeSpacing} min={5} max={200} onChange={props.onSpacingChange} />
            </div>
          </div>

          {/* Style */}
          <div>
            <SectionHeader>STYLE</SectionHeader>
            <FieldLabel>
              NODE SHAPE{sc.nodeStyle.length > 1 ? ` — MIXED (${sc.nodeStyle.length})` : ''}
            </FieldLabel>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {nodeStyles.map(s => (
                <button
                  key={s}
                  style={segBtn(sc.nodeStyle.includes(s))}
                  onClick={() => {
                    const active = sc.nodeStyle.includes(s);
                    if (active && sc.nodeStyle.length === 1) return;
                    props.onStyleChange({
                      nodeStyle: active
                        ? sc.nodeStyle.filter(n => n !== s)
                        : [...sc.nodeStyle, s],
                    });
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <FieldLabel>LINE STYLE</FieldLabel>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {lineStyles.map(s => (
                <button key={s} style={segBtn(sc.lineStyle === s)} onClick={() => props.onStyleChange({ lineStyle: s })}>
                  {s}
                </button>
              ))}
            </div>
            <FieldLabel>STROKE WIDTH — {sc.strokeWidth.toFixed(1)}px</FieldLabel>
            <Slider value={sc.strokeWidth} min={0.5} max={3} step={0.5} onChange={v => props.onStyleChange({ strokeWidth: v })} />
          </div>

          {/* Connections */}
          <div>
            <SectionHeader>CONNECTIONS</SectionHeader>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 10, color: '#888', cursor: 'pointer', marginBottom: 12,
            }}>
              <input
                type="checkbox" checked={props.enableConnections}
                onChange={e => props.onEnableConnectionsChange(e.target.checked)}
                style={{ accentColor: 'white', cursor: 'pointer' }}
              />
              AUTO-CONNECT NODES
            </label>
            {props.enableConnections && (
              <>
                <FieldLabel>MAX DISTANCE — {props.maxConnectionDistance}px</FieldLabel>
                <Slider value={props.maxConnectionDistance} min={20} max={500} onChange={props.onMaxDistChange} />
              </>
            )}
          </div>

          {/* Annotations */}
          <div>
            <SectionHeader>ANNOTATIONS</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                style={interactionBtn(props.interactionMode === 'place-spawn', 'white')}
                onClick={() => props.onInteractionModeChange('place-spawn')}
              >
                {props.interactionMode === 'place-spawn' ? 'CLICK IMAGE TO PLACE…' : 'PLACE SPAWN POINT'}
              </button>
              {props.hasSpawnPoint && (
                <button style={actionBtn} onClick={props.onClearSpawn}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#777')}
                >
                  CLEAR SPAWN
                </button>
              )}
              <button
                style={interactionBtn(props.interactionMode === 'mark-fault', '#e11d48')}
                onClick={() => props.onInteractionModeChange('mark-fault')}
              >
                {props.interactionMode === 'mark-fault' ? 'CLICK A NODE…' : 'MARK FAULT NODE'}
              </button>
              {props.hasFaultNodes && (
                <button style={actionBtn} onClick={props.onClearFaults}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#777')}
                >
                  CLEAR FAULTS
                </button>
              )}
            </div>
            {props.hasSpawnPoint && (
              <div style={{ marginTop: 12 }}>
                <FieldLabel>BACKGROUND OPACITY — {props.backgroundOpacity.toFixed(2)}</FieldLabel>
                <Slider value={props.backgroundOpacity} min={0} max={1} step={0.05} onChange={props.onBackgroundOpacityChange} />
              </div>
            )}
          </div>

          {/* Export */}
          <div>
            <SectionHeader>EXPORT</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button style={actionBtn} onClick={props.onExportPng}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#777')}
              >
                EXPORT PNG
              </button>
              <button style={actionBtn} onClick={props.onExportSvg}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#777')}
              >
                EXPORT SVG
              </button>
            </div>
          </div>

          {/* Debug toggle */}
          <button
            style={{ ...actionBtn, borderColor: props.showDebug ? '#444' : '#1a1a1a', color: props.showDebug ? '#aaa' : '#3a3a3a' }}
            onClick={props.onToggleDebug}
          >
            {props.showDebug ? 'HIDE DEBUG VIEW' : 'SHOW DEBUG VIEW'}
          </button>
        </>
      )}

      <div style={{ marginTop: 'auto', fontSize: 8, color: '#2a2a2a', lineHeight: 1.7, letterSpacing: '0.04em' }}>
        Detection quality varies. High-contrast geometric subjects work best.
        Adjust sliders to compensate for low-contrast or motion-blurred images.
      </div>
    </aside>
  );
}
