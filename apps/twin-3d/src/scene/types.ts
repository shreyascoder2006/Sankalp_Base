export type LonLat = [number, number]

export interface Stop {
  point_key: string
  name: string
  arrive_min: number
  load_kg: number
  fare: number
  shares_branch: boolean
}

export interface Trip {
  truck_id: string
  depart_min: number
  arrive_min: number
  polyline: LonLat[]
  cum_km: number[]
  stops: Stop[]
  distance_km: number
  detour_km: number
  served_kg: number
  spare_kg: number
  provenance: string
}

export interface Refusal {
  point_key: string
  name: string
  load_kg: number
  detour_km: number
  diesel_cost: number
  revenue: number
  reason: string
  detail: string
  polyline: LonLat[]
}

export interface Village {
  key: string
  name: string
  lon: number
  lat: number
  branch_id: number
  branch_size: number
  solo_detour_km: number
}

export interface SceneData {
  generated_at: string
  corridor: {
    name: string
    bbox: { west: number; east: number; south: number; north: number }
    trunk_km: number
    origin: { key: string; name: string; lon: number; lat: number }
    dest: { key: string; name: string; lon: number; lat: number }
  }
  terrain: { grid: number; elevation: number[] | null; provenance: string; source: string | null }
  roads: { cls: string; pts: LonLat[] }[]
  villages: Village[]
  day: number
  horizon_min: number
  trips: Trip[]
  refusals: Refusal[]
  provenance: Record<string, string>
}
