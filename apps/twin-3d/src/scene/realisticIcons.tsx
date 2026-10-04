import React from 'react'
import * as THREE from 'three'

function safeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
  } else {
    const radius = Math.min(r, w / 2, h / 2)
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + h, radius)
    ctx.arcTo(x + w, y + h, x, y + h, radius)
    ctx.arcTo(x, y + h, x, y, radius)
    ctx.arcTo(x, y, x + w, y, radius)
    ctx.closePath()
  }
}

/**
 * Generates an ultra-crisp, realistic 2D canvas of an authentic Indian
 * Mahindra Bolero Maxi Truck / SCV loaded with harvest crates.
 */
export function createRealisticTruckCanvas(width = 512, height = 320): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.clearRect(0, 0, width, height)

  // Coordinate space: width 512, height 320. Truck faces right-to-left or left-to-right.
  // Here we orient it facing right (cab on right, cargo bed on left) so driving forward is natural.
  // Center truck horizontally, baseline at y = 240.

  // 1. Soft Ground Contact Shadow
  const shadowGrad = ctx.createRadialGradient(256, 260, 40, 256, 260, 230)
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)')
  shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)')
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.ellipse(256, 260, 220, 22, 0, 0, Math.PI * 2)
  ctx.fill()

  // 2. Chassis Frame & Undercarriage Details
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(90, 215, 330, 16) // Main ladder frame rail

  // Diesel fuel tank (under bed, driver side)
  const tankGrad = ctx.createLinearGradient(190, 212, 190, 236)
  tankGrad.addColorStop(0, '#64748b')
  tankGrad.addColorStop(0.5, '#334155')
  tankGrad.addColorStop(1, '#0f172a')
  ctx.fillStyle = tankGrad
  ctx.beginPath()
  safeRoundRect(ctx, 185, 214, 75, 22, 6)
  ctx.fill()
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Under-chassis Spare Wheel (under rear bed)
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.ellipse(115, 226, 32, 14, 0, 0, Math.PI * 2)
  ctx.fill()

  // Exhaust pipe & silencer
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(270, 228)
  ctx.lineTo(170, 228)
  ctx.lineTo(165, 236)
  ctx.stroke()

  // 3. Harvest Cargo Crates in Open Bed (Dala)
  // Stacked colorful agricultural crates: tomatoes (red), onions (orange/gold), vegetables (green)
  const drawCrate = (x: number, y: number, w: number, h: number, color: string, rimColor: string) => {
    // Crate main body
    ctx.fillStyle = color
    ctx.beginPath()
    safeRoundRect(ctx, x, y, w, h, 3)
    ctx.fill()

    // Crate top rim lip
    ctx.fillStyle = rimColor
    ctx.fillRect(x, y, w, 5)

    // Ventilation slots (horizontal crate slots)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.fillRect(x + 5, y + 9, w - 10, 3)
    ctx.fillRect(x + 5, y + 16, w - 10, 3)
    ctx.fillRect(x + 5, y + 23, w - 10, 3)

    // Side handle cut-out
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    safeRoundRect(ctx, x + w / 2 - 10, y + 12, 20, 6, 3)
    ctx.fill()

    // Corner reinforcement brackets
    ctx.fillStyle = rimColor
    ctx.fillRect(x, y, 4, h)
    ctx.fillRect(x + w - 4, y, 4, h)
  }

  // Row 1 (Bottom crates in bed: Red Tomatoes)
  drawCrate(62, 154, 58, 30, '#dc2626', '#b91c1c')
  drawCrate(124, 154, 58, 30, '#ef4444', '#dc2626')
  drawCrate(186, 154, 58, 30, '#dc2626', '#991b1b')
  drawCrate(248, 154, 58, 30, '#ef4444', '#b91c1c')

  // Row 2 (Middle crates: Golden Onions)
  drawCrate(68, 122, 58, 30, '#ea580c', '#c2410c')
  drawCrate(130, 122, 58, 30, '#f97316', '#ea580c')
  drawCrate(192, 122, 58, 30, '#ea580c', '#c2410c')
  drawCrate(254, 122, 52, 30, '#f97316', '#c2410c')

  // Row 3 (Top crates: Fresh Green Vegetables)
  drawCrate(84, 90, 56, 30, '#16a34a', '#15803d')
  drawCrate(144, 90, 56, 30, '#22c55e', '#16a34a')
  drawCrate(204, 90, 56, 30, '#16a34a', '#15803d')

  // Tarpaulin tie-down rope lashing across crates
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(60, 185)
  ctx.lineTo(144, 90)
  ctx.lineTo(204, 185)
  ctx.lineTo(260, 90)
  ctx.lineTo(306, 185)
  ctx.stroke()
  ctx.setLineDash([])

  // 4. Cargo Stake-Bed ("Dala") Side Walls & Gate
  // Bed floor platform
  ctx.fillStyle = '#334155'
  ctx.fillRect(52, 184, 258, 10)

  // Slatted wooden/metal side rails of Dala
  ctx.fillStyle = '#475569'
  ctx.fillRect(52, 148, 258, 8)
  ctx.fillRect(52, 166, 258, 8)

  // Vertical steel stanchions / stakes
  ctx.fillStyle = '#1e293b'
  ;[52, 114, 176, 238, 300].forEach((sx) => {
    ctx.fillRect(sx, 142, 10, 52)
  })

  // Reflective yellow & red hazard stripes along the cargo bed base
  for (let hx = 56; hx < 300; hx += 18) {
    ctx.fillStyle = '#facc15'
    ctx.fillRect(hx, 186, 9, 6)
    ctx.fillStyle = '#dc2626'
    ctx.fillRect(hx + 9, 186, 9, 6)
  }

  // Rear tailgate latch and hinge
  ctx.fillStyle = '#94a3b8'
  ctx.fillRect(50, 160, 6, 24)

  // 5. Authentic Bolero Cab Body (Right side facing)
  // Cab main body gradient (White metallic Mahindra styling)
  const cabGrad = ctx.createLinearGradient(300, 80, 480, 240)
  cabGrad.addColorStop(0, '#ffffff')
  cabGrad.addColorStop(0.6, '#f1f5f9')
  cabGrad.addColorStop(1, '#cbd5e1')

  ctx.fillStyle = cabGrad
  ctx.beginPath()
  // Start from back of cab
  ctx.moveTo(308, 194)
  ctx.lineTo(308, 86) // Cab back vertical
  // Roof with slight curve
  ctx.quadraticCurveTo(340, 82, 386, 84)
  // Roof sun visor overhang
  ctx.lineTo(396, 92)
  // Sloped Windshield
  ctx.lineTo(436, 150)
  // Hood forward slope
  ctx.lineTo(476, 160)
  // Front nose curve
  ctx.quadraticCurveTo(484, 164, 484, 180)
  // Front grille / headlight face down to bumper
  ctx.lineTo(484, 214)
  // Bottom of front body
  ctx.lineTo(438, 214)
  // Front wheel arch
  ctx.arc(395, 214, 48, 0, Math.PI, true)
  // Undercab sill
  ctx.lineTo(308, 214)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  ctx.stroke()

  // Cab Roof Sun Visor / Wind Deflector (Black / dark accent)
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.moveTo(375, 82)
  ctx.lineTo(402, 90)
  ctx.lineTo(398, 97)
  ctx.lineTo(370, 87)
  ctx.closePath()
  ctx.fill()

  // Slanted Tinted Windshield Glass
  const glassGrad = ctx.createLinearGradient(390, 92, 436, 150)
  glassGrad.addColorStop(0, '#0f172a')
  glassGrad.addColorStop(0.5, '#1e293b')
  glassGrad.addColorStop(1, '#334155')
  ctx.fillStyle = glassGrad
  ctx.beginPath()
  ctx.moveTo(392, 92)
  ctx.lineTo(376, 92)
  ctx.lineTo(376, 150)
  ctx.lineTo(430, 150)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Windshield glass reflection streak
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.beginPath()
  ctx.moveTo(404, 96)
  ctx.lineTo(396, 96)
  ctx.lineTo(418, 146)
  ctx.lineTo(426, 146)
  ctx.closePath()
  ctx.fill()

  // Side Cab Window
  ctx.fillStyle = glassGrad
  ctx.beginPath()
  ctx.moveTo(320, 96)
  ctx.lineTo(368, 96)
  ctx.lineTo(368, 150)
  ctx.lineTo(320, 150)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Door Cutline & Handle
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(316, 94)
  ctx.lineTo(316, 210)
  ctx.stroke()

  // Chrome Door Handle
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(330, 160, 22, 6)
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(332, 161, 18, 3)

  // Black Side Rearview Mirror
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  safeRoundRect(ctx, 386, 134, 10, 24, 3)
  ctx.fill()
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(380, 146)
  ctx.lineTo(386, 146)
  ctx.stroke()

  // Front Slotted Grille (Mahindra 7-slot vertical grille accent)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(478, 174, 6, 34)
  ctx.fillStyle = '#f1f5f9'
  for (let gy = 176; gy < 206; gy += 6) {
    ctx.fillRect(479, gy, 4, 3)
  }

  // Headlight Assembly
  // Chrome reflector
  ctx.fillStyle = '#e2e8f0'
  ctx.beginPath()
  safeRoundRect(ctx, 470, 166, 12, 18, 2)
  ctx.fill()
  // Lens glass
  ctx.fillStyle = '#fef08a'
  ctx.beginPath()
  safeRoundRect(ctx, 472, 168, 8, 14, 2)
  ctx.fill()
  // Amber Turn Signal on side
  ctx.fillStyle = '#f59e0b'
  ctx.fillRect(464, 170, 5, 12)

  // Front Heavy-duty Bumper
  const bmphGrad = ctx.createLinearGradient(460, 210, 492, 230)
  bmphGrad.addColorStop(0, '#334155')
  bmphGrad.addColorStop(1, '#0f172a')
  ctx.fillStyle = bmphGrad
  ctx.beginPath()
  safeRoundRect(ctx, 455, 208, 36, 22, 4)
  ctx.fill()

  // Yellow Indian Commercial License Plate (MH-15)
  ctx.fillStyle = '#facc15'
  ctx.fillRect(468, 214, 20, 10)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.strokeRect(468, 214, 20, 10)
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 6px monospace'
  ctx.fillText('MH15', 470, 222)

  // Rear Wheel Arch
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.arc(150, 214, 48, 0, Math.PI, true)
  ctx.fill()

  // Rear Tail Lamp cluster & mudflap
  ctx.fillStyle = '#dc2626'
  ctx.fillRect(48, 194, 6, 14)
  ctx.fillStyle = '#f59e0b'
  ctx.fillRect(48, 208, 6, 6)
  // Mudflap
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(96, 220, 8, 24)

  // 6. Heavy-Duty Commercial Road Wheels (Rear at 150, Front at 395)
  const drawWheel = (cx: number, cy: number) => {
    // Outer Rubber Tire with Deep Tread
    ctx.fillStyle = '#111827'
    ctx.beginPath()
    ctx.arc(cx, cy, 42, 0, Math.PI * 2)
    ctx.fill()

    // Outer tire tread notches
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 3
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38)
      ctx.lineTo(cx + Math.cos(a) * 43, cy + Math.sin(a) * 43)
      ctx.stroke()
    }

    // Inner tire wall groove
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, 34, 0, Math.PI * 2)
    ctx.stroke()

    // Heavy-duty Steel Rim
    const rimGrad = ctx.createRadialGradient(cx - 5, cy - 5, 4, cx, cy, 28)
    rimGrad.addColorStop(0, '#f1f5f9')
    rimGrad.addColorStop(0.5, '#cbd5e1')
    rimGrad.addColorStop(1, '#64748b')
    ctx.fillStyle = rimGrad
    ctx.beginPath()
    ctx.arc(cx, cy, 26, 0, Math.PI * 2)
    ctx.fill()

    // Rim cooling cutouts (5 circular holes)
    ctx.fillStyle = '#1e293b'
    for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 5) {
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Center Steel Hub & 5 Chrome Lug Nuts
    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.arc(cx, cy, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#f8fafc'
    for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 5) {
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a + 0.3) * 7, cy + Math.sin(a + 0.3) * 7, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Draw Rear and Front Wheels
  drawWheel(150, 218)
  drawWheel(395, 218)

  return canvas
}

/**
 * Generates an authentic APMC Wholesale Mandi Terminal Canvas Icon.
 */
export function createRealisticMandiCanvas(width = 512, height = 400): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.clearRect(0, 0, width, height)

  // 1. Concrete Ground Apron / Yard Platform
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  safeRoundRect(ctx, 40, 280, 432, 60, 8)
  ctx.fill()

  // Yellow and black safety hazard curb
  for (let x = 40; x < 472; x += 24) {
    ctx.fillStyle = '#eab308'
    ctx.fillRect(x, 332, 12, 8)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(x + 12, 332, 12, 8)
  }

  // 2. Main Wholesale Auction Hall Pavilion
  // Steel Support Columns
  ctx.fillStyle = '#475569'
  ;[80, 160, 240, 320, 400].forEach((px) => {
    ctx.fillRect(px, 140, 14, 140)
  })

  // Triangular Gabled Industrial Corrugated Roof
  const roofGrad = ctx.createLinearGradient(256, 40, 256, 140)
  roofGrad.addColorStop(0, '#1d4ed8')
  roofGrad.addColorStop(0.5, '#2563eb')
  roofGrad.addColorStop(1, '#1e40af')

  ctx.fillStyle = roofGrad
  ctx.beginPath()
  ctx.moveTo(256, 46) // Roof apex
  ctx.lineTo(470, 138)
  ctx.lineTo(460, 148)
  ctx.lineTo(256, 72)
  ctx.lineTo(52, 148)
  ctx.lineTo(42, 138)
  ctx.closePath()
  ctx.fill()

  // Corrugation roof ridges
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.lineWidth = 2
  for (let rx = 70; rx < 450; rx += 20) {
    ctx.beginPath()
    ctx.moveTo(256, 52)
    ctx.lineTo(rx, 140)
    ctx.stroke()
  }

  // Pediment Gable Truss Arch & APMC Insignia
  ctx.fillStyle = '#1e3a8a'
  ctx.beginPath()
  ctx.moveTo(256, 74)
  ctx.lineTo(440, 140)
  ctx.lineTo(72, 140)
  ctx.closePath()
  ctx.fill()

  // APMC Golden Wheat / Grain Stalk Emblem
  ctx.fillStyle = '#facc15'
  ctx.font = 'bold 20px "Inter", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('APMC MARKET', 256, 124)

  // 3. Stacks of produce crates under the auction pavilion
  const drawMiniCrate = (x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x, y, 22, 12)
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(x + 2, y + 2, 18, 2)
  }

  // Red tomato crates & orange onion sacks on platform
  ;[104, 184, 264, 344].forEach((cx) => {
    drawMiniCrate(cx, 268, '#dc2626')
    drawMiniCrate(cx + 24, 268, '#ea580c')
    drawMiniCrate(cx + 8, 254, '#16a34a')
    drawMiniCrate(cx + 28, 254, '#dc2626')
    drawMiniCrate(cx + 18, 240, '#f59e0b')
  })

  // 4. Weighbridge / Dharamkanta Scale Hut on the right
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(410, 230, 52, 50)
  ctx.fillStyle = '#22c55e'
  ctx.font = 'bold 10px monospace'
  ctx.fillText('SCALE', 436, 246)
  ctx.fillStyle = '#ef4444'
  ctx.fillRect(418, 254, 36, 12)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 8px monospace'
  ctx.fillText('WEIGH', 436, 263)

  // Yard Floodlight Mast on the left
  ctx.fillStyle = '#64748b'
  ctx.fillRect(56, 100, 6, 180)
  ctx.fillStyle = '#fef08a'
  ctx.beginPath()
  ctx.arc(59, 96, 10, 0, Math.PI * 2)
  ctx.fill()

  return canvas
}

/**
 * Generates an authentic Fleet Dispatch Hub & Staging Terminal Canvas Icon.
 */
export function createRealisticHubCanvas(width = 512, height = 400): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.clearRect(0, 0, width, height)

  // Ground Pavement & Fuel Staging Island
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  safeRoundRect(ctx, 50, 270, 412, 70, 8)
  ctx.fill()

  // Blue Fleet Staging Curbs
  ctx.fillStyle = '#2563eb'
  ctx.fillRect(50, 332, 412, 8)

  // Dispatch Cabin (Left side)
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  safeRoundRect(ctx, 80, 160, 150, 110, 6)
  ctx.fill()
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 2
  ctx.stroke()

  // Cabin Windows & Antenna
  ctx.fillStyle = '#38bdf8'
  ctx.fillRect(100, 185, 45, 35)
  ctx.fillRect(160, 185, 45, 35)
  // Rooftop Comms Antenna
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(155, 160)
  ctx.lineTo(155, 100)
  ctx.stroke()
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.arc(155, 96, 6, 0, Math.PI * 2)
  ctx.fill()

  // Commercial Diesel Bowser Island (Right side)
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  safeRoundRect(ctx, 280, 150, 140, 120, 6)
  ctx.fill()
  // Diesel Pumps
  ctx.fillStyle = '#0284c7'
  ctx.fillRect(305, 175, 40, 75)
  ctx.fillRect(360, 175, 40, 75)
  // Overhead Canopy Roof
  ctx.fillStyle = '#1e40af'
  ctx.fillRect(260, 130, 180, 20)

  // Fleet Badge Text
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px "Inter", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('FLEET STAGING', 256, 310)

  return canvas
}

// Cached Three.js CanvasTextures
let truckTextureCache: THREE.CanvasTexture | null = null
let mandiTextureCache: THREE.CanvasTexture | null = null
let hubTextureCache: THREE.CanvasTexture | null = null

export function getRealisticTruckTexture(): THREE.CanvasTexture {
  if (!truckTextureCache) {
    const canvas = createRealisticTruckCanvas()
    truckTextureCache = new THREE.CanvasTexture(canvas)
    truckTextureCache.generateMipmaps = true
    truckTextureCache.minFilter = THREE.LinearMipmapLinearFilter
    truckTextureCache.magFilter = THREE.LinearFilter
    truckTextureCache.needsUpdate = true
  }
  return truckTextureCache
}

export function getRealisticMandiTexture(): THREE.CanvasTexture {
  if (!mandiTextureCache) {
    const canvas = createRealisticMandiCanvas()
    mandiTextureCache = new THREE.CanvasTexture(canvas)
    mandiTextureCache.generateMipmaps = true
    mandiTextureCache.minFilter = THREE.LinearMipmapLinearFilter
    mandiTextureCache.magFilter = THREE.LinearFilter
    mandiTextureCache.needsUpdate = true
  }
  return mandiTextureCache
}

export function getRealisticHubTexture(): THREE.CanvasTexture {
  if (!hubTextureCache) {
    const canvas = createRealisticHubCanvas()
    hubTextureCache = new THREE.CanvasTexture(canvas)
    hubTextureCache.generateMipmaps = true
    hubTextureCache.minFilter = THREE.LinearMipmapLinearFilter
    hubTextureCache.magFilter = THREE.LinearFilter
    hubTextureCache.needsUpdate = true
  }
  return hubTextureCache
}

/**
 * High-definition vector SVG component for the Realistic Indian SCV Truck (Mahindra Bolero Maxi Truck).
 * Can be dropped anywhere in React 2D HUD / Dashboards.
 */
export const RealisticTruckIcon: React.FC<{
  width?: number | string
  height?: number | string
  className?: string
  accentColor?: string
}> = ({ width = 28, height = 20, className = '', accentColor = '#3ddc97' }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 512 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: 'middle', display: 'inline-block' }}
    >
      {/* Ground Shadow */}
      <ellipse cx="256" cy="260" rx="220" ry="22" fill="#000000" fillOpacity="0.45" />

      {/* Ladder Chassis */}
      <rect x="90" y="215" width="330" height="16" rx="3" fill="#1E293B" />
      {/* Diesel Fuel Tank */}
      <rect x="185" y="214" width="75" height="22" rx="6" fill="#334155" stroke="#475569" strokeWidth="2" />
      {/* Spare Tire */}
      <ellipse cx="115" cy="226" rx="32" ry="14" fill="#0F172A" />

      {/* Harvest Crates - Row 1 (Red Tomatoes) */}
      <rect x="62" y="154" width="58" height="30" rx="3" fill="#DC2626" />
      <rect x="62" y="154" width="58" height="5" fill="#B91C1C" />
      <rect x="124" y="154" width="58" height="30" rx="3" fill="#EF4444" />
      <rect x="124" y="154" width="58" height="5" fill="#DC2626" />
      <rect x="186" y="154" width="58" height="30" rx="3" fill="#DC2626" />
      <rect x="186" y="154" width="58" height="5" fill="#991B1B" />
      <rect x="248" y="154" width="58" height="30" rx="3" fill="#EF4444" />
      <rect x="248" y="154" width="58" height="5" fill="#B91C1C" />

      {/* Harvest Crates - Row 2 (Golden Onions) */}
      <rect x="68" y="122" width="58" height="30" rx="3" fill="#EA580C" />
      <rect x="68" y="122" width="58" height="5" fill="#C2410C" />
      <rect x="130" y="122" width="58" height="30" rx="3" fill="#F97316" />
      <rect x="130" y="122" width="58" height="5" fill="#EA580C" />
      <rect x="192" y="122" width="58" height="30" rx="3" fill="#EA580C" />
      <rect x="192" y="122" width="58" height="5" fill="#C2410C" />

      {/* Harvest Crates - Row 3 (Green Vegetables) */}
      <rect x="84" y="90" width="56" height="30" rx="3" fill="#16A34A" />
      <rect x="84" y="90" width="56" height="5" fill="#15803D" />
      <rect x="144" y="90" width="56" height="30" rx="3" fill="#22C55E" />
      <rect x="144" y="90" width="56" height="5" fill="#16A34A" />
      <rect x="204" y="90" width="56" height="30" rx="3" fill="#16A34A" />
      <rect x="204" y="90" width="56" height="5" fill="#15803D" />

      {/* Rope Lashing */}
      <path
        d="M60 185L144 90L204 185L260 90L306 185"
        stroke="#FBBF24"
        strokeWidth="2.5"
        strokeDasharray="6 4"
      />

      {/* Cargo Bed Slats & Stakes */}
      <rect x="52" y="184" width="258" height="10" fill="#334155" />
      <rect x="52" y="148" width="258" height="8" fill="#475569" />
      <rect x="52" y="166" width="258" height="8" fill="#475569" />
      <rect x="52" y="142" width="10" height="52" fill="#1E293B" />
      <rect x="114" y="142" width="10" height="52" fill="#1E293B" />
      <rect x="176" y="142" width="10" height="52" fill="#1E293B" />
      <rect x="238" y="142" width="10" height="52" fill="#1E293B" />
      <rect x="300" y="142" width="10" height="52" fill="#1E293B" />

      {/* Bolero Cab */}
      <path
        d="M308 194V86C340 82 386 84 386 84L396 92L436 150L476 160C484 164 484 180 484 180V214H438C438 187 352 187 352 214H308V194Z"
        fill="#F8FAFC"
        stroke="#94A3B8"
        strokeWidth="2.5"
      />

      {/* Sun Visor */}
      <polygon points="375,82 402,90 398,97 370,87" fill="#0F172A" />

      {/* Tinted Windshield Glass */}
      <polygon points="392,92 376,92 376,150 430,150" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
      {/* Side Window */}
      <rect x="320" y="96" width="48" height="54" rx="2" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />

      {/* Door Handle & Rearview Mirror */}
      <rect x="330" y="160" width="22" height="6" rx="2" fill="#1E293B" />
      <rect x="332" y="161" width="18" height="3" fill="#F8FAFC" />
      <rect x="386" y="134" width="10" height="24" rx="3" fill="#0F172A" />

      {/* Headlight & Amber Indicator */}
      <rect x="470" y="166" width="12" height="18" rx="2" fill="#FEF08A" />
      <rect x="464" y="170" width="5" height="12" fill="#F59E0B" />

      {/* Front Bumper & Yellow MH-15 Plate */}
      <rect x="455" y="208" width="36" height="22" rx="4" fill="#1E293B" />
      <rect x="468" y="214" width="20" height="10" rx="1" fill="#FACC15" stroke="#000000" strokeWidth="1" />

      {/* Wheels */}
      {/* Rear Wheel */}
      <circle cx="150" cy="218" r="42" fill="#111827" />
      <circle cx="150" cy="218" r="26" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
      <circle cx="150" cy="218" r="10" fill="#334155" />
      {/* Front Wheel */}
      <circle cx="395" cy="218" r="42" fill="#111827" />
      <circle cx="395" cy="218" r="26" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
      <circle cx="395" cy="218" r="10" fill="#334155" />

      {/* Accent Status Glow Indicator Dot */}
      <circle cx="488" cy="180" r="5" fill={accentColor} />
    </svg>
  )
}

/**
 * High-definition vector SVG component for the Realistic APMC Wholesale Mandi Complex.
 */
export const RealisticMandiIcon: React.FC<{
  width?: number | string
  height?: number | string
  className?: string
}> = ({ width = 28, height = 22, className = '' }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 512 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: 'middle', display: 'inline-block' }}
    >
      {/* Raised Concrete Apron */}
      <rect x="40" y="280" width="432" height="60" rx="8" fill="#1E293B" />
      {/* Hazard Curb */}
      <rect x="40" y="332" width="432" height="8" fill="#EAB308" />

      {/* Columns */}
      <rect x="80" y="140" width="14" height="140" fill="#475569" />
      <rect x="160" y="140" width="14" height="140" fill="#475569" />
      <rect x="240" y="140" width="14" height="140" fill="#475569" />
      <rect x="320" y="140" width="14" height="140" fill="#475569" />
      <rect x="400" y="140" width="14" height="140" fill="#475569" />

      {/* Corrugated Gabled Roof */}
      <polygon points="256,46 470,138 460,148 256,72 52,148 42,138" fill="#2563EB" />
      {/* Pediment Arch */}
      <polygon points="256,74 440,140 72,140" fill="#1E3A8A" />

      {/* Stacks of Crate Boxes */}
      <rect x="104" y="268" width="22" height="12" fill="#DC2626" />
      <rect x="128" y="268" width="22" height="12" fill="#EA580C" />
      <rect x="114" y="254" width="22" height="12" fill="#16A34A" />

      <rect x="264" y="268" width="22" height="12" fill="#DC2626" />
      <rect x="288" y="268" width="22" height="12" fill="#EA580C" />
      <rect x="274" y="254" width="22" height="12" fill="#F59E0B" />

      {/* Weighbridge Tower */}
      <rect x="410" y="230" width="52" height="50" rx="3" fill="#0F172A" stroke="#334155" strokeWidth="2" />
      <rect x="418" y="254" width="36" height="12" fill="#EF4444" />
      <circle cx="436" cy="242" r="4" fill="#22C55E" />
    </svg>
  )
}
