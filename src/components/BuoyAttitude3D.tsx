import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BuoyAttitude3DProps {
  heading: number;
  pitch?: number;
  roll?: number;
}

export const BuoyAttitude3D: React.FC<BuoyAttitude3DProps> = ({
  heading,
  pitch = 3.2,
  roll = -1.8,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const buoyMeshRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 180;
    const height = container.clientHeight || 180;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 4.5, 6.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Ambient and directional lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Gimbal Ring / Artificial Horizon outer ring
    const gimbalGeo = new THREE.TorusGeometry(2.3, 0.04, 16, 48);
    const gimbalMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.4 });
    const gimbal = new THREE.Mesh(gimbalGeo, gimbalMat);
    gimbal.rotation.x = Math.PI / 2;
    scene.add(gimbal);

    // Cardinal directions indicators in 3D
    const northRingGeo = new THREE.RingGeometry(2.2, 2.35, 16, 1, Math.PI * 0.4, Math.PI * 0.2);
    northRingGeo.rotateX(-Math.PI / 2);
    const northRingMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
    const northMarker = new THREE.Mesh(northRingGeo, northRingMat);
    scene.add(northMarker);

    // 3D Buoy Model
    const buoyGroup = new THREE.Group();

    // Yellow Hull
    const hullGeo = new THREE.CylinderGeometry(1.5, 1.2, 0.8, 24);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.2 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    buoyGroup.add(hull);

    // Mast
    const mastGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.8, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 1.2;
    buoyGroup.add(mast);

    // Radome
    const radomeGeo = new THREE.SphereGeometry(0.25, 12, 12);
    const radomeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
    const radome = new THREE.Mesh(radomeGeo, radomeMat);
    radome.position.y = 2.1;
    buoyGroup.add(radome);

    // Heading Arrow on top of the deck
    const arrowGeo = new THREE.ConeGeometry(0.25, 0.8, 8);
    arrowGeo.rotateX(Math.PI / 2);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.position.set(0, 0.45, -0.9);
    buoyGroup.add(arrow);

    scene.add(buoyGroup);
    buoyMeshRef.current = buoyGroup;

    let frameId: number;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.03;

      if (buoyMeshRef.current) {
        // Dynamic wave kinematics combined with heading
        const dynamicPitch = ((pitch + Math.sin(time) * 2.5) * Math.PI) / 180;
        const dynamicRoll = ((roll + Math.cos(time * 0.8) * 2.0) * Math.PI) / 180;
        const targetYaw = (-heading * Math.PI) / 180;

        buoyMeshRef.current.rotation.x = dynamicPitch;
        buoyMeshRef.current.rotation.z = dynamicRoll;
        buoyMeshRef.current.rotation.y = targetYaw;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      hullGeo.dispose();
      hullMat.dispose();
    };
  }, []);

  // Update target heading
  useEffect(() => {
    if (buoyMeshRef.current) {
      buoyMeshRef.current.rotation.y = (-heading * Math.PI) / 180;
    }
  }, [heading]);

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full cursor-pointer" />
      <div className="absolute top-1 text-[10px] font-mono font-bold text-cyan-400 pointer-events-none">N</div>
      <div className="absolute right-1 text-[10px] font-mono text-zinc-500 pointer-events-none">E</div>
      <div className="absolute bottom-1 text-[10px] font-mono text-zinc-500 pointer-events-none">S</div>
      <div className="absolute left-1 text-[10px] font-mono text-zinc-500 pointer-events-none">W</div>
    </div>
  );
};
