import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { truckPositions } from './CameraRig'
import type { Projection } from './projection'
import type { Trip } from './types'

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
  const body = useRef<THREE.Group>(null!)
  const pts = useMemo(
    () => proj.path(trip.polyline, 1.1).map((p) => new THREE.Vector3(...p)),
    [trip, proj],
  )
  const driven = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])
  const ghost = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])
  const drivenLine = useRef<THREE.Line>(null!)

  const active = now >= trip.depart_min && now <= trip.arrive_min
  const done = now > trip.arrive_min
  const t = (now - trip.depart_min) / Math.max(trip.arrive_min - trip.depart_min, 1e-6)

  useFrame(() => {
    const g = body.current
    if (!g) return
    const show = active || done
    g.visible = show
    const s = sample(trip, pts, done ? 1 : t)
    g.position.copy(s.pos)
    g.position.y += 1.2
    g.rotation.y = Math.atan2(s.dir.x, s.dir.z)
    truckPositions.set(trip.truck_id, g.position.clone())
    driven.setDrawRange(0, Math.max(2, Math.min(pts.length, s.index + 1)))
    if (drivenLine.current) drivenLine.current.visible = show
  })

  const colour = selected ? '#ffd166' : trip.detour_km > 12 ? '#ff9a6b' : '#3ddc97'
  const opacity = dimmed ? 0.12 : 1

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
              opacity: dimmed ? 0.05 : 0.22,
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
              color: colour,
              transparent: true,
              opacity: dimmed ? 0.1 : selected ? 0.95 : 0.6,
            }),
          )
        }
      />

      <group
        ref={body}
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
        {/* cab */}
        <mesh position={[0, 0.1, 1.05]} castShadow>
          <boxGeometry args={[1.5, 1.5, 1.3]} />
          <meshStandardMaterial
            color={colour} emissive={colour} emissiveIntensity={selected ? 1.1 : 0.45}
            metalness={0.3} roughness={0.45} transparent={dimmed} opacity={opacity}
          />
        </mesh>
        {/* bed */}
        <mesh position={[0, -0.1, -0.7]} castShadow>
          <boxGeometry args={[1.7, 0.9, 2.5]} />
          <meshStandardMaterial
            color="#2b3b4e" metalness={0.4} roughness={0.6}
            transparent={dimmed} opacity={opacity}
          />
        </mesh>
        {/* cargo fill */}
        {laden > 0.02 && (
          <mesh position={[0, 0.35 + laden * 0.5, -0.7]}>
            <boxGeometry args={[1.45, Math.max(0.25, laden * 1.3), 2.2]} />
            <meshStandardMaterial
              color="#f0b429" emissive="#f0b429" emissiveIntensity={0.55}
              transparent opacity={dimmed ? 0.12 : 0.9}
            />
          </mesh>
        )}
        <pointLight color={colour} intensity={selected ? 32 : 10} distance={30} />

        {selected && (
          <Billboard position={[0, 5.5, 0]}>
            <Text fontSize={2.2} color="#ffd166" anchorY="bottom" outlineWidth={0.12} outlineColor="#17120a">
              {trip.truck_id}
            </Text>
          </Billboard>
        )}
      </group>
    </group>
  )
}
