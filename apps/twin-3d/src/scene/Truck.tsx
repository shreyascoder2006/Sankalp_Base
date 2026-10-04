import { Billboard, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { truckPositions } from './CameraRig'
import TruckModel from './TruckModel'
import type { Projection } from './projection'
import type { Trip } from './types'

/**
 * A 37 km corridor and a 5 m vehicle are four orders of magnitude apart, so no single
 * scale serves both: at true size a truck is a sub-pixel speck, and at a size visible
 * from the overview it ends up larger than the village it is collecting from -- which
 * is exactly how the first version read.
 *
 * The model therefore holds true proportions and the group is scaled by camera
 * distance, keeping roughly constant apparent size. Zoom in and it shrinks toward
 * realistic; pull back and it stays findable. Map tools do the same with pins.
 */
const SCREEN_FACTOR = 0.009
const MIN_LENGTH = 0.55 // ~55 m when close
const MAX_LENGTH = 2.4 // ~240 m from the overview, still under a village footprint

function sample(trip: Trip, pts: THREE.Vector3[], t: number) {
  const total = trip.cum_km[trip.cum_km.length - 1] ?? 0
  const target = Math.max(0, Math.min(1, t)) * total
  let i = 1
  while (i < trip.cum_km.length - 1 && trip.cum_km[i] < target) i++
  const a = trip.cum_km[i - 1]
  const b = trip.cum_km[i]
  const f = b > a ? (target - a) / (b - a) : 0
  const p0 = pts[Math.min(i - 1, pts.length - 1)]
  const p1 = pts[Math.min(i, pts.length - 1)]
  return { pos: p0.clone().lerp(p1, f), dir: p1.clone().sub(p0).normalize(), index: i }
}

export default function Truck({
  trip,
  proj,
  now,
  selected,
  dimmed,
  onSelect,
}: {
  trip: Trip
  proj: Projection
  now: number
  selected: boolean
  dimmed: boolean
  onSelect: (id: string) => void
}) {
  const group = useRef<THREE.Group>(null!)
  const spin = useRef(0)
  const lastPos = useRef(new THREE.Vector3())
  const { camera } = useThree()

  const pts = useMemo(
    () => proj.path(trip.polyline, 0.9).map((p) => new THREE.Vector3(...p)),
    [trip, proj],
  )
  const driven = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])
  const ghost = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])
  const drivenLine = useRef<THREE.Line>(null!)

  const active = now >= trip.depart_min && now <= trip.arrive_min
  const done = now > trip.arrive_min
  const t = (now - trip.depart_min) / Math.max(trip.arrive_min - trip.depart_min, 1e-6)

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const show = active || done
    g.visible = show
    if (drivenLine.current) drivenLine.current.visible = show
    if (!show) return

    const s = sample(trip, pts, done ? 1 : t)
    g.position.copy(s.pos)
    g.position.y += 0.08

    // Face along the road, and bank slightly into the turn so motion reads as driving
    // rather than sliding.
    const yaw = Math.atan2(s.dir.x, s.dir.z)
    const dYaw = ((yaw - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI
    g.rotation.y += dYaw * Math.min(1, dt * 6)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -dYaw * 0.6, Math.min(1, dt * 4))

    const moved = s.pos.distanceTo(lastPos.current)
    lastPos.current.copy(s.pos)

    const dist = camera.position.distanceTo(g.position)
    const len = THREE.MathUtils.clamp(dist * SCREEN_FACTOR, MIN_LENGTH, MAX_LENGTH)
    g.scale.setScalar(len)

    // Wheel rotation tied to ground speed, so it never looks like a sliding prop.
    if (active && moved > 0) spin.current += (moved / Math.max(len * 0.085, 1e-4)) * 0.5

    truckPositions.set(trip.truck_id, g.position.clone())
    driven.setDrawRange(0, Math.max(2, Math.min(pts.length, s.index + 1)))
  })

  const accent = selected ? '#ffd166' : trip.detour_km > 12 ? '#ff9a6b' : '#3ddc97'
  const laden = Math.min(trip.served_kg / Math.max(trip.spare_kg, 1), 1)

  return (
    <group>
      <primitive
        object={
          new THREE.Line(
            ghost,
            new THREE.LineBasicMaterial({
              color: '#44526a',
              transparent: true,
              opacity: dimmed ? 0.05 : 0.2,
            }),
          )
        }
      />
      <primitive
        ref={drivenLine}
        object={
          new THREE.Line(
            driven,
            new THREE.LineBasicMaterial({
              color: accent,
              transparent: true,
              opacity: dimmed ? 0.1 : selected ? 0.95 : 0.6,
            }),
          )
        }
      />

      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(trip.truck_id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <TruckModel accent={accent} laden={laden} headlights={now < 180} spin={spin} />
        <pointLight color={accent} intensity={selected ? 2.2 : 0.7} distance={6} />

        {selected && (
          <Billboard position={[0, 1.15, 0]}>
            <Text fontSize={0.4} color="#ffd166" anchorY="bottom" outlineWidth={0.02} outlineColor="#17120a">
              {trip.truck_id}
            </Text>
          </Billboard>
        )}
      </group>
    </group>
  )
}
