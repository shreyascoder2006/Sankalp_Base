import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A Bolero-class pickup, modelled in units where 1.0 is the vehicle's length (~5 m), so
 * the whole thing can be scaled without the proportions drifting.
 *
 * Proportion is what makes it read as a truck at a glance: a cab roughly a third of the
 * length, a bed a little under half, wheels at the corners, and a bonnet that steps down
 * from the cab. Flat boxes of the right size read as a crate; these read as a vehicle.
 */

const BODY = '#e8eef5'
const GLASS = '#101c28'
const TYRE = '#14181d'
const CHASSIS = '#2a3340'

function Wheel({ x, z, spin }: { x: number; z: number; spin: React.RefObject<number> }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = spin.current
  })
  return (
    <group position={[x, 0.085, z]} rotation={[0, 0, Math.PI / 2]}>
      <mesh ref={ref} castShadow>
        <cylinderGeometry args={[0.085, 0.085, 0.07, 18]} />
        <meshStandardMaterial color={TYRE} roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.042, 0.042, 0.075, 12]} />
        <meshStandardMaterial color="#8a949f" roughness={0.45} metalness={0.7} />
      </mesh>
    </group>
  )
}

export default function TruckModel({
  accent,
  laden,
  headlights,
  spin,
}: {
  accent: string
  laden: number
  headlights: boolean
  spin: React.RefObject<number>
}) {
  const bedFill = Math.max(0.02, Math.min(laden, 1)) * 0.17

  return (
    <group>
      {/* chassis rail */}
      <mesh position={[0, 0.075, 0]} castShadow>
        <boxGeometry args={[0.3, 0.05, 0.92]} />
        <meshStandardMaterial color={CHASSIS} roughness={0.7} metalness={0.5} />
      </mesh>

      {/* bonnet */}
      <mesh position={[0, 0.155, 0.345]} castShadow>
        <boxGeometry args={[0.345, 0.1, 0.21]} />
        <meshStandardMaterial color={BODY} roughness={0.42} metalness={0.25} />
      </mesh>

      {/* cab */}
      <mesh position={[0, 0.215, 0.14]} castShadow>
        <boxGeometry args={[0.36, 0.22, 0.2]} />
        <meshStandardMaterial color={BODY} roughness={0.42} metalness={0.25} />
      </mesh>
      {/* windscreen, raked */}
      <mesh position={[0, 0.245, 0.242]} rotation={[-0.42, 0, 0]}>
        <boxGeometry args={[0.325, 0.125, 0.012]} />
        <meshStandardMaterial
          color={GLASS} roughness={0.12} metalness={0.85}
          emissive="#2b4a63" emissiveIntensity={0.25}
        />
      </mesh>
      {/* side glass */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.182, 0.25, 0.14]}>
          <boxGeometry args={[0.012, 0.1, 0.17]} />
          <meshStandardMaterial color={GLASS} roughness={0.12} metalness={0.85} />
        </mesh>
      ))}

      {/* cargo bed: floor plus four walls, so it reads as open and loadable */}
      <mesh position={[0, 0.125, -0.26]} castShadow>
        <boxGeometry args={[0.36, 0.04, 0.46]} />
        <meshStandardMaterial color={BODY} roughness={0.5} metalness={0.2} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.172, 0.2, -0.26]} castShadow>
          <boxGeometry args={[0.018, 0.12, 0.46]} />
          <meshStandardMaterial color={BODY} roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, -0.482]} castShadow>
        <boxGeometry args={[0.36, 0.12, 0.018]} />
        <meshStandardMaterial color={BODY} roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.2, -0.038]}>
        <boxGeometry args={[0.36, 0.14, 0.018]} />
        <meshStandardMaterial color={BODY} roughness={0.5} metalness={0.2} />
      </mesh>

      {/* crates: the payload, rising with how full the bed is */}
      {bedFill > 0.03 && (
        <mesh position={[0, 0.145 + bedFill / 2, -0.26]} castShadow>
          <boxGeometry args={[0.3, bedFill, 0.4]} />
          <meshStandardMaterial
            color="#d59b3c" roughness={0.78} metalness={0.05}
            emissive="#f0b429" emissiveIntensity={0.22}
          />
        </mesh>
      )}

      {/* accent stripe so the status colour reads without repainting the vehicle */}
      <mesh position={[0, 0.125, 0.03]}>
        <boxGeometry args={[0.372, 0.028, 0.56]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} />
      </mesh>

      <Wheel x={-0.185} z={0.3} spin={spin} />
      <Wheel x={0.185} z={0.3} spin={spin} />
      <Wheel x={-0.185} z={-0.3} spin={spin} />
      <Wheel x={0.185} z={-0.3} spin={spin} />

      {/* headlamps — a harvest run leaves before dawn, so these are on */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.12, 0.15, 0.452]}>
          <mesh>
            <boxGeometry args={[0.07, 0.045, 0.012]} />
            <meshStandardMaterial
              color="#fff6dd" emissive="#ffeab4"
              emissiveIntensity={headlights ? 3.2 : 0.2}
            />
          </mesh>
          {headlights && (
            <spotLight
              position={[0, 0, 0.05]} target-position={[s * 0.3, -0.4, 4]}
              angle={0.5} penumbra={0.6} intensity={9} distance={9}
              color="#ffeec9"
            />
          )}
        </group>
      ))}

      {/* tail lamps */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.13, 0.19, -0.492]}>
          <boxGeometry args={[0.05, 0.035, 0.012]} />
          <meshStandardMaterial color="#8c1c1c" emissive="#ff3b3b" emissiveIntensity={1.4} />
        </mesh>
      ))}

      {/* contact shadow: without something grounding it, a vehicle reads as floating */}
      <mesh position={[0, 0.012, -0.03]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.52, 1.05]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.34} depthWrite={false} />
      </mesh>
    </group>
  )
}
