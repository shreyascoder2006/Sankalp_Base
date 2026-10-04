import { Billboard, Text } from '@react-three/drei'
import { useMemo } from 'react'
import type { Projection } from './projection'
import type { SceneData, Trip } from './types'

const SHARED = '#3ddc97'
const ISOLATED = '#8894a6'
const ANCHOR = '#5b9dff'

export default function Villages({
  data,
  proj,
  now,
  onPick,
}: {
  data: SceneData
  proj: Projection
  now: number
  onPick: (key: string | null) => void
}) {
  /** Tonnage still waiting at each village at time `now` — a column that drains on pickup. */
  const pending = useMemo(() => {
    const total = new Map<string, number>()
    const lifted = new Map<string, number>()
    for (const t of data.trips as Trip[]) {
      for (const s of t.stops) {
        total.set(s.point_key, (total.get(s.point_key) ?? 0) + s.load_kg)
        if (now >= s.arrive_min) lifted.set(s.point_key, (lifted.get(s.point_key) ?? 0) + s.load_kg)
      }
    }
    for (const r of data.refusals) total.set(r.point_key, (total.get(r.point_key) ?? 0) + r.load_kg)
    const out = new Map<string, number>()
    total.forEach((v, k) => out.set(k, Math.max(0, v - (lifted.get(k) ?? 0))))
    return out
  }, [data, now])

  return (
    <group>
      {data.villages.map((v) => {
        const shared = v.branch_size > 1
        const [x, y, z] = proj.point([v.lon, v.lat], 0.8)
        const waiting = pending.get(v.key) ?? 0
        const h = Math.min(waiting / 120, 14)
        return (
          <group key={v.key} position={[x, y, z]}>
            <mesh
              onPointerOver={(e) => { e.stopPropagation(); onPick(v.key) }}
              onPointerOut={() => onPick(null)}
            >
              <cylinderGeometry args={[1.1, 1.1, 0.35, 16]} />
              <meshStandardMaterial
                color={shared ? SHARED : ISOLATED}
                emissive={shared ? SHARED : ISOLATED}
                emissiveIntensity={shared ? 0.7 : 0.25}
              />
            </mesh>

            {h > 0.1 && (
              <mesh position={[0, h / 2, 0]}>
                <cylinderGeometry args={[0.45, 0.45, h, 10]} />
                <meshStandardMaterial
                  color="#f0b429" emissive="#f0b429" emissiveIntensity={0.55}
                  transparent opacity={0.72}
                />
              </mesh>
            )}

            <Billboard position={[0, 4.2 + h, 0]}>
              <Text fontSize={2.1} color={shared ? '#bfe9d5' : '#9aa6b6'} anchorY="bottom">
                {v.name}
              </Text>
            </Billboard>
          </group>
        )
      })}

      {[data.corridor.origin, data.corridor.dest].map((a) => {
        const [x, y, z] = proj.point([a.lon, a.lat], 1.2)
        return (
          <group key={a.key} position={[x, y, z]}>
            <mesh rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[2.6, 2.6, 2.6]} />
              <meshStandardMaterial color={ANCHOR} emissive={ANCHOR} emissiveIntensity={0.9} />
            </mesh>
            <Billboard position={[0, 5.5, 0]}>
              <Text fontSize={2.9} color="#dbe7f5" anchorY="bottom">{a.name}</Text>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}
