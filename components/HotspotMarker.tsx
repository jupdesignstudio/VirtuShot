import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Hotspot } from '../types';

interface HotspotMarkerProps {
  hotspot: Hotspot;
  onClick: (id: string) => void;
  isEditor?: boolean;
  onDelete?: (id: string) => void;
  label?: string;
}

const HotspotMarker: React.FC<HotspotMarkerProps> = ({ hotspot, onClick, isEditor, onDelete, label }) => {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const spinningRingRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animate the marker
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.lookAt(state.camera.position);
    }
    
    // Pulsing animation for the outer aura
    if (ringRef.current) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        ringRef.current.scale.set(scale, scale, 1);
        const opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
        (ringRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }

    // Spinning animation for the inner detail ring
    if (spinningRingRef.current) {
        spinningRingRef.current.rotation.z -= delta * 2; // Rotate counter-clockwise
    }
  });

  const glowColor = "#06b6d4"; // Cyan/Blue branding
  
  // Scale increased to match sphere radius of 500.
  // Approx 30-40 units roughly equals 120px at standard zoom.
  const baseScale = 30;

  return (
    <group position={new THREE.Vector3(...hotspot.position)} ref={meshRef} renderOrder={10}>
      {/* Interaction Zone / Main Circle */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick(hotspot.id);
        }}
        onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
            setHovered(true);
        }}
        onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
            setHovered(false);
        }}
        renderOrder={10}
      >
        <circleGeometry args={[baseScale * 0.35, 32]} />
        <meshBasicMaterial 
          color={hovered ? "#ffffff" : glowColor} 
          opacity={0.9} 
          transparent 
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Spinning Dashed/Detail Ring */}
      <mesh position={[0, 0, -0.05]} ref={spinningRingRef} renderOrder={9}>
        <ringGeometry args={[baseScale * 0.45, baseScale * 0.5, 32]} />
        <meshBasicMaterial 
          color={glowColor} 
          opacity={0.8} 
          transparent 
          side={THREE.DoubleSide} 
          depthTest={false} 
          depthWrite={false}
          wireframe={false} 
        />
        {/* Decorative dashes can be simulated with a texture or just a simple wireframe look if desired, 
            but here we use a solid spinning ring to create movement */}
      </mesh>
      
      {/* Pulsing Outer Glow Ring */}
      <mesh position={[0, 0, -0.1]} ref={ringRef} renderOrder={8}>
        <ringGeometry args={[baseScale * 0.5, baseScale * 0.7, 32]} />
        <meshBasicMaterial 
          color={glowColor} 
          opacity={0.4} 
          transparent 
          side={THREE.DoubleSide} 
          depthTest={false} 
          depthWrite={false}
        />
      </mesh>

      {/* Inner White Dot */}
      <mesh position={[0, 0, 0.1]} renderOrder={11}>
        <circleGeometry args={[baseScale * 0.15, 32]} />
        <meshBasicMaterial 
            color="#ffffff" 
            opacity={1} 
            transparent 
            side={THREE.DoubleSide} 
            depthTest={false} 
            depthWrite={false}
        />
      </mesh>
      
      {/* Label / HTML Overlay */}
      {(hovered || isEditor) && (
        <Html position={[0, baseScale * 0.9, 0]} center distanceFactor={500} style={{ pointerEvents: 'none', zIndex: 100 }}>
          <div className="flex flex-col items-center space-y-1 min-w-[150px]">
            <div className="bg-virtu-900/95 backdrop-blur-md px-4 py-2 rounded-xl border border-virtu-accent/50 text-white text-sm font-bold shadow-2xl flex items-center gap-2 transform transition-all">
              <div className="w-2 h-2 rounded-full bg-virtu-accent animate-pulse shadow-[0_0_10px_#06b6d4]"></div>
              {label || "Select Destination"}
            </div>
            {isEditor && onDelete && (
              <button 
                className="pointer-events-auto bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(hotspot.id);
                }}
              >
                Delete
              </button>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default HotspotMarker;