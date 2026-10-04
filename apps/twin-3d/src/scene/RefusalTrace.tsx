import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Projection } from './projection'
import type { Refusal } from './types'

const DRAW_SECONDS = 1.6

const COLOUR: Record<string, string> = {
  economics: '#ff6b6b',
  capacity: '#f0b429',
  'no truck free': '#8894a6',
}

/**
 * Draws the detour an unserved farmer would have cost, with the reason nobody took it.
 * The reason comes from the engine rather than being inferred here: a lot can be
 * thoroughly profitable and still go nowhere because every truck was already full.
 */
export default function RefusalTrace({
  refusal,
  proj,
}: {
  refusal: Refusal
  proj: Projection
}) {
  const line = useRef<THREE.Line>(null!)
  const elapsed = useRef(0)

  const colour = COLOUR[refusal.reason] ?? '#ff6b6b'

  const { geom, pts } = useMemo(() => {
    const p = proj.path(refusal.polyline, 2.2).map((v) => new THREE.Vector3(...v))
    return { geom: new THREE.BufferGeometry().setFromPoints(p), pts: p }
  }, [refusal, proj])

  useFrame((_, dt) => {
    elapsed.current = Math.min(DRAW_SECONDS, elapsed.current + dt)
    const t = elapsed.current / DRAW_SECONDS
    const eased = 1 - Math.pow(1 - t, 3)
    geom.setDrawRange(0, Math.max(2, Math.floor(eased * pts.length)))
    if (line.current) {
      const m = line.current.material as THREE.LineBasicMaterial
      m.opacity = 0.32 + Math.sin(elapsed.current * 3) * 0.16
    }
  })

  const mid = pts[Math.floor(pts.length / 2)] ?? new THREE.Vector3()

  return (
    <group>
      <primitive
        ref={line}
        object={
          new THREE.Line(
            geom,
            new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0.45 }),
          )
        }
      />
      <Billboard position={[mid.x, mid.y + 10, mid.z]}>
        <Text fontSize={2.4} color={colour} anchorY="bottom" outlineWidth={0.1} outlineColor="#140a0a">
          {`${refusal.name} unserved · ${refusal.reason}`}
        </Text>
        <Text position={[0, -3.0, 0]} fontSize={1.75} color="#d8c4c4" anchorY="bottom">
          {refusal.detail}
        </Text>
        <Text position={[0, -5.5, 0]} fontSize={1.6} color="#9aa6b6" anchorY="bottom">
          {`${refusal.load_kg.toFixed(0)} kg · would need ${refusal.detour_km.toFixed(1)} km detour`}
        </Text>
      </Billboard>
    </group>
  )
}
