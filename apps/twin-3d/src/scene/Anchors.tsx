import type { Projection } from './projection'
import type { Corridor } from './types'
import MandiModel from './MandiModel'
import OriginHubModel from './OriginHubModel'

export default function Anchors({ corridor, proj }: { corridor: Corridor; proj: Projection }) {
  const originPos = proj.point([corridor.origin.lon, corridor.origin.lat], 0.2)
  const destPos = proj.point([corridor.dest.lon, corridor.dest.lat], 0.2)

  return (
    <group>
      {/* Origin: Pimpalgaon Baswant Fleet Staging Hub — 2.25x Magnified */}
      <group position={originPos} scale={[2.25, 2.25, 2.25]}>
        <OriginHubModel name={corridor.origin.name} />
      </group>

      {/* Destination: Nashik APMC Wholesale Mandi Terminal — 2.25x Magnified */}
      <group position={destPos} scale={[2.25, 2.25, 2.25]}>
        <MandiModel name={corridor.dest.name} />
      </group>
    </group>
  )
}
