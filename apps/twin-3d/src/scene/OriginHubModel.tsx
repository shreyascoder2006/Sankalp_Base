import { useMemo } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { getRealisticHubTexture } from './realisticIcons'

/**
 * Realistic Fleet Origin & Dispatch Hub (Pimpalgaon Baswant).
 *
 * The staging hub where SCV drivers congregate at dawn:
 * - Dispatch management cabin
 * - Diesel fueling island & canopy
 * - Staged empty crate piles for return backhauls
 * - Truck parking bays
 * - Floating 3D Hub Telemetry Pin with realistic fleet icon
 */

export default function OriginHubModel({ name }: { name: string }) {
  const hubIconTexture = useMemo(() => getRealisticHubTexture(), [])
  return (
    <group>
      {/* 1. Ground Apron */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[18, 0.1, 14]} />
        <meshStandardMaterial color="#1a202c" roughness={0.9} />
      </mesh>

      {/* 2. Fleet Dispatch Office Cabin */}
      <group position={[-5, 0, -3]}>
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 2.7, 3.4]} />
          <meshStandardMaterial color="#4a5568" roughness={0.7} />
        </mesh>
        {/* Office Slanted Roof */}
        <mesh position={[0, 2.85, 0]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[4.6, 0.15, 3.8]} />
          <meshStandardMaterial color="#2d3748" metalness={0.4} />
        </mesh>
        {/* Office Window & Door */}
        <mesh position={[0.8, 1.3, 1.72]}>
          <planeGeometry args={[1.5, 1.2]} />
          <meshStandardMaterial color="#1a365d" roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[-1.1, 1.1, 1.72]}>
          <planeGeometry args={[0.9, 2.1]} />
          <meshStandardMaterial color="#2b6cb0" />
        </mesh>
        <pointLight position={[0, 1.8, 2]} color="#fed7aa" intensity={6} distance={10} />
      </group>

      {/* 3. Fuel Canopy Island (Diesel Depot for SCVs) */}
      <group position={[3.5, 0, -2]}>
        {/* Raised concrete island */}
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <boxGeometry args={[2.8, 0.35, 6.5]} />
          <meshStandardMaterial color="#718096" roughness={0.8} />
        </mesh>
        {/* Dual Fuel Dispensers */}
        {[-1.6, 1.6].map((z) => (
          <group key={z} position={[0, 0.9, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.8, 1.3, 0.8]} />
              <meshStandardMaterial color="#3182ce" metalness={0.5} roughness={0.3} />
            </mesh>
            {/* Display screen */}
            <mesh position={[0.41, 0.2, 0]}>
              <planeGeometry args={[0.3, 0.3]} />
              <meshBasicMaterial color="#68d391" />
            </mesh>
          </group>
        ))}
        {/* Steel Canopy Pillars */}
        {[-0.9, 0.9].map((x) =>
          [-2.2, 2.2].map((z) => (
            <mesh key={`p-${x}-${z}`} position={[x, 2.2, z]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 3.8, 8]} />
              <meshStandardMaterial color="#a0aec0" metalness={0.8} />
            </mesh>
          ))
        )}
        {/* Overhead Canopy Roof */}
        <mesh position={[0, 4.15, 0]} castShadow>
          <boxGeometry args={[4.2, 0.3, 7.8]} />
          <meshStandardMaterial color="#2b6cb0" roughness={0.4} />
        </mesh>
        {/* Canopy under-glow */}
        <pointLight position={[0, 3.8, 0]} color="#ffffff" intensity={12} distance={14} />
      </group>

      {/* 4. Empty Return Crate Pallets (Ready for backhaul distribution) */}
      <group position={[4, 0, 4]}>
        {[-1.2, 1.2].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[1.6, 0.15, 1.6]} />
              <meshStandardMaterial color="#795548" roughness={0.9} />
            </mesh>
            {[0, 1, 2, 3].map((h) => (
              <mesh key={h} position={[0, 0.3 + h * 0.25, 0]}>
                <boxGeometry args={[1.4, 0.2, 1.4]} />
                <meshStandardMaterial color="#4299e1" roughness={0.6} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* 5. Realistic 3D Origin Telemetry Pin */}
      <Billboard position={[0, 10.5, 0]}>
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[13.5, 3.6]} />
          <meshBasicMaterial color="#08101a" transparent opacity={0.88} />
        </mesh>
        <mesh position={[0, 0, -0.08]}>
          <planeGeometry args={[13.8, 3.9]} />
          <meshBasicMaterial color="#4299e1" transparent opacity={0.45} />
        </mesh>

        {/* Realistic Fleet Dispatch Hub Terminal Icon (Replaces generic emoji) */}
        <mesh position={[-5.1, 0.35, 0.05]}>
          <planeGeometry args={[2.2, 1.8]} />
          <meshBasicMaterial map={hubIconTexture} transparent depthWrite={false} />
        </mesh>

        <Text
          position={[-3.6, 0.55, 0]}
          fontSize={1.1}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#05080c"
        >
          {name.toUpperCase()}
        </Text>
        <Text
          position={[-3.6, -0.2, 0]}
          fontSize={0.72}
          color="#90cdf4"
          anchorX="left"
          anchorY="middle"
        >
          Primary SCV Staging Terminal · Corridor Fleet Origin
        </Text>
        <Text
          position={[-3.6, -0.8, 0]}
          fontSize={0.62}
          color="#cbd5e0"
          anchorX="left"
          anchorY="middle"
        >
          Daily Fuel Depot · 60 Registered Vehicles · Dawn Harvest Mobilization
        </Text>
      </Billboard>
    </group>
  )
}
