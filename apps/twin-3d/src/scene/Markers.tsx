import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import Settlement from './Settlement'
import type { Projection } from './projection'
import type { Scenario, Unserved, Village } from './types'

const REASON_COLOUR: Record<string, string> = {
  capacity: '#f0b429',
  economics: '#ff6b6b',
  'no truck free': '#8894a6',
}

function Pulse({ colour, radius }: { colour: string; radius: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((s) => {
    const k = (Math.sin(s.clock.elapsedTime * 2) + 1) / 2
    if (!ref.current) return
    const sc = 1 + k * 0.8
    ref.current.scale.set(sc, sc, sc)
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - k)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius * 1.25, 36]} />
      <meshBasicMaterial color={colour} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  )
}

export default function Markers({
  scenario,
  villages,
  proj,
  now,
  onVillage,
}: {
  scenario: Scenario
  villages: Village[]
  proj: Projection
  now: number
  onVillage: (key: string) => void
}) {
  const involved = new Map<string, { kg: number; farmer: string; served: boolean }>()
  for (const t of scenario.trips) {
    for (const s of t.stops) {
      involved.set(s.point_key, {
        kg: s.load_kg,
        farmer: s.name,
        served: now >= s.arrive_min,
      })
    }
  }
  const unservedBy = new Map<string, Unserved>(scenario.unserved.map((u) => [u.point_key, u]))

  return (
    <group>
      {villages.map((v) => {
        const act = involved.get(v.key)
        const un = unservedBy.get(v.key)
        const inPlay = Boolean(act || un)
        const [x, y, z] = proj.point([v.lon, v.lat], 0.7)

        const colour = un
          ? REASON_COLOUR[un.reason] ?? '#ff6b6b'
          : act
            ? act.served ? '#3ddc97' : '#f0b429'
            : v.branch_size > 1 ? '#2f6a55' : '#39434f'

        // ~700 m across for a village, a little more where it matters to this scenario
        const radius = (inPlay ? 3.6 : 2.8) + (v.branch_size > 1 ? 0.5 : 0)
        const waiting = un ? un.load_kg : act && !act.served ? act.kg : 0
        const h = Math.min(waiting / 45, 12)

        return (
          <group key={v.key} position={[x, y, z]}>
            {inPlay && <Pulse colour={colour} radius={radius * 1.5} />}
            <group
              onClick={(e) => { e.stopPropagation(); onVillage(v.key) }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
              onPointerOut={() => { document.body.style.cursor = 'auto' }}
            >
              <Settlement seed={v.key} radius={radius} colour={colour} lit={inPlay} />
            </group>

            {h > 0.1 && (
              <mesh position={[0, h / 2, 0]}>
                <cylinderGeometry args={[0.8, 0.8, h, 12]} />
                <meshStandardMaterial
                  color={colour} emissive={colour} emissiveIntensity={0.5}
                  transparent opacity={0.78}
                />
              </mesh>
            )}

            {inPlay && (
              <Billboard position={[0, h + 5.2, 0]}>
                <Text fontSize={2.3} color={colour} anchorY="bottom" outlineWidth={0.1} outlineColor="#0a0f14">
                  {act?.farmer ?? un?.farmer ?? v.name}
                </Text>
                <Text position={[0, -2.6, 0]} fontSize={1.6} color="#aebbcc" anchorY="bottom">
                  {`${v.name} · ${(act?.kg ?? un?.load_kg ?? 0).toFixed(0)} kg`}
                </Text>
                {un && (
                  <Text position={[0, -5.0, 0]} fontSize={1.5} color={colour} anchorY="bottom">
                    {`unserved · ${un.reason}`}
                  </Text>
                )}
              </Billboard>
            )}
          </group>
        )
      })}
    </group>
  )
}
