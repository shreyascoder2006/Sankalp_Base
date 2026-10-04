import type { SceneData, LonLat } from './types'

/** Scene units are hundreds of metres, so a 35 km corridor spans ~350 units. */
export const UNITS_PER_M = 0.01
/** Real relief here is only 274 m over 37 km; without exaggeration the corridor
 *  reads as a flat plane. The HUD states the factor so the distortion is declared. */
export const VERTICAL_EXAGGERATION = 20

export class Projection {
  readonly lon0: number
  readonly lat0: number
  readonly mPerDegLon: number
  readonly mPerDegLat = 110574
  readonly elev: number[] | null
  readonly grid: number
  readonly bbox: SceneData['corridor']['bbox']
  readonly minElev: number
  readonly maxElev: number

  constructor(data: SceneData) {
    const b = data.corridor.bbox
    this.bbox = b
    this.lon0 = (b.west + b.east) / 2
    this.lat0 = (b.south + b.north) / 2
    this.mPerDegLon = 111320 * Math.cos((this.lat0 * Math.PI) / 180)
    this.elev = data.terrain.elevation
    this.grid = data.terrain.grid
    const e = this.elev ?? [0]
    this.minElev = Math.min(...e)
    this.maxElev = Math.max(...e)
  }

  x(lon: number) { return (lon - this.lon0) * this.mPerDegLon * UNITS_PER_M }
  z(lat: number) { return -(lat - this.lat0) * this.mPerDegLat * UNITS_PER_M }

  /** Bilinear sample of the terrain grid, in scene units. */
  y(lon: number, lat: number): number {
    if (!this.elev) return 0
    const b = this.bbox
    const gx = ((lon - b.west) / (b.east - b.west)) * (this.grid - 1)
    const gy = ((lat - b.south) / (b.north - b.south)) * (this.grid - 1)
    const cx = Math.max(0, Math.min(this.grid - 1, gx))
    const cy = Math.max(0, Math.min(this.grid - 1, gy))
    const x0 = Math.floor(cx), y0 = Math.floor(cy)
    const x1 = Math.min(this.grid - 1, x0 + 1), y1 = Math.min(this.grid - 1, y0 + 1)
    const fx = cx - x0, fy = cy - y0
    const at = (ix: number, iy: number) => this.elev![iy * this.grid + ix] ?? 0
    const top = at(x0, y1) * (1 - fx) + at(x1, y1) * fx
    const bot = at(x0, y0) * (1 - fx) + at(x1, y0) * fx
    const metres = bot * (1 - fy) + top * fy
    return (metres - this.minElev) * UNITS_PER_M * VERTICAL_EXAGGERATION
  }

  point(p: LonLat, lift = 0): [number, number, number] {
    return [this.x(p[0]), this.y(p[0], p[1]) + lift, this.z(p[1])]
  }

  path(pts: LonLat[], lift = 0): [number, number, number][] {
    return pts.map((p) => this.point(p, lift))
  }

  get widthUnits() {
    return (this.bbox.east - this.bbox.west) * this.mPerDegLon * UNITS_PER_M
  }
}
