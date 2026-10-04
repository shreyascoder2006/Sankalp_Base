import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Projection } from './projection'
import type { Unserved } from './types'

const COLOUR: Record<string, string> = {
  capacity: '#f0b429',
  economics: '#ff6b6b',
  'no truck free': '#8894a6',
}

/**
 * The detour a farmer would have needed, drawn as the road it would actually have used.
 * Dashes travel along it so it reads as a trip that never happened, rather than a route.
 */
export default function UnservedTrace({
  unserved,
  proj,
}: {
  unserved: Unserved
  proj: Projection
}) {
  const ref = useRef<THREE.Line>(null!)
  const colour = COLOUR[unserved.reason] ?? '#ff6b6b'

  const { geom, count } = useMemo(() => {
    const pts = proj.path(unserved.polyline, 2.6).map((p) => new THREE.Vector3(...p))
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    return { geom: g, count: pts.length }
  }, [unserved, proj])

  useFrame((s) => {
    const m = ref.current?.material as THREE.LineDashedMaterial | undefined
    if (!m) return
    // No dashOffset in this three build, so pulse the dash length instead: the trace
    // still reads as a trip that never happened rather than a static route.
    m.dashSize = 1.6 + Math.sin(s.clock.elapsedTime * 2.4) * 0.9
    m.needsUpdate = true
  })

  const line = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: colour,
      transparent: true,
      opacity: 0.55,
      dashSize: 2.4,
      gapSize: 2.0,
    })
    const l = new THREE.Line(geom, mat)
    l.computeLineDistances()
    return l
  }, [geom, colour])

  void count
  return <primitive ref={ref} object={line} />
}
