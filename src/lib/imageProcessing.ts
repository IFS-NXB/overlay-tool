export function toGrayscale(data: Uint8ClampedArray, count: number): Float32Array {
  const gray = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  return gray;
}

export function sobelMagnitude(gray: Float32Array, w: number, h: number): Float32Array {
  const mag = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = (dy: number, dx: number) => gray[(y + dy) * w + (x + dx)];
      const gx = -p(-1, -1) + p(-1, 1) - 2 * p(0, -1) + 2 * p(0, 1) - p(1, -1) + p(1, 1);
      const gy = -p(-1, -1) - 2 * p(-1, 0) - p(-1, 1) + p(1, -1) + 2 * p(1, 0) + p(1, 1);
      mag[y * w + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return mag;
}

export function normalizeMag(mag: Float32Array): Float32Array {
  let max = 0;
  for (const v of mag) if (v > max) max = v;
  if (max === 0) return new Float32Array(mag.length);
  const out = new Float32Array(mag.length);
  for (let i = 0; i < mag.length; i++) out[i] = (mag[i] / max) * 255;
  return out;
}

export function magToImageData(norm: Float32Array, w: number, h: number): ImageData {
  const id = new ImageData(w, h);
  for (let i = 0; i < norm.length; i++) {
    const v = Math.round(norm[i]);
    id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v;
    id.data[i * 4 + 3] = 255;
  }
  return id;
}
