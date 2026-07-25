// One-off, dependency-free PNG generator for the extension's toolbar/store
// icons — mirrors the main app's approach of generating icons from code
// (src/app/icon.tsx via next/og) instead of committing binary assets edited
// elsewhere. Re-run with `node generate-icons.mjs` after changing the design.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const BG = [0x11, 0x18, 0x27] // #111827, matches src/app/icon.tsx
const FG = [0xf9, 0xfa, 0xfb] // near-white

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

// Two interlocking ring outlines — a simplified chain-link glyph.
function pixelColor(x, y, n) {
  const c1 = [0.38 * n, 0.62 * n]
  const c2 = [0.62 * n, 0.38 * n]
  const outer = 0.3 * n
  const inner = 0.16 * n

  for (const [cx, cy] of [c1, c2]) {
    const d = Math.hypot(x - cx, y - cy)
    if (d >= inner && d <= outer) return FG
  }
  return BG
}

function makePng(n) {
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(n, 0)
  ihdrData.writeUInt32BE(n, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type: RGBA
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0

  const raw = Buffer.alloc(n * (1 + n * 4))
  for (let y = 0; y < n; y++) {
    const rowStart = y * (1 + n * 4)
    raw[rowStart] = 0 // filter type: none
    for (let x = 0; x < n; x++) {
      const [r, g, b] = pixelColor(x, y, n)
      const off = rowStart + 1 + x * 4
      raw[off] = r
      raw[off + 1] = g
      raw[off + 2] = b
      raw[off + 3] = 255
    }
  }

  const idatData = deflateSync(raw)
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdrData),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [16, 48, 128]) {
  writeFileSync(new URL(`./icon${size}.png`, import.meta.url), makePng(size))
  console.log(`wrote icon${size}.png`)
}
