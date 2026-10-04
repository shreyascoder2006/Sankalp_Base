import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Projection } from './projection'
import type { SceneData, Trip } from './types'

/**
 * Trucks follow the real road polyline the matching engine chose, interpolated by the
 * cumulative distance already computed per vertex. Position therefore comes from the
 * route, not from a straight line between stops.
 */
function sampleRoute(trip: Trip, pts: THREE.Vector3[], t: number): {
  pos: THREE.Vector3
  dir: THREE.Vector3
} | null {
  if (pts.length < 2) return null
  const total = trip.cum_km[trip.cum_km.length - 1]
  const target = Math.max(0, Math.min(1, t)) * total

  let i = 1
  while (i < trip.cum_km.length - 1 && trip.cum_km[i] < target) i++
  const a = trip.cum_km[i - 1]
  const b = trip.cum_km[i]
  const f = b > a ? (target - a) / (b - a) : 0

  const p0 = pts[Math.min(i - 1, pts.length - 1)]
  const p1 = pts[Math.min(i, pts.length - 1)]
  return {
    pos: p0.clone().lerp(p1, f),
    dir: p1.clone().sub(p0).normalize(),
  }
}

function Truck({
  trip,
  pts,
  now,
  highlight,
  onPick,
}: {
  trip: Trip
  pts: THREE.Vector3[]
  now: number
  highlight: boolean
  onPick: (id: string | null) => void
}) {
  const ref = useRef<THREE.Group>(null!)
  const trail = useRef<THREE.Line>(null!)

  const active = now >= trip.depart_min && now <= trip.arrive_min
  const t = (now - trip.depart_min) / Math.max(trip.arrive_min - trip.depart_min, 1e-6)

  const trailGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])

  useFrame(() => {
    const g = ref.current
    if (!g) return
    if (!active) {
      g.visible = false
      if (trail.current) trail.current.visible = false
      return
    }
    g.visible = true
    const s = sampleRoute(trip, pts, t)
    if (!s) return
    g.position.copy(s.pos)
    g.position.y += 1.1
    const yaw = Math.atan2(s.dir.x, s.dir.z)
    g.rotation.y = yaw

    if (trail.current) {
      trail.current.visible = true
      const drawn = Math.max(2, Math.floor(t * pts.length))
      trailGeom.setDrawRange(0, drawn)
    }
  })

  const laden = trip.served_kg / Math.max(trip.spare_kg, 1)
  const color = highlight ? '#ffd166' : trip.detour_km > 12 ? '#ff8e6b' : '#3ddc97'

  return (
    <group>
      <primitive
        ref={trail}
        object={
          new THREE.Line(
            trailGeom,
            new THREE.LineBasicMaterial({
              color,
              transparent: true,
              opacity: highlight ? 0.85 : 0.33,
            }),
          )
        }
      />
      <group
        ref={ref}
        onPointerOver={(e) => { e.stopPropagation(); onPick(trip.truck_id) }}
        onPointerOut={() => onPick(null)}
      >
        <mesh castShadow>
          <boxGeometry args={[1.4, 1.2, 2.9]} />
          <meshStandardMaterial
            color={color} emissive={color}
            emissiveIntensity={highlight ? 1.5 : 0.75} roughness={0.4}
          />
        </mesh>
        <mesh position={[0, 1.0 + Math.min(laden, 1) * 0.9, 0]}>
          <boxGeometry args={[1.0, Math.max(0.2, Math.min(laden, 1) * 1.8), 2.0]} />
          <meshStandardMaterial
            color="#f0b429" emissive="#f0b429" emissiveIntensity={0.5}
            transparent opacity={0.8}
          />
        </mesh>
        <pointLight color={color} intensity={highlight ? 26 : 9} distance={26} />
      </group>
    </group>
  )
}

export default function Trucks({
  data,
  proj,
  now,
  selected,
  onPick,
}: {
  data: SceneData
  proj: Projection
  now: number
  selected: string | null
  onPick: (id: string | null) => void
}) {
  const routes = useMemo(
    () =>
      data.trips.map((t) => ({
        trip: t,
        pts: proj.path(t.polyline, 1.0).map((p) => new THREE.Vector3(...p)),
      })),
    [data, proj],
  )

  return (
    <group>
      {routes.map(({ trip, pts }) => (
        <Truck
          key={trip.truck_id}
          trip={trip}
          pts={pts}
          now={now}
          highlight={selected === trip.truck_id}
          onPick={onPick}
        />
      ))}
    </group>
  )
}
