import { useMemo } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { getRealisticMandiTexture } from './realisticIcons'

/**
 * Realistic APMC Wholesale Mandi Complex (Nashik APMC Terminal).
 *
 * In Maharashtra agriculture, the APMC Mandi is a large logistics facility:
 * - Large corrugated gabled auction sheds with exposed steel columns
 * - Raised concrete loading/unloading bays with ramps
 * - Stacks of agricultural fruit/vegetable crates (tomatoes, onions)
 * - Entrance gatehouse & truck weighbridge (Dharamkanta)
 * - High-mast yard floodlight towers casting warm illumination
 * - Parked delivery SCVs at the loading docks
 * - Crisp overhead telemetry badge with realistic mandi icon
 */

export default function MandiModel({ name }: { name: string }) {
  const mandiIconTexture = useMemo(() => getRealisticMandiTexture(), [])
  // Generate random crate stack configurations
  const crateColors = ['#d93829', '#e67e22', '#27ae60', '#f39c12']

  const crateStacks = useMemo(() => {
    const stacks = []
    for (let row = -2; row <= 2; row++) {
      for (let col = -1; col <= 1; col++) {
        if (Math.abs(row) === 1 && col === 0) continue // aisle
        const height = 2 + Math.floor((Math.sin(row * 3 + col * 5) + 1) * 2)
        stacks.push({
          x: row * 1.6 + (col % 2 === 0 ? 0.2 : -0.2),
          z: col * 1.8 + 2.2,
          height,
          color: crateColors[Math.abs(row + col) % crateColors.length],
        })
      }
    }
    return stacks
  }, [])

  return (
    <group>
      {/* 1. Ground Apron / Yard Pavement */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[26, 0.1, 20]} />
        <meshStandardMaterial
          color="#161b22"
          roughness={0.92}
          metalness={0.1}
        />
      </mesh>

      {/* Yard Boundary Curb & Yellow Hazard Lines */}
      <mesh position={[0, 0.12, 9.8]}>
        <boxGeometry args={[26, 0.04, 0.25]} />
        <meshStandardMaterial color="#f0b429" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.12, -9.8]}>
        <boxGeometry args={[26, 0.04, 0.25]} />
        <meshStandardMaterial color="#f0b429" roughness={0.5} />
      </mesh>

      {/* 2. Main Wholesale Covered Auction Hall 1 (North Shed) */}
      <group position={[0, 0, -3.5]}>
        {/* Raised Concrete Loading Dock Platform */}
        <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
          <boxGeometry args={[20, 1.1, 8.5]} />
          <meshStandardMaterial color="#2d3748" roughness={0.85} metalness={0.15} />
        </mesh>

        {/* Steel Structural Columns supporting roof */}
        {[-8.5, -4.5, 0, 4.5, 8.5].map((x) =>
          [-3.6, 3.6].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 2.5, z]} castShadow>
              <cylinderGeometry args={[0.14, 0.14, 3.8, 8]} />
              <meshStandardMaterial color="#718096" metalness={0.7} roughness={0.3} />
            </mesh>
          ))
        )}

        {/* Roof Trusses */}
        {[-8.5, -4.5, 0, 4.5, 8.5].map((x) => (
          <mesh key={`truss-${x}`} position={[x, 4.25, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.15, 0.2, 7.8]} />
            <meshStandardMaterial color="#4a5568" metalness={0.6} />
          </mesh>
        ))}

        {/* Corrugated Gabled Roof (West pitch) */}
        <mesh position={[0, 4.85, -1.95]} rotation={[0.26, 0, 0]} castShadow>
          <boxGeometry args={[21.5, 0.16, 4.4]} />
          <meshStandardMaterial
            color="#285e61"
            roughness={0.55}
            metalness={0.35}
          />
        </mesh>
        {/* Corrugated Gabled Roof (East pitch) */}
        <mesh position={[0, 4.85, 1.95]} rotation={[-0.26, 0, 0]} castShadow>
          <boxGeometry args={[21.5, 0.16, 4.4]} />
          <meshStandardMaterial
            color="#285e61"
            roughness={0.55}
            metalness={0.35}
          />
        </mesh>

        {/* Shed Interior Glow (Early morning wholesale auction lighting) */}
        <pointLight position={[0, 3.6, 0]} color="#fff3d1" intensity={18} distance={18} />
      </group>

      {/* 3. Secondary Open Auction Canopy (South Shed) */}
      <group position={[-3, 0, 4.5]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 0.7, 5.5]} />
          <meshStandardMaterial color="#2d3748" roughness={0.85} />
        </mesh>

        {/* Pillars */}
        {[-5, 0, 5].map((x) =>
          [-2.2, 2.2].map((z) => (
            <mesh key={`col2-${x}-${z}`} position={[x, 1.8, z]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 2.7, 8]} />
              <meshStandardMaterial color="#718096" metalness={0.6} />
            </mesh>
          ))
        )}

        {/* Gabled Roof */}
        <mesh position={[0, 3.2, 0]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[13, 0.15, 6]} />
          <meshStandardMaterial color="#7b341e" roughness={0.6} metalness={0.2} />
        </mesh>
      </group>

      {/* 4. Crate Stacks & Pallets (Agricultural Produce) */}
      {crateStacks.map((s, idx) => (
        <group key={`crate-${idx}`} position={[s.x, 1.2, s.z]}>
          {/* Wooden Pallet */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[1.2, 0.1, 1.2]} />
            <meshStandardMaterial color="#8d6e63" roughness={0.9} />
          </mesh>
          {/* Tiered plastic crates */}
          {Array.from({ length: s.height }).map((_, h) => (
            <mesh key={h} position={[0, 0.18 + h * 0.26, 0]} castShadow>
              <boxGeometry args={[1.05, 0.22, 1.05]} />
              <meshStandardMaterial
                color={s.color}
                roughness={0.65}
                metalness={0.1}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* 5. Gatehouse & Truck Weighbridge (Dharamkanta) */}
      <group position={[8.5, 0, 5.5]}>
        {/* Weighbridge Metal Platform */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[3.2, 0.1, 6]} />
          <meshStandardMaterial color="#4a5568" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Yellow guide rails */}
        {[-1.5, 1.5].map((x) => (
          <mesh key={x} position={[x, 0.35, 0]}>
            <boxGeometry args={[0.1, 0.45, 6]} />
            <meshStandardMaterial color="#f0b429" />
          </mesh>
        ))}

        {/* Weighbridge Control Cabin */}
        <group position={[3.2, 0, 0]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[2.2, 2.3, 3]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
          {/* Glass window */}
          <mesh position={[-1.05, 1.4, 0]}>
            <boxGeometry args={[0.1, 1.1, 2.2]} />
            <meshStandardMaterial color="#1a365d" roughness={0.1} metalness={0.8} />
          </mesh>
          {/* Cabin Flat Roof */}
          <mesh position={[0, 2.4, 0]}>
            <boxGeometry args={[2.5, 0.15, 3.3]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          {/* Office Light */}
          <pointLight position={[0, 1.5, 0]} color="#fed7aa" intensity={4} distance={6} />
        </group>

        {/* Entrance Gate Arch */}
        <group position={[0, 0, 3.8]}>
          {[-2.2, 2.2].map((x) => (
            <mesh key={x} position={[x, 2.2, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 4.4, 12]} />
              <meshStandardMaterial color="#2b6cb0" />
            </mesh>
          ))}
          {/* Overhead Signboard Arch */}
          <mesh position={[0, 4.2, 0]}>
            <boxGeometry args={[5.2, 0.9, 0.3]} />
            <meshStandardMaterial color="#1a365d" roughness={0.4} />
          </mesh>
          <Billboard position={[0, 4.2, 0.25]}>
            <Text fontSize={0.42} color="#ffffff" font={undefined} anchorY="middle">
              APMC NASHIK · KRISHI UTPANNA
            </Text>
          </Billboard>
        </group>
      </group>

      {/* 6. High-Mast Yard Floodlight Towers */}
      {[-11, 11].map((x, i) => (
        <group key={`light-${i}`} position={[x, 0, -8]}>
          {/* Tall steel lattice mast */}
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[0.12, 0.28, 10, 8]} />
            <meshStandardMaterial color="#a0aec0" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Head frame */}
          <mesh position={[0, 10.1, 0]}>
            <boxGeometry args={[1.2, 0.2, 0.8]} />
            <meshStandardMaterial color="#4a5568" />
          </mesh>
          {/* Spotlight bulbs */}
          <pointLight position={[0, 10.2, 0.5]} color="#fff7ed" intensity={35} distance={38} />
          {/* Visual light fixtures */}
          <mesh position={[0, 9.9, 0.3]}>
            <boxGeometry args={[0.9, 0.25, 0.2]} />
            <meshStandardMaterial color="#fffbeb" emissive="#ffedd5" emissiveIntensity={3} />
          </mesh>
        </group>
      ))}

      {/* 7. Parked SCV at Loading Bay */}
      <group position={[6.5, 0.1, -1.8]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Cab */}
        <mesh position={[0, 0.6, 0.9]} castShadow>
          <boxGeometry args={[1.4, 1.1, 1.1]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
        </mesh>
        {/* Cargo Bed */}
        <mesh position={[0, 0.5, -0.4]} castShadow>
          <boxGeometry args={[1.45, 0.9, 1.7]} />
          <meshStandardMaterial color="#4a5568" roughness={0.5} />
        </mesh>
        {/* Wheels */}
        {[-0.75, 0.75].map((x) =>
          [-0.6, 0.8].map((z) => (
            <mesh key={`pk-whl-${x}-${z}`} position={[x, 0.25, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.26, 0.26, 0.2, 12]} />
              <meshStandardMaterial color="#1a202c" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>

      {/* 8. Realistic Floating 3D Mandi Telemetry Pin */}
      <Billboard position={[0, 13.5, 0]}>
        {/* Outer Glowing Badge Container */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[14.5, 4.2]} />
          <meshBasicMaterial color="#0b1320" transparent opacity={0.88} />
        </mesh>
        <mesh position={[0, 0, -0.08]}>
          <planeGeometry args={[14.8, 4.5]} />
          <meshBasicMaterial color="#3182ce" transparent opacity={0.5} />
        </mesh>

        {/* Realistic APMC Wholesale Mandi Terminal Icon (Replaces generic emoji) */}
        <mesh position={[-5.3, 0.45, 0.05]}>
          <planeGeometry args={[2.5, 2.0]} />
          <meshBasicMaterial map={mandiIconTexture} transparent depthWrite={false} />
        </mesh>

        {/* Mandi Title & Description */}
        <Text
          position={[-3.8, 0.75, 0]}
          fontSize={1.25}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          outlineWidth={0.06}
          outlineColor="#05080c"
        >
          {name.toUpperCase()}
        </Text>
        <Text
          position={[-3.8, -0.15, 0]}
          fontSize={0.78}
          color="#90cdf4"
          anchorX="left"
          anchorY="middle"
        >
          Central APMC Terminal · Agricultural Wholesale Mandi
        </Text>
        <Text
          position={[-3.8, -0.9, 0]}
          fontSize={0.65}
          color="#cbd5e0"
          anchorX="left"
          anchorY="middle"
        >
          Active Loading Docks · Dharamkanta Weighbridge · Yard Capacity: 60+ SCVs
        </Text>

        {/* Live Status Tag */}
        <mesh position={[5.4, 0.85, 0]}>
          <planeGeometry args={[2.5, 0.7]} />
          <meshBasicMaterial color="#22543d" />
        </mesh>
        <Text
          position={[5.4, 0.85, 0.05]}
          fontSize={0.4}
          color="#9ae6b4"
          anchorX="center"
          anchorY="middle"
        >
          ● YARD ACTIVE
        </Text>
      </Billboard>
    </group>
  )
}
