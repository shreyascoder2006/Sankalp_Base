import { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type CameraControlsImpl from 'camera-controls'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Projection } from './projection'
import type { Scenario, Village } from './types'

/** Live truck positions, written by Truck each frame and read here for the chase cam. */
export const truckPositions = new Map<string, THREE.Vector3>()

export type Focus =
  | { kind: 'overview' }
  | { kind: 'truck'; id: string }
  | { kind: 'village'; key: string }

type Look = [number, number, number, number, number, number]

export default function CameraRig({
  focus,
  scenario,
  villages,
  proj,
  playing,
  zoomFactor = 1.0,
}: {
  focus: Focus
  scenario: Scenario
  villages: Village[]
  proj: Projection
  playing: boolean
  zoomFactor?: number
}) {
  const ref = useRef<CameraControlsImpl>(null)
  const idleUntil = useRef(0)

  /**
   * Frame what this scenario actually involves, rather than the whole corridor. A
   * fixed overview put two villages and a short route in the far distance, which is
   * why the opening shot read as empty ground.
   */
  const overview = useMemo<Look>(() => {
    const box = new THREE.Box3()
    let any = false
    const add = (lon: number, lat: number) => {
      box.expandByPoint(new THREE.Vector3(...proj.point([lon, lat])))
      any = true
    }
    for (const t of scenario.trips) for (const p of t.polyline) add(p[0], p[1])
    for (const u of scenario.unserved) for (const p of u.polyline) add(p[0], p[1])
    if (!any) {
      for (const v of villages) add(v.lon, v.lat)
    }

    const centre = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const reach = Math.max(size.x, size.z, proj.widthUnits * 0.35)
    const d = reach * 1.45 * zoomFactor

    return [
      centre.x + d * 0.65,
      centre.y + d * 0.82,
      centre.z + d * 0.95,
      centre.x,
      centre.y,
      centre.z,
    ]
  }, [scenario, villages, proj, zoomFactor])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.minDistance = proj.widthUnits * 0.012
    c.maxDistance = proj.widthUnits * 3.5
    c.maxPolarAngle = Math.PI * 0.48
    c.smoothTime = 0.7
    c.draggingSmoothTime = 0.12
    // Scroll zooms toward whatever is under the pointer, which is what makes a large
    // sparse scene navigable: aim at a village and dive straight at it.
    c.dollyToCursor = true
    c.setLookAt(...overview, false)
  }, [proj, overview])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const onStart = () => (idleUntil.current = performance.now() + 5000)
    c.addEventListener('controlstart', onStart)
    return () => c.removeEventListener('controlstart', onStart)
  }, [])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    if (focus.kind === 'village') {
      const v = villages.find((x) => x.key === focus.key)
      if (v) {
        const [x, y, z] = proj.point([v.lon, v.lat], 0)
        const d = proj.widthUnits * 0.14 * zoomFactor
        c.setLookAt(x + d * 0.7, y + d * 0.9, z + d * 1.05, x, y + 2, z, true)
      }
      return
    }
    if (focus.kind === 'overview') c.setLookAt(...overview, true)
    // a truck is a moving target, so it is tracked per-frame below instead
  }, [focus, villages, proj, overview, zoomFactor])

  useEffect(() => {
    idleUntil.current = 0
  }, [zoomFactor, focus])

  useFrame((_, dt) => {
    const c = ref.current
    if (!c) return

    if (focus.kind === 'truck') {
      const p = truckPositions.get(focus.id)
      if (!p) return
      // While the user is dragging, only the target follows, so they keep the angle
      // they chose and still stay locked on.
      if (performance.now() < idleUntil.current) {
        c.setTarget(p.x, p.y + 2.5, p.z, true)
      } else {
        // Zoom-adjusted chase cam: wide perspective of the road, landscape, and truck
        const d = proj.widthUnits * 0.18 * zoomFactor
        c.setLookAt(
          p.x + d * 0.8,
          p.y + d * 0.75 + 6 * Math.sqrt(zoomFactor),
          p.z + d * 0.9,
          p.x,
          p.y + 2.0,
          p.z,
          true
        )
      }
      return
    }

    if (focus.kind === 'overview' && !playing && performance.now() > idleUntil.current) {
      c.azimuthAngle += dt * 0.025
    }
  })

  return <CameraControls ref={ref} makeDefault />
}
