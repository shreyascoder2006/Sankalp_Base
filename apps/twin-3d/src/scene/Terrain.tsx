import { useMemo } from 'react'
import * as THREE from 'three'
import type { Projection } from './projection'
import { UNITS_PER_M, VERTICAL_EXAGGERATION } from './projection'

export default function Terrain({ proj }: { proj: Projection }) {
  const geometry = useMemo(() => {
    const n = proj.grid
    const b = proj.bbox
    const w = (b.east - b.west) * proj.mPerDegLon * UNITS_PER_M
    const h = (b.north - b.south) * proj.mPerDegLat * UNITS_PER_M
    const g = new THREE.PlaneGeometry(w, h, n - 1, n - 1)
    g.rotateX(-Math.PI / 2)

    const pos = g.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const lo = new THREE.Color('#111a22')
    const hi = new THREE.Color('#2b3d35')

    for (let i = 0; i < pos.count; i++) {
      // PlaneGeometry rows run north→south after the rotation; flip to match the grid.
      const col = i % n
      const row = n - 1 - Math.floor(i / n)
      const metres = proj.elev ? proj.elev[row * n + col] ?? 0 : 0
      const y = (metres - proj.minElev) * UNITS_PER_M * VERTICAL_EXAGGERATION
      pos.setY(i, y)

      const t = proj.maxElev > proj.minElev
        ? (metres - proj.minElev) / (proj.maxElev - proj.minElev)
        : 0
      const c = lo.clone().lerp(hi, Math.pow(t, 0.8))
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [proj])

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh geometry={geometry} position={[0, 0.25, 0]}>
        <meshBasicMaterial color="#3a556b" wireframe transparent opacity={0.07} />
      </mesh>
    </group>
  )
}
