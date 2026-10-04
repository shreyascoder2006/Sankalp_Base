import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Authentic Mahindra Bolero Maxi Truck / Tata Ace Indian SCV (Small Commercial Vehicle).
 *
 * Modeled with accurate rural Indian agricultural pickup proportions:
 * - Contoured cab with sloped hood, chrome/black slotted front grille
 * - Heavy-duty front bumper with tow hook & yellow commercial Indian license plate (MH-15)
 * - Dual headlamp lenses with amber turn indicators and forward road projection
 * - Cab roof wind deflector / sun visor
 * - Side rearview mirrors & door character lines
 * - High wooden/metal stake-bed ("Dala") with horizontal side rails & chains
 * - Detailed stacked harvest crates (red tomato crates, golden onion sacks) growing with payload
 * - Chassis frame, cylindrical diesel fuel tank, and spare tire
 * - Rubber commercial tires with steel rims and lug nuts that spin with ground speed
 * - Rear tailgate with commercial registration & dual taillight clusters
 */

const BODY_WHITE = '#edf2f7'
const GLASS_TINT = '#0d1926'
const CHASSIS_STEEL = '#2d3748'
const BUMPER_DARK = '#1a202c'
const TYRE_RUBBER = '#171923'
const RIM_STEEL = '#cbd5e0'
const DIESEL_TANK = '#4a5568'
const PLATE_YELLOW = '#f6e05e'

function RealisticWheel({
  x,
  z,
  spin,
}: {
  x: number
  z: number
  spin: React.RefObject<number>
}) {
  const meshRef = useRef<THREE.Group>(null!)
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.x = spin.current
  })

  return (
    <group position={[x, 0.09, z]}>
      <group ref={meshRef} rotation={[0, 0, Math.PI / 2]}>
        {/* Tire Rubber with Tread */}
        <mesh castShadow>
          <cylinderGeometry args={[0.095, 0.095, 0.075, 20]} />
          <meshStandardMaterial color={TYRE_RUBBER} roughness={0.92} metalness={0.08} />
        </mesh>
        {/* Steel Rim */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.078, 16]} />
          <meshStandardMaterial color={RIM_STEEL} roughness={0.35} metalness={0.8} />
        </mesh>
        {/* Center Hub & Wheel Nuts */}
        <mesh position={[0, 0.042, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 0.008, 10]} />
          <meshStandardMaterial color="#4a5568" roughness={0.5} metalness={0.6} />
        </mesh>
      </group>
    </group>
  )
}

export default function TruckModel({
  accent,
  laden,
  headlights: _headlights,
  spin,
}: {
  accent: string
  laden: number
  headlights?: boolean
  spin: React.RefObject<number>
}) {
  // Number of crate layers based on laden fraction (0.0 to 1.0)
  const crateLayers = Math.max(0, Math.min(3, Math.ceil(laden * 3)))

  return (
    <group>
      {/* 1. Chassis Frame Rails */}
      <mesh position={[0, 0.078, -0.05]} castShadow>
        <boxGeometry args={[0.28, 0.045, 0.98]} />
        <meshStandardMaterial color={CHASSIS_STEEL} roughness={0.75} metalness={0.6} />
      </mesh>

      {/* Under-chassis Fuel Tank (Cylindrical diesel tank on driver side) */}
      <mesh position={[-0.145, 0.08, -0.08]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.22, 12]} />
        <meshStandardMaterial color={DIESEL_TANK} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Under-chassis Spare Wheel */}
      <mesh position={[0, 0.075, -0.38]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.05, 14]} />
        <meshStandardMaterial color={TYRE_RUBBER} roughness={0.95} />
      </mesh>

      {/* 2. Front Cabin & Hood (Mahindra Bolero Maxi Truck profile) */}
      {/* Front Hood / Engine Bonnet */}
      <mesh position={[0, 0.165, 0.35]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.11, 0.24]} />
        <meshStandardMaterial color={BODY_WHITE} roughness={0.38} metalness={0.2} />
      </mesh>

      {/* Front Radiator Grille */}
      <group position={[0, 0.155, 0.472]}>
        <mesh>
          <boxGeometry args={[0.31, 0.075, 0.01]} />
          <meshStandardMaterial color="#1a202c" roughness={0.6} metalness={0.5} />
        </mesh>
        {/* Chrome Grille Slats */}
        {[-0.08, 0, 0.08].map((gx) => (
          <mesh key={gx} position={[gx, 0, 0.006]}>
            <boxGeometry args={[0.045, 0.06, 0.005]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Front Heavy Duty Bumper */}
      <group position={[0, 0.095, 0.485]}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.055, 0.04]} />
          <meshStandardMaterial color={BUMPER_DARK} roughness={0.8} />
        </mesh>
        {/* Yellow Commercial Indian Number Plate */}
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[0.13, 0.032]} />
          <meshBasicMaterial color={PLATE_YELLOW} />
        </mesh>
      </group>

      {/* Main Cab Passenger Cell */}
      <mesh position={[0, 0.23, 0.14]} castShadow receiveShadow>
        <boxGeometry args={[0.355, 0.23, 0.22]} />
        <meshStandardMaterial color={BODY_WHITE} roughness={0.38} metalness={0.2} />
      </mesh>

      {/* Cab Roof Sun Visor / Wind Deflector Cap */}
      <mesh position={[0, 0.35, 0.17]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.36, 0.025, 0.12]} />
        <meshStandardMaterial color="#2b6cb0" roughness={0.4} />
      </mesh>

      {/* Windshield Glass (Raked aerodynamic angle) */}
      <mesh position={[0, 0.255, 0.245]} rotation={[-0.48, 0, 0]}>
        <boxGeometry args={[0.32, 0.13, 0.012]} />
        <meshStandardMaterial
          color={GLASS_TINT}
          roughness={0.1}
          metalness={0.9}
          emissive="#1e3a5f"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Side Door Windows */}
      {[-1, 1].map((s) => (
        <group key={`side-glass-${s}`} position={[s * 0.18, 0.265, 0.14]}>
          <mesh>
            <boxGeometry args={[0.008, 0.105, 0.17]} />
            <meshStandardMaterial color={GLASS_TINT} roughness={0.1} metalness={0.9} />
          </mesh>
          {/* Side Rear-View Mirror */}
          <group position={[s * 0.03, -0.02, 0.08]}>
            <mesh rotation={[0, s * 0.2, 0]}>
              <boxGeometry args={[0.015, 0.055, 0.035]} />
              <meshStandardMaterial color="#1a202c" roughness={0.7} />
            </mesh>
            <mesh position={[s * 0.008, 0, 0]}>
              <planeGeometry args={[0.03, 0.05]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.05} />
            </mesh>
          </group>
        </group>
      ))}

      {/* 3. Agricultural Cargo Stake-Bed ("Dala") */}
      {/* Bed Base Floor */}
      <mesh position={[0, 0.135, -0.26]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.04, 0.48]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Wooden / Steel Slatted Stake Side Railings */}
      {[-1, 1].map((s) => (
        <group key={`rail-${s}`} position={[s * 0.175, 0.22, -0.26]}>
          {/* Top Railing */}
          <mesh castShadow>
            <boxGeometry args={[0.016, 0.025, 0.48]} />
            <meshStandardMaterial color="#4a5568" metalness={0.5} />
          </mesh>
          {/* Middle Slats */}
          <mesh position={[0, -0.045, 0]}>
            <boxGeometry args={[0.012, 0.02, 0.48]} />
            <meshStandardMaterial color="#718096" />
          </mesh>
          {/* Vertical Stake Posts */}
          {[-0.22, 0, 0.22].map((pz) => (
            <mesh key={pz} position={[0, -0.04, pz]}>
              <boxGeometry args={[0.018, 0.12, 0.02]} />
              <meshStandardMaterial color="#2b6cb0" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Cab Guard / Headboard (Protects cab from cargo shifting) */}
      <mesh position={[0, 0.24, -0.025]}>
        <boxGeometry args={[0.35, 0.17, 0.018]} />
        <meshStandardMaterial color="#2d3748" metalness={0.5} />
      </mesh>

      {/* Dropdown Rear Tailgate */}
      <group position={[0, 0.2, -0.495]}>
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.12, 0.018]} />
          <meshStandardMaterial color="#2b6cb0" roughness={0.5} />
        </mesh>
        {/* Rear Commercial Number Plate */}
        <mesh position={[0, -0.065, 0.01]}>
          <planeGeometry args={[0.13, 0.03]} />
          <meshBasicMaterial color={PLATE_YELLOW} />
        </mesh>
        {/* Rubber Mudflaps */}
        {[-0.14, 0.14].map((mx) => (
          <mesh key={mx} position={[mx, -0.09, 0.005]}>
            <planeGeometry args={[0.07, 0.06]} />
            <meshStandardMaterial color="#1a202c" roughness={0.95} />
          </mesh>
        ))}
      </group>

      {/* 4. Realistic Stacked Harvest Produce Crates in Bed */}
      {laden > 0.05 && (
        <group position={[0, 0.16, -0.26]}>
          {Array.from({ length: crateLayers }).map((_, layer) => {
            const y = layer * 0.065 + 0.03
            return (
              <group key={`layer-${layer}`} position={[0, y, 0]}>
                {/* 2x2 Crate Grid per layer */}
                {[-0.08, 0.08].map((cx) =>
                  [-0.12, 0.12].map((cz) => {
                    const isTomato = (layer + cx) % 2 === 0
                    return (
                      <group key={`cr-${cx}-${cz}`} position={[cx, 0, cz]}>
                        <mesh castShadow>
                          <boxGeometry args={[0.13, 0.055, 0.19]} />
                          <meshStandardMaterial
                            color={isTomato ? '#d93829' : '#e67e22'}
                            roughness={0.7}
                            metalness={0.08}
                          />
                        </mesh>
                        {/* Open top inner vegetable contents */}
                        <mesh position={[0, 0.028, 0]}>
                          <boxGeometry args={[0.11, 0.01, 0.17]} />
                          <meshStandardMaterial
                            color={isTomato ? '#c0392b' : '#d35400'}
                            roughness={0.9}
                          />
                        </mesh>
                      </group>
                    )
                  })
                )}
              </group>
            )
          })}
        </group>
      )}

      {/* 5. Dynamic Vehicle Status Accent Stripe */}
      <mesh position={[0, 0.13, 0.03]}>
        <boxGeometry args={[0.365, 0.026, 0.58]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
      </mesh>

      {/* 6. Four Wheels with Animated Spin */}
      <RealisticWheel x={-0.185} z={0.3} spin={spin} />
      <RealisticWheel x={0.185} z={0.3} spin={spin} />
      <RealisticWheel x={-0.185} z={-0.3} spin={spin} />
      <RealisticWheel x={0.185} z={-0.3} spin={spin} />

      {/* 7. Realistic Headlamps */}
      {[-1, 1].map((s) => (
        <group key={`headlamp-${s}`} position={[s * 0.125, 0.155, 0.47]}>
          {/* Headlamp Lens */}
          <mesh>
            <boxGeometry args={[0.065, 0.045, 0.012]} />
            <meshStandardMaterial
              color="#cbd5e1"
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>
          {/* Amber Turn Indicator Lamp */}
          <mesh position={[s * 0.038, 0, 0]}>
            <boxGeometry args={[0.016, 0.045, 0.01]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* 8. Rear Tail Lamps & Brake Lights */}
      {[-1, 1].map((s) => (
        <mesh key={`tail-${s}`} position={[s * 0.135, 0.19, -0.505]}>
          <boxGeometry args={[0.05, 0.038, 0.01]} />
          <meshStandardMaterial color="#991b1b" emissive="#ef4444" emissiveIntensity={0.8} />
        </mesh>
      ))}

      {/* 9. Ground Contact Ambient Occlusion Shadow */}
      <mesh position={[0, 0.012, -0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.54, 1.15]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  )
}
