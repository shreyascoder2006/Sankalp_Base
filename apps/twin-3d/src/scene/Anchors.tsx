import { Billboard, Text } from '@react-three/drei'
import type { Projection } from './projection'
import type { Corridor } from './types'

export default function Anchors({ corridor, proj }: { corridor: Corridor; proj: Projection }) {
  return (
    <group>
      {[corridor.origin, corridor.dest].map((a, i) => {
        const [x, y, z] = proj.point([a.lon, a.lat], 1.4)
        const isMandi = i === 1
        return (
          <group key={a.key} position={[x, y, z]}>
            <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
              {isMandi ? (
                <cylinderGeometry args={[2.4, 2.9, 3.2, 6]} />
              ) : (
                <boxGeometry args={[2.6, 2.6, 2.6]} />
              )}
              <meshStandardMaterial
                color={isMandi ? '#5b9dff' : '#8ab4ff'}
                emissive={isMandi ? '#5b9dff' : '#8ab4ff'}
                emissiveIntensity={0.85}
                metalness={0.35}
                roughness={0.4}
              />
            </mesh>
            <pointLight color="#5b9dff" intensity={14} distance={40} />
            <Billboard position={[0, 6.4, 0]}>
              <Text fontSize={2.8} color="#dbe7f5" anchorY="bottom" outlineWidth={0.12} outlineColor="#070b10">
                {a.name}
              </Text>
              <Text position={[0, -3.1, 0]} fontSize={1.7} color="#7e8ea3" anchorY="bottom">
                {isMandi ? 'destination mandi' : 'truck origin'}
              </Text>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}
