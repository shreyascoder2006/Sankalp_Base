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

        const radius = (inPlay ? 6.0 : 4.5) + (v.branch_size > 1 ? 0.8 : 0)
        const waiting = un ? un.load_kg : act && !act.served ? act.kg : 0

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

            {/* Realistic Roadside Produce Crate Stacks & Scale at Farm Gate — Proportional */}
            {waiting > 0 && (
              <group position={[radius * 0.75, 0, radius * 0.75]}>
                {/* Pallet base */}
                <mesh position={[0, 0.2, 0]}>
                  <boxGeometry args={[3.8, 0.4, 3.8]} />
                  <meshStandardMaterial color="#8d6e63" roughness={0.9} />
                </mesh>
                {/* Tiered harvest crates */}
                {[0, 1, 2].map((cr) => (
                  <mesh key={cr} position={[0, 0.55 + cr * 0.7, 0]} castShadow>
                    <boxGeometry args={[3.1, 0.6, 3.1]} />
                    <meshStandardMaterial
                      color={cr % 2 === 0 ? '#d93829' : '#e67e22'}
                      roughness={0.65}
                    />
                  </mesh>
                ))}
                {/* Digital platform scale bench */}
                <mesh position={[2.6, 0.6, 0]}>
                  <boxGeometry args={[1.4, 1.1, 1.4]} />
                  <meshStandardMaterial color="#4a5568" />
                </mesh>
              </group>
            )}

            {/* Realistic 3D Farm-Gate Telemetry Pin — Proportional & Clearly Legible */}
            {inPlay && (
              <Billboard position={[0, 14, 0]}>
                {/* Badge Container Box */}
                <mesh position={[0, 0, -0.05]}>
                  <planeGeometry args={[12, 4.2]} />
                  <meshBasicMaterial color="#080e18" transparent opacity={0.92} />
                </mesh>
                <mesh position={[0, 0, -0.07]}>
                  <planeGeometry args={[12.3, 4.5]} />
                  <meshBasicMaterial color={colour} transparent opacity={0.7} />
                </mesh>

                {/* Crop Icon */}
                <Text
                  position={[-4.8, 0.4, 0]}
                  fontSize={1.8}
                  anchorX="center"
                  anchorY="middle"
                >
                  {v.name.includes('Bhuse') || v.name.includes('Sakore') ? '🍅' : '🧅'}
                </Text>

                {/* Farmer Name & Village */}
                <Text
                  position={[-3.4, 0.8, 0]}
                  fontSize={1.1}
                  color="#ffffff"
                  anchorX="left"
                  anchorY="middle"
                  outlineWidth={0.06}
                  outlineColor="#000000"
                >
                  {act?.farmer ?? un?.farmer ?? v.name}
                </Text>

                {/* Weight & Commodity Info */}
                <Text
                  position={[-3.4, -0.15, 0]}
                  fontSize={0.8}
                  color="#cbd5e1"
                  anchorX="left"
                  anchorY="middle"
                >
                  {`${v.name} · ${(act?.kg ?? un?.load_kg ?? 0).toFixed(0)} kg harvest`}
                </Text>

                {/* Real-time Status Badge */}
                <Text
                  position={[-3.4, -1.0, 0]}
                  fontSize={0.7}
                  color={colour}
                  anchorX="left"
                  anchorY="middle"
                  font={undefined}
                >
                  {un
                    ? `✗ UNMET · ${un.reason.toUpperCase()}`
                    : act?.served
                    ? '✓ COLLECTED ON TRUCK'
                    : '⏳ READY FOR PICKUP'}
                </Text>
              </Billboard>
            )}
          </group>
        )
      })}
    </group>
  )
}
