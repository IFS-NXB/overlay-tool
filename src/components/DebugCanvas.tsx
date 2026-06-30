import { useEffect, useRef } from 'react';
import { magToImageData } from '../lib/imageProcessing';

interface Props {
  normMap: Float32Array;
  w: number;
  h: number;
}

export function DebugCanvas({ normMap, w, h }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.putImageData(magToImageData(normMap, w, h), 0, 0);
  }, [normMap, w, h]);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 9, color: '#444', marginBottom: 6, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
        EDGE DETECTION — GRADIENT MAGNITUDE MAP
      </div>
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        style={{ width: '100%', display: 'block', border: '1px solid #1a1a1a' }}
      />
    </div>
  );
}
