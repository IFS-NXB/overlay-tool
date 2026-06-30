function download(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

export async function exportPng(
  img: HTMLImageElement,
  svg: SVGSVGElement,
  w: number,
  h: number,
  name: string,
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  // Serialize SVG overlay and composite on top
  const svgStr = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const tmp = new Image();
    tmp.onload = () => {
      ctx.drawImage(tmp, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve();
    };
    tmp.onerror = reject;
    tmp.src = url;
  });

  download(canvas.toDataURL('image/png'), `${name}.png`);
}

export async function exportSvg(
  img: HTMLImageElement,
  svg: SVGSVGElement,
  w: number,
  h: number,
  name: string,
): Promise<void> {
  // Embed source image as base64 so the SVG is self-contained
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');

  const clone = svg.cloneNode(true) as SVGSVGElement;
  const imgEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  imgEl.setAttribute('x', '0');
  imgEl.setAttribute('y', '0');
  imgEl.setAttribute('width', String(w));
  imgEl.setAttribute('height', String(h));
  imgEl.setAttribute('href', dataUrl);
  imgEl.setAttribute('preserveAspectRatio', 'none');
  clone.insertBefore(imgEl, clone.firstChild);

  const str = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  download(url, `${name}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
