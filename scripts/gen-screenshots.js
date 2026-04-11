/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generates PWA screenshot placeholder PNGs.
 * Run: node scripts/gen-screenshots.js
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createPng(w, h) {
  const pixels = new Uint8Array(w * h * 4);

  // Background: #06060F (void)
  const bgR = 6, bgG = 6, bgB = 15;
  // Accent: #7C6EF5
  const acR = 124, acG = 110, acB = 245;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      // Header bar (top ~8%)
      const isHeader = y < h * 0.08;
      // Footer bar (bottom ~6%)
      const isFooter = y > h * 0.94;
      // Globe circle in center
      const cx = w * 0.5, cy = h * 0.46;
      const r = Math.min(w, h) * 0.22;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isGlobeRing = dist >= r * 0.85 && dist <= r;
      const isGlobeInner = dist < r * 0.85;
      // Emotion dots
      const dots = [
        { cx: cx, cy: cy - r * 0.55, r: r * 0.1, color: [255, 209, 102] },   // joy
        { cx: cx + r * 0.55, cy: cy, r: r * 0.08, color: [167, 139, 250] },   // fear
        { cx: cx, cy: cy + r * 0.55, r: r * 0.1, color: [6, 214, 160] },      // trust
        { cx: cx - r * 0.55, cy: cy, r: r * 0.08, color: [255, 107, 107] },   // anger
      ];
      const dot = dots.find((d) => {
        const ddx = x - d.cx, ddy = y - d.cy;
        return Math.sqrt(ddx * ddx + ddy * ddy) < d.r;
      });

      if (isHeader || isFooter) {
        pixels[idx] = 15; pixels[idx+1] = 15; pixels[idx+2] = 26; pixels[idx+3] = 255;
      } else if (dot) {
        pixels[idx] = dot.color[0]; pixels[idx+1] = dot.color[1]; pixels[idx+2] = dot.color[2]; pixels[idx+3] = 255;
      } else if (isGlobeRing) {
        pixels[idx] = acR; pixels[idx+1] = acG; pixels[idx+2] = acB; pixels[idx+3] = 255;
      } else if (isGlobeInner) {
        pixels[idx] = bgR + 6; pixels[idx+1] = bgG + 6; pixels[idx+2] = bgB + 12; pixels[idx+3] = 255;
      } else {
        pixels[idx] = bgR; pixels[idx+1] = bgG; pixels[idx+2] = bgB; pixels[idx+3] = 255;
      }
    }
  }

  function crc32(buf) {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    let crc = 0xffffffff;
    for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, "ascii");
    const lenBuf = Buffer.allocUnsafe(4); lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.allocUnsafe(1 + w * 4);
    row[0] = 0;
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4, di = 1 + x * 4;
      row[di] = pixels[si]; row[di+1] = pixels[si+1]; row[di+2] = pixels[si+2]; row[di+3] = pixels[si+3];
    }
    rows.push(row);
  }
  const compressed = zlib.deflateSync(Buffer.concat(rows), { level: 6 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
}

const outDir = path.join(__dirname, "../public/screenshots");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const screenshots = [
  { name: "desktop.png", w: 1280, h: 720 },
  { name: "mobile.png",  w: 390,  h: 844 },
];

for (const { name, w, h } of screenshots) {
  const buf = createPng(w, h);
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`✓ ${name} (${w}x${h}, ${buf.length} bytes)`);
}
console.log("Done.");
