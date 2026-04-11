/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generates minimal PWA icon PNGs using pure Node.js (no external deps).
 * Creates solid-color icons with the WEM brand colors.
 * Run: node scripts/gen-icons.js
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createPng(size, bgR, bgG, bgB, accentR, accentG, accentB) {
  // Draw a simple icon: dark bg with accent circle
  const pixels = new Uint8Array(size * size * 4); // RGBA

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.38;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Globe ring
      const isRing = dist >= innerR && dist <= outerR;

      // Meridian (vertical ellipse approximation)
      const meridianX = Math.abs(dx / (outerR * 0.4));
      const meridianY = Math.abs(dy / outerR);
      const isMeridian =
        Math.abs(
          Math.sqrt(meridianX * meridianX + meridianY * meridianY) - 1
        ) < 0.08 && dist < outerR;

      // Equator
      const isEquator = Math.abs(dy) < size * 0.025 && dist < outerR;

      pixels[idx] = bgR;
      pixels[idx + 1] = bgG;
      pixels[idx + 2] = bgB;
      pixels[idx + 3] = 255;

      if (isRing || isMeridian || isEquator) {
        const alpha = isRing ? 255 : 180;
        pixels[idx] = accentR;
        pixels[idx + 1] = accentG;
        pixels[idx + 2] = accentB;
        pixels[idx + 3] = alpha;
      }
    }
  }

  // Build PNG
  function crc32(buf) {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c;
    }
    let crc = 0xffffffff;
    for (const byte of buf) {
      crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, "ascii");
    const lenBuf = Buffer.allocUnsafe(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.allocUnsafe(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB (no alpha for simplicity... actually use 6 for RGBA)
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT: raw rows with filter byte 0
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 4);
    row[0] = 0; // filter None
    for (let x = 0; x < size; x++) {
      const si = (y * size + x) * 4;
      const di = 1 + x * 4;
      row[di] = pixels[si];
      row[di + 1] = pixels[si + 1];
      row[di + 2] = pixels[si + 2];
      row[di + 3] = pixels[si + 3];
    }
    rows.push(row);
  }
  const rawData = Buffer.concat(rows);
  const compressed = zlib.deflateSync(rawData, { level: 6 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "../public/icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Dark bg: #06060F, Accent: #7C6EF5
const bg = [6, 6, 15];
const accent = [124, 110, 245];

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of sizes) {
  const buf = createPng(size, ...bg, ...accent);
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`✓ ${name} (${size}x${size}, ${buf.length} bytes)`);
}
console.log("Done.");
