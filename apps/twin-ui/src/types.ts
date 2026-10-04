export type Provenance = 'REAL' | 'MODELED' | 'SIMULATED'

export interface Branch {
  branch_id: number
  key: string
  name: string
  lon: number
  lat: number
  solo_detour_km: number
  branch_entry_km: number
  branch_full_km: number
  branch_size: number
}

export interface CurvePoint {
  label: string
  stops: number
  km: number
  marginal_km: number
}

export interface SharingRow {
  shared_by: number
  ours: number
  brief: number
  full_truck: number
}

export interface Stage {
  key: string
  headline: string
  value: number
  unit: string
  provenance: Provenance
  evidenced: boolean
  detail: string
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

export interface SweepRow {
  farmers: number
  trucks: number
  per_truck: number
  match_rate: number
  forward_fill_rate: number
  mean_detour_km: number
}

export interface EconRow {
  name: string
  value: number
  provenance: Provenance
  source: string
}

export interface TwinData {
  generated_at: string
  corridor: { name: string; trunk_km: number; source: string; licence: string }
  provenance_note: string
  calibrated: boolean
  points: { key: string; name: string; lon: number; lat: number }[]
  branches: Branch[]
  marginal_curve: CurvePoint[]
  sharing: SharingRow[]
  cascade: Stage[]
  cascade_confidence: Provenance
  days: DayRow[]
  sweep: SweepRow[]
  economics: EconRow[]
}
