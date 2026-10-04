import { useMemo } from 'react'

/**
 * A cluster of low buildings on a footprint of roughly the right size (~700 m across,
 * i.e. 7 scene units). The previous marker was a 260 m disc, which made villages read
 * as smaller than the trucks collecting from them and destroyed any sense of scale.
 *
 * Layout is deterministic from the village key so a place looks the same every visit.
 */
function hash(s: string): () => number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 10000) / 10000
  }
}

export default function Settlement({
  seed,
  radius,
  colour,
  lit,
}: {
  seed: string
  radius: number
  colour: string
  lit: boolean
}) {
  const buildings = useMemo(() => {
    const r = hash(seed)
    const n = 12 + Math.floor(r() * 8)
    return Array.from({ length: n }, () => {
      const ang = r() * Math.PI * 2
      // sqrt keeps the cluster evenly filled rather than bunched at the centre
      const rad = Math.sqrt(r()) * (radius * 1.35)
      return {
        x: Math.cos(ang) * rad,
        z: Math.sin(ang) * rad,
        w: 1.3 + r() * 1.6,
        d: 1.3 + r() * 1.6,
        h: 1.1 + r() * 1.8,
        rot: r() * Math.PI,
        warm: r() > 0.45,
      }
    })
  }, [seed, radius])

  return (
    <group>
      {/* ground pad, so the cluster sits on something rather than floating on terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <circleGeometry args={[radius * 1.5, 32]} />
        <meshStandardMaterial color="#1a2332" roughness={0.96} />
      </mesh>

      {buildings.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.rot, 0]}>
          <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#64748b" roughness={0.82} metalness={0.08} />
          </mesh>
          {/* pitched terracotta roof reads as a dwelling rather than a block */}
          <mesh position={[0, b.h + 0.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[Math.max(b.w, b.d) * 0.82, 0.9, 4]} />
            <meshStandardMaterial color="#c05621" roughness={0.88} />
          </mesh>
          {lit && b.warm && (
            <mesh position={[0, b.h * 0.55, b.d / 2 + 0.04]}>
              <planeGeometry args={[0.45, 0.45]} />
              <meshBasicMaterial color="#ffcf8a" />
            </mesh>
          )}
        </group>
      ))}

      {/* status ring on the ground, which keeps the colour legible from above */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[radius * 1.52, radius * 1.76, 48]} />
        <meshBasicMaterial color={colour} transparent opacity={lit ? 0.88 : 0.4} />
      </mesh>
    </group>
  )
}
