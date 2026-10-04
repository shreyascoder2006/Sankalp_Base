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

export interface Unserved {
  farmer: string
  village: string
  point_key: string
  load_kg: number
  detour_km: number
  diesel_cost: number
  revenue: number
  reason: 'capacity' | 'economics' | 'no truck free' | string
  detail: string
  polyline: LonLat[]
}

export interface LotSpec {
  village: string
  kg: number
  crop: string
  farmer: string
}

export interface TruckSpec {
  truck_id: string
  home: string
  spare_kg: number
  laden_kg: number
  depart_hour: number
}

export interface Facts {
  full_truck_fare: number
  served: number
  unserved: number
  total_fare: number
  cheapest_fare: number
  detour_km: number
  brief_fare: number
  saving_vs_full_truck: number
}

export interface Scenario {
  key: string
  title: string
  question: string
  takeaway: string
  lots: LotSpec[]
  trucks: TruckSpec[]
  trips: Trip[]
  unserved: Unserved[]
  facts: Facts
  horizon_min: number
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

export interface Corridor {
  name: string
  bbox: { west: number; east: number; south: number; north: number }
  trunk_km: number
  origin: { key: string; name: string; lon: number; lat: number }
  dest: { key: string; name: string; lon: number; lat: number }
}

export interface EconParam {
  name: string
  value: number
  provenance: 'REAL' | 'MODELED' | 'SIMULATED'
  source: string
}

export interface DayRow {
  day: number
  lots_offered: number
  lots_served: number
  match_rate: number
  trucks_running: number
  trips: number
  forward_fill_rate: number
  detour_km: number
  revenue: number
  co2_kg: number
}

export interface TwinData {
  generated_at: string
  corridor: Corridor
  terrain: { grid: number; elevation: number[] | null; provenance: string }
  roads: { cls: string; pts: LonLat[] }[]
  villages: Village[]
  scenarios: Scenario[]
  provenance: Record<string, string>
  economics?: EconParam[]
  days?: DayRow[]
}
