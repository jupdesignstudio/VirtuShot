import React, { useState, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Scene, Hotspot } from '../types';
import HotspotMarker from './HotspotMarker';
import { gsap } from 'gsap';
import { Check, X } from 'lucide-react';

interface VirtualWorldProps {
  currentScene: Scene;
  scenes: Scene[];
  isEditor: boolean;
  onHotspotClick: (hotspot: Hotspot) => void;
  onAddHotspot?: (position: [number, number, number]) => void;
  onDeleteHotspot?: (id: string) => void;
}

const VirtualWorld: React.FC<VirtualWorldProps> = ({ 
  currentScene, 
  scenes,
  isEditor, 
  onHotspotClick,
  onAddHotspot,
  onDeleteHotspot
}) => {
  const { camera } = useThree();
  
  // Texture State Manager
  const [activeTexture, setActiveTexture] = useState<THREE.Texture | null>(null);
  const [incomingTexture, setIncomingTexture] = useState<THREE.Texture | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Refs for Animation
  const activeSphereRef = useRef<THREE.Mesh>(null);
  const incomingSphereRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<any>(null);
  const cursorRef = useRef<THREE.Group>(null);
  
  // Editor State
  const [pendingSpot, setPendingSpot] = useState<[number, number, number] | null>(null);
  const [isHoveringSphere, setIsHoveringSphere] = useState(false);
  
  // Track previous ID to detect changes
  const previousSceneIdRef = useRef<string>(currentScene.id);

  // Keyboard Inputs
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // -- Texture Loading & Transition Logic --
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    const loadTexture = (url: string): Promise<THREE.Texture> => {
      return new Promise((resolve) => {
        loader.load(url, (tex) => {
          tex.mapping = THREE.EquirectangularReflectionMapping;
          tex.colorSpace = THREE.SRGBColorSpace;
          resolve(tex);
        });
      });
    };

    // 1. Initial Load (First time only)
    if (!activeTexture) {
      loadTexture(currentScene.imageUrl).then((tex) => {
        setActiveTexture(tex);
        // Initial Fade In
        if (activeSphereRef.current) {
          (activeSphereRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
          gsap.to(activeSphereRef.current.material, { opacity: 1, duration: 1 });
        }
      });
      return;
    }

    // 2. Scene Change Detection
    if (currentScene.id !== previousSceneIdRef.current) {
      previousSceneIdRef.current = currentScene.id;
      setIsTransitioning(true);

      // Start Transition Sequence
      loadTexture(currentScene.imageUrl).then((newTex) => {
        setIncomingTexture(newTex);
        
        // At this point:
        // ActiveSphere has OLD texture (visible)
        // IncomingSphere has NEW texture (hidden underneath or behind)
        
        // Animation:
        // 1. Ensure incoming sphere is fully opaque but "behind" active sphere conceptually
        // 2. Fade OUT active sphere to reveal incoming sphere
        // 3. Zoom camera IN to simulate movement
        
        const tl = gsap.timeline({
          onComplete: () => {
            // Swap textures and reset state
            setActiveTexture(newTex);
            setIncomingTexture(null);
            setIsTransitioning(false);
            
            // Reset Camera Zoom (seamlessly if possible, or gentle zoom out)
             gsap.to(camera, { fov: 75, duration: 1.5, ease: "power2.out", onUpdate: () => camera.updateProjectionMatrix() });
             
            // Reset Opacity for the main sphere (now holding new texture)
            if (activeSphereRef.current) {
               (activeSphereRef.current.material as THREE.MeshBasicMaterial).opacity = 1;
            }
          }
        });

        // A. Zoom In
        tl.to(camera, { 
          fov: 40, 
          duration: 1.0, 
          ease: "power2.inOut",
          onUpdate: () => camera.updateProjectionMatrix() 
        }, 0);

        // B. Crossfade (Fade out top layer to reveal bottom layer)
        if (activeSphereRef.current) {
           tl.to(activeSphereRef.current.material, { opacity: 0, duration: 1.0, ease: "power1.inOut" }, 0);
        }
      });
    }
  }, [currentScene.id, currentScene.imageUrl]);

  // -- Interaction Handlers --

  useFrame((state, delta) => {
    // Cursor
    if (cursorRef.current) cursorRef.current.lookAt(state.camera.position);

    // Controls (WASD + QE)
    if (controlsRef.current) {
      const speed = 2.0 * delta; 
      const zoomSpeed = 50 * delta;
      
      if (keys.current['w']) controlsRef.current.setPolarAngle(controlsRef.current.getPolarAngle() - speed);
      if (keys.current['s']) controlsRef.current.setPolarAngle(controlsRef.current.getPolarAngle() + speed);
      if (keys.current['a']) controlsRef.current.setAzimuthAngle(controlsRef.current.getAzimuthAngle() - speed);
      if (keys.current['d']) controlsRef.current.setAzimuthAngle(controlsRef.current.getAzimuthAngle() + speed);
      
      if (keys.current['q']) {
         state.camera.fov = Math.min(state.camera.fov + zoomSpeed, 100);
         state.camera.updateProjectionMatrix();
      }
      if (keys.current['e']) {
         state.camera.fov = Math.max(state.camera.fov - zoomSpeed, 20);
         state.camera.updateProjectionMatrix();
      }
      controlsRef.current.update();
    }
  });

  const handleSphereClick = (e: any) => {
    if (!isEditor || !onAddHotspot || pendingSpot) return;
    e.stopPropagation();
    setPendingSpot([e.point.x, e.point.y, e.point.z]);
  };

  const handleHotspotInteraction = (hotspot: Hotspot) => {
    if (isEditor) {
      onHotspotClick(hotspot);
    } else {
      // For viewer, we just notify parent. Parent updates currentScene prop.
      // The useEffect above handles the visual transition.
      if (!isTransitioning) {
        onHotspotClick(hotspot);
      }
    }
  };

  const markerScale = 35;

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        enableZoom={true} 
        enablePan={false} 
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={-0.5} 
        minDistance={1} 
        maxDistance={200}
        mouseButtons={{
            LEFT: THREE.MOUSE.PAN, 
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        }}
      />

      {/* 
        LAYER 1: Incoming Scene (Background) 
        Rendered first (or behind) so it is revealed when top layer fades.
        Radius is slightly smaller to prevent z-fighting, or we rely on renderOrder.
      */}
      {incomingTexture && (
        <Sphere args={[498, 60, 40]} scale={[-1, 1, 1]}>
          <meshBasicMaterial map={incomingTexture} side={THREE.BackSide} toneMapped={false} />
        </Sphere>
      )}

      {/* 
        LAYER 2: Active Scene (Foreground) 
        This fades out during transition.
      */}
      {activeTexture && (
        <Sphere 
          ref={activeSphereRef}
          args={[500, 60, 40]} 
          scale={[-1, 1, 1]} 
          onClick={handleSphereClick}
          onPointerMove={(e) => {
             if (isEditor && !pendingSpot) {
                setIsHoveringSphere(true);
                if (cursorRef.current) cursorRef.current.position.copy(e.point);
             }
          }}
          onPointerOut={() => setIsHoveringSphere(false)}
        >
          <meshBasicMaterial 
            map={activeTexture} 
            side={THREE.BackSide} 
            toneMapped={false} 
            transparent={true} 
            opacity={1}
          />
        </Sphere>
      )}

      {/* Editor UI: Cursor */}
      {isEditor && !pendingSpot && (
        <group ref={cursorRef} visible={isHoveringSphere} renderOrder={20}>
          <mesh position={[0, 0, 0.5]} renderOrder={20}>
            <ringGeometry args={[markerScale * 0.5, markerScale * 0.6, 32]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.8} side={THREE.DoubleSide} depthTest={false} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* Editor UI: Pending Hotspot */}
      {pendingSpot && (
        <group position={new THREE.Vector3(...pendingSpot)} renderOrder={20}>
          <mesh lookAt={() => camera.position} renderOrder={20}>
             <ringGeometry args={[markerScale * 0.5, markerScale * 0.6, 32]} />
             <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} depthTest={false} depthWrite={false} />
          </mesh>
          <mesh lookAt={() => camera.position} renderOrder={20}>
             <circleGeometry args={[markerScale * 0.4, 32]} />
             <meshBasicMaterial color="#06b6d4" transparent opacity={0.8} side={THREE.DoubleSide} depthTest={false} depthWrite={false} />
          </mesh>
          <Html position={[0, 0, 0]} center>
             <div className="flex flex-col items-center gap-2 transform -translate-y-12 pointer-events-auto">
              <div className="bg-virtu-900/95 backdrop-blur-md border border-virtu-accent/50 p-2 rounded-xl shadow-2xl flex gap-2">
                <button onClick={() => { onAddHotspot && onAddHotspot(pendingSpot); setPendingSpot(null); }} className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg">
                  <Check size={16} strokeWidth={3} />
                </button>
                <button onClick={() => setPendingSpot(null)} className="p-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* Hotspots - Only show for Current Scene to avoid confusion during transition */}
      {!isTransitioning && currentScene.hotspots.map(h => {
        const targetScene = scenes.find(s => s.id === h.targetSceneId);
        return (
          <HotspotMarker 
            key={h.id} 
            hotspot={h} 
            onClick={() => handleHotspotInteraction(h)}
            isEditor={isEditor}
            onDelete={onDeleteHotspot}
            label={h.label || targetScene?.name || "Scene"}
          />
        );
      })}
    </>
  );
};

export default VirtualWorld;