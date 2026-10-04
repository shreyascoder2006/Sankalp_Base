import { Billboard, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { truckPositions } from './CameraRig'
import TruckModel from './TruckModel'
import { getRealisticTruckTexture } from './realisticIcons'
import type { Projection } from './projection'
import type { Trip } from './types'

/**
 * A 37 km corridor and a 5 m vehicle require visual magnification in a GIS digital twin.
 * The Mahindra Bolero SCV model is magnified 10x so all realistic vehicle details
 * (cab visor, mirrors, MH-15 license plate, wooden stake-bed with produce crates,
 * spinning commercial wheels and headlamps) are clearly visible from camera flight views.
 */
const SCREEN_FACTOR = 0.005
const MIN_LENGTH = 0.72
const MAX_LENGTH = 1.75

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
  const group = useRef<THREE.Group>(null!)
  const groundRing = useRef<THREE.Mesh>(null!)
  const spin = useRef(0)
  const lastPos = useRef(new THREE.Vector3())
  const lastProgress = useRef(-1)
  const isInitialized = useRef(false)
  const { camera } = useThree()

  const truckIconTexture = useMemo(() => getRealisticTruckTexture(), [])

  const pts = useMemo(
    () => proj.path(trip.polyline, 0.9).map((p) => new THREE.Vector3(...p)),
    [trip, proj],
  )
  const driven = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])
  const ghost = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])
  const drivenLine = useRef<THREE.Line>(null!)

  // Centripetal Catmull-Rom spline for continuous C1 smooth driving along road geometry
  const curve = useMemo(() => {
    if (pts.length < 2) return null
    return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.15)
  }, [pts])

  const duration = Math.max(trip.arrive_min - trip.depart_min, 1e-6)
  const rawProgress = (now - trip.depart_min) / duration
  const progress = Math.max(0, Math.min(1, rawProgress))
  const isMoving = now >= trip.depart_min && now <= trip.arrive_min
  const totalKm = trip.cum_km[trip.cum_km.length - 1] ?? trip.distance_km ?? 30.1
  const currentKm = Math.round(progress * totalKm * 10) / 10

  const sampleRoad = (t: number) => {
    const clampedT = Math.max(0, Math.min(1, t))
    if (!curve || pts.length < 2) {
      const p = pts[0] ?? new THREE.Vector3()
      return { pos: p.clone(), dir: new THREE.Vector3(0, 0, 1) }
    }
    const pos = curve.getPointAt(clampedT)

    // Lookahead and lookbehind window along the spline for smooth tangent derivation
    const tAhead = Math.min(1, clampedT + 0.002)
    const tBehind = Math.max(0, clampedT - 0.001)
    const pAhead = curve.getPointAt(tAhead)
    const pBehind = curve.getPointAt(tBehind)
    let dir = pAhead.clone().sub(pBehind)

    if (dir.lengthSq() < 1e-6) {
      const tan = curve.getTangentAt(clampedT)
      dir = tan.lengthSq() > 1e-6 ? tan : new THREE.Vector3(0, 0, 1)
    }
    dir.normalize()
    return { pos, dir }
  }

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return

    // ALWAYS visible: truck stays parked at origin before departure and at destination after arrival
    g.visible = true
    if (drivenLine.current) drivenLine.current.visible = true

    const road = sampleRoad(progress)
    const targetPos = road.pos.clone()
    targetPos.y += 0.35

    const targetYaw = Math.atan2(road.dir.x, road.dir.z)

    // Elevation slope pitch (subtly tilted along hill inclines)
    const horizLen = Math.hypot(road.dir.x, road.dir.z)
    const targetPitch = horizLen > 1e-4 ? -Math.atan2(road.dir.y, horizLen) : 0
    const clampedPitch = THREE.MathUtils.clamp(targetPitch, -0.12, 0.12)

    // Detect if timeline scrubbed, scenario switched, or first initialization
    const scrubbed =
      !isInitialized.current ||
      lastProgress.current < 0 ||
      Math.abs(progress - lastProgress.current) > 0.04

    isInitialized.current = true
    lastProgress.current = progress

    if (scrubbed) {
      g.position.copy(targetPos)
      g.rotation.set(clampedPitch, targetYaw, 0)
    } else {
      // Smooth position interpolation: damp toward targetPos without micro-stutter
      g.position.lerp(targetPos, Math.min(1, dt * 25))

      // Smooth yaw rotation: calculate shortest angular difference
      let dYaw = ((targetYaw - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI

      // Exponential damping toward target yaw with angular velocity cap (prevents snapping at U-turns)
      const turnFactor = 1 - Math.exp(-12 * dt)
      const turnStep = dYaw * turnFactor
      const maxTurn = dt * 7.5
      g.rotation.y += Math.sign(turnStep) * Math.min(Math.abs(turnStep), maxTurn)

      // Pitch damping
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, clampedPitch, 8, dt)

      // Realistic body lean / roll: strictly clamped to max ±0.04 rad (~2.3 degrees)
      const targetBank = THREE.MathUtils.clamp(-dYaw * 0.06, -0.04, 0.04)
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, targetBank, 6, dt)
    }

    const moved = g.position.distanceTo(lastPos.current)
    lastPos.current.copy(g.position)

    const dist = camera.position.distanceTo(g.position)
    const len = THREE.MathUtils.clamp(dist * SCREEN_FACTOR, MIN_LENGTH, MAX_LENGTH)
    g.scale.setScalar(len)

    // Wheel rotation accurately tied to ground speed for vehicle scale
    if (isMoving && moved > 0) {
      spin.current += moved / Math.max(len * 32 * 0.095, 1e-4)
    }

    // Pulse the ground radar ring
    if (groundRing.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15
      groundRing.current.scale.set(pulse, pulse, 1)
    }

    truckPositions.set(trip.truck_id, g.position.clone())

    // Synchronize breadcrumb trail with current distance along path
    let drivenIndex = 1
    while (drivenIndex < trip.cum_km.length - 1 && trip.cum_km[drivenIndex] < currentKm) {
      drivenIndex++
    }
    driven.setDrawRange(0, Math.max(2, Math.min(pts.length, drivenIndex + 1)))
  })

  const accent = selected ? '#ffd166' : trip.detour_km > 12 ? '#ff9a6b' : '#3ddc97'
  const laden = Math.min(trip.served_kg / Math.max(trip.spare_kg, 1), 1)

  return (
    <group>
      {/* Complete Planned Path (Ghost Line) */}
      <primitive
        object={
          new THREE.Line(
            ghost,
            new THREE.LineBasicMaterial({
              color: '#334155',
              linewidth: 2,
              transparent: true,
              opacity: dimmed ? 0.08 : 0.35,
            }),
          )
        }
      />

      {/* Path Traveled so far (Vibrant Glow Line) */}
      <primitive
        ref={drivenLine}
        object={
          new THREE.Line(
            driven,
            new THREE.LineBasicMaterial({
              color: accent,
              linewidth: 3,
              transparent: true,
              opacity: dimmed ? 0.25 : selected ? 0.98 : 0.85,
            }),
          )
        }
      />

      <group
        ref={group}
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
        {/* Pulsing Ground Radar Target Reticle on Road */}
        <mesh ref={groundRing} position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.35, 32]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={selected ? 0.85 : 0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, -0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.88, 32]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={selected ? 0.25 : 0.14}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Vertical Sky Beacon Beam */}
        <mesh position={[0, 9, 0]}>
          <cylinderGeometry args={[0.15, 0.4, 18, 16, 1, true]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={selected ? 0.35 : 0.18}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* 32x Realistic Mahindra Bolero SCV 3D Digital Twin Model (Half of previous 65x) */}
        <group scale={[32, 32, 32]}>
          <TruckModel accent={accent} laden={laden} headlights={true} spin={spin} />
        </group>

        {/* Dynamic Light Source illuminating the truck and road */}
        <pointLight
          color={accent}
          intensity={selected ? 7 : 4}
          distance={55}
          position={[0, 8, 0]}
        />

        {/* Floating Realistic Vehicle Icon & Digital Twin Status Billboard (Half of previous) */}
        <Billboard position={[0, selected ? 20 : 16, 0]}>
          {/* Main Backdrop Card */}
          <mesh position={[0, 0, -0.04]}>
            <planeGeometry args={[13.5, 4.4]} />
            <meshBasicMaterial
              color="#070c14"
              transparent
              opacity={0.92}
            />
          </mesh>
          {/* Glowing Border Accent */}
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[13.8, 4.7]} />
            <meshBasicMaterial
              color={selected ? '#ffd166' : accent}
              transparent
              opacity={selected ? 0.98 : 0.8}
            />
          </mesh>

          {/* Realistic Mahindra Bolero SCV Icon */}
          <mesh position={[-4.2, 0.1, 0.02]}>
            <planeGeometry args={[4.4, 2.8]} />
            <meshBasicMaterial map={truckIconTexture} transparent depthWrite={false} />
          </mesh>

          {/* Truck ID & Live Status */}
          <Text
            position={[-1.4, 1.25, 0]}
            fontSize={0.82}
            color={selected ? '#ffd166' : '#ffffff'}
            anchorX="left"
            anchorY="middle"
            font={undefined}
            outlineWidth={0.06}
            outlineColor="#000000"
          >
            {`${trip.truck_id} · ${isMoving ? 'LIVE RUN' : progress >= 1 ? 'ARRIVED' : 'READY'}`}
          </Text>

          {/* Corridor Route Line */}
          <Text
            position={[-1.4, 0.45, 0]}
            fontSize={0.58}
            color="#cbd5e1"
            anchorX="left"
            anchorY="middle"
          >
            Pimpalgaon Basvant ➔ Nashik APMC
          </Text>

          {/* Live Progress Metrics */}
          <Text
            position={[-1.4, -0.35, 0]}
            fontSize={0.52}
            color={accent}
            anchorX="left"
            anchorY="middle"
          >
            {`${currentKm} km / ${totalKm.toFixed(1)} km (${Math.round(progress * 100)}%)`}
          </Text>

          {/* Progress Bar Container */}
          <mesh position={[0, -1.35, 0]}>
            <planeGeometry args={[12.6, 0.38]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          {/* Animated Filled Progress Bar */}
          <mesh position={[-6.3 + (progress * 12.6) / 2, -1.35, 0.01]}>
            <planeGeometry args={[Math.max(0.05, progress * 12.6), 0.38]} />
            <meshBasicMaterial color={accent} />
          </mesh>

          {/* Additional detail when truck is clicked/selected */}
          {selected && (
            <Text
              position={[0, -2.4, 0]}
              fontSize={0.55}
              color="#ffd166"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.04}
              outlineColor="#000000"
            >
              {`Payload: ${trip.served_kg}/${trip.spare_kg}kg · Detour: +${trip.detour_km}km · Stops: ${trip.stops.length}`}
            </Text>
          )}
        </Billboard>
      </group>
    </group>
  )
}


