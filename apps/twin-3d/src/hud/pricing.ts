/**
 * TypeScript port of core/pricing/fare.py and core/pricing/economics.py.
 *
 * Uses the same formula so the interactive calculator produces numbers identical
 * to the backend engine. Constants are read from the economics array in the data
 * payload; fallbacks match the Python defaults.
 */

import type { EconParam } from '../scene/types'

export interface EconConstants {
  dieselPricePerL: number
  scvMileageKmplLaden: number
  truckCapacityKg: number
  fullTruckFarePerKm: number
  platformFeePct: number
  handlingPerStop: number
  co2KgPerLDiesel: number
}

/** Read economic constants from the data payload, with Python-matching defaults. */
export function readEcon(params?: EconParam[]): EconConstants {
  const get = (name: string, fallback: number) =>
    params?.find((p) => p.name === name)?.value ?? fallback

  return {
    dieselPricePerL: get('DIESEL_PRICE_PER_L', 97.83),
    scvMileageKmplLaden: get('SCV_MILEAGE_KMPL_LADEN', 10.0),
    truckCapacityKg: get('TRUCK_CAPACITY_KG', 1500.0),
    fullTruckFarePerKm: get('FULL_TRUCK_FARE_PER_KM', 50.0),
    platformFeePct: get('PLATFORM_FEE_PCT', 0.08),
    handlingPerStop: get('HANDLING_PER_STOP', 25.0),
    co2KgPerLDiesel: get('CO2_KG_PER_L_DIESEL', 2.68),
  }
}

export function fullTruckFare(trunkKm: number, ec: EconConstants): number {
  return trunkKm * ec.fullTruckFarePerKm
}

export function dieselCost(km: number, ec: EconConstants): number {
  return (km / ec.scvMileageKmplLaden) * ec.dieselPricePerL
}

export function co2Kg(km: number, ec: EconConstants): number {
  return (km / ec.scvMileageKmplLaden) * ec.co2KgPerLDiesel
}

export interface FareBreakdown {
  capacityShare: number
  branchEntryShare: number
  marginalDetour: number
  handling: number
  platformFee: number
  total: number
}

/**
 * Compute a pooled fare — identical to Python's `core.pricing.fare.quote()`.
 */
export function quote(
  loadKg: number,
  trunkKm: number,
  branchEntryKm: number,
  branchSharedBy: number,
  marginalKm: number,
  ec: EconConstants,
  capacityKg?: number,
): FareBreakdown {
  const capacity = capacityKg ?? ec.truckCapacityKg
  const capacityShare = (fullTruckFare(trunkKm, ec) / capacity) * loadKg
  const entryShare = dieselCost(branchEntryKm, ec) / Math.max(branchSharedBy, 1)
  const marginal = dieselCost(marginalKm, ec)
  const handling = ec.handlingPerStop
  const subtotal = capacityShare + entryShare + marginal + handling
  const fee = subtotal * ec.platformFeePct
  const total = capacityShare + entryShare + marginal + handling + fee

  return {
    capacityShare: Math.round(capacityShare * 100) / 100,
    branchEntryShare: Math.round(entryShare * 100) / 100,
    marginalDetour: Math.round(marginal * 100) / 100,
    handling: Math.round(handling * 100) / 100,
    platformFee: Math.round(fee * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

/**
 * Brief's simplified formula (flat ₹50 detour + 8% fee on capacity share only).
 */
export function briefQuote(loadKg: number, fullFare: number, ec: EconConstants): number {
  const share = (fullFare / ec.truckCapacityKg) * loadKg
  const detour = 50
  const sub = share + detour
  return Math.round((sub + sub * ec.platformFeePct) * 100) / 100
}
