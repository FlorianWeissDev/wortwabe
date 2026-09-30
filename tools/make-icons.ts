// Generates the PWA icons (PNG via node:zlib only) and the favicon into public/.
// Run with `npm run make:icons`. Output is committed, so this only reruns on design changes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

type Rgb = [number, number, number];
type Point = [number, number];

const CREAM: Rgb = [0xff, 0xfd, 0xf7];
const HONEY: Rgb = [0xf2, 0xc9, 0x4c];
const EDGE: Rgb = [0xe0, 0xa8, 0x00];

/** Pointy-top regular hexagon. */
function hexagon(cx: number, cy: number, radius: number): Point[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 90);
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)] as Point;
  });
}

/** Ray-casting point-in-polygon test. */
function inside(poly: Point[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i] as Point;
    const [xj, yj] = poly[j] as Point;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** Color at a point: edge ring, honey body, bold inner hexagon, cream background. */
function colorAt(size: number, scale: number, x: number, y: number): Rgb {
  const c = size / 2;
  const r = (size / 2) * scale;
  if (inside(hexagon(c, c, r * 0.36), x, y)) return EDGE;
  if (inside(hexagon(c, c, r * 0.9), x, y)) return HONEY;
  if (inside(hexagon(c, c, r), x, y)) return EDGE;
  return CREAM;
}

const SS = 4; // 4x4 supersampling

function render(size: number, scale: number): Buffer {
  // One filter byte (0 = none) plus RGB per pixel, per scanline.
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let py = 0; py < size; py++) {
    const row = py * (size * 3 + 1);
    for (let px = 0; px < size; px++) {
      const sum: Rgb = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const rgb = colorAt(size, scale, px + (sx + 0.5) / SS, py + (sy + 0.5) / SS);
          for (let k = 0; k < 3; k++) sum[k] = (sum[k] ?? 0) + (rgb[k] ?? 0);
        }
      }
      for (let k = 0; k < 3; k++) raw[row + 1 + px * 3 + k] = Math.round((sum[k] ?? 0) / (SS * SS));
    }
  }
  return encodePng(size, raw);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function encodePng(size: number, raw: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB, no alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function faviconSvg(): string {
  const pts = (poly: Point[]) =>
    poly.map(([x, y]) => `${+x.toFixed(2)},${+y.toFixed(2)}`).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <polygon points="${pts(hexagon(32, 32, 30))}" fill="#e0a800"/>
  <polygon points="${pts(hexagon(32, 32, 27))}" fill="#f2c94c"/>
  <polygon points="${pts(hexagon(32, 32, 11))}" fill="#e0a800"/>
</svg>
`;
}

mkdirSync('public/icons', { recursive: true });
// Hexagon fills 90% of the canvas; the maskable one stays inside the 80% safe zone.
writeFileSync('public/icons/icon-192.png', render(192, 0.9));
writeFileSync('public/icons/icon-512.png', render(512, 0.9));
writeFileSync('public/icons/icon-maskable-512.png', render(512, 0.72));
writeFileSync('public/icons/apple-touch-icon.png', render(180, 0.86));
writeFileSync('public/favicon.svg', faviconSvg());
console.log('Icons written to public/');
