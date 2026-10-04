import { useMemo } from 'react'
import * as THREE from 'three'
import type { Projection } from './projection'
import type { TwinData } from './types'

const STYLE: Record<string, { color: string; opacity: number }> = {
  motorway: { color: '#8dbcff', opacity: 0.6 },
  trunk: { color: '#6ea8ff', opacity: 0.5 },
  primary: { color: '#4d7cc0', opacity: 0.32 },
  secondary: { color: '#3d6490', opacity: 0.22 },
  tertiary: { color: '#2f4d6e', opacity: 0.16 },
}

/** One merged LineSegments per road class: ~1,500 ways would otherwise be 1,500 draw calls. */
export default function Roads({ data, proj }: { data: TwinData; proj: Projection }) {
  const layers = useMemo(() => {
    const verts = new Map<string, number[]>()
    for (const r of data.roads) {
      const pts = proj.path(r.pts, 0.6)
      const arr = verts.get(r.cls) ?? []
      for (let i = 0; i < pts.length - 1; i++) {
        arr.push(...pts[i], ...pts[i + 1])
      }
      verts.set(r.cls, arr)
    }
    return [...verts.entries()].map(([cls, arr]) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3))
      const s = STYLE[cls] ?? { color: '#2f4d6e', opacity: 0.14 }
      const m = new THREE.LineBasicMaterial({
        color: s.color,
        transparent: true,
        opacity: s.opacity,
      })
      return { cls, object: new THREE.LineSegments(g, m) }
    })
  }, [data, proj])

  return (
    <group>
      {layers.map((l) => (
        <primitive key={l.cls} object={l.object} />
      ))}
    </group>
  )
}
