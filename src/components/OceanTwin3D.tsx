import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  Eye, 
  Layers, 
  Radio, 
  Compass, 
  Thermometer, 
  Waves, 
  ArrowDownCircle, 
  Sliders, 
  Crosshair,
  Volume2,
  Cpu
} from 'lucide-react';
import { TelemetryData } from '../types';

interface OceanTwin3DProps {
  telemetry: TelemetryData;
  onDepthChange?: (depth: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

type CameraPreset = 'overview' | 'buoy' | 'probe' | 'wireframe';

export const OceanTwin3D: React.FC<OceanTwin3DProps> = ({
  telemetry,
  onDepthChange,
  isExpanded = false,
  onToggleExpand,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // 3D Object references for animations
  const buoyGroupRef = useRef<THREE.Group | null>(null);
  const probeGroupRef = useRef<THREE.Group | null>(null);
  const tetherMeshRef = useRef<THREE.Line | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const sonarRingsRef = useRef<THREE.Mesh[]>([]);
  const beaconLightRef = useRef<THREE.PointLight | null>(null);
  const strobeLedRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Camera animation target
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(12, 5, 22));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, -3, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, -3, 0));

  const [activePreset, setActivePreset] = useState<CameraPreset>('overview');
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [selectedSensor, setSelectedSensor] = useState<'all' | 'temp' | 'cond' | 'pressure' | 'transducer'>('all');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Mouse interaction for orbit
  const isDragging = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const spherical = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 25,
    theta: Math.PI / 4,
    phi: Math.PI / 2.8,
  });

  // Calculate target Y coordinate for probe based on telemetry depth (scaled for 3D view: 15m depth -> ~ -10 Y units)
  const probeTargetY = -Math.max(1, (telemetry.depth / 150) * 35);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050d18);
    scene.fog = new THREE.FogExp2(0x050d18, 0.022);

    // 2. Camera setup
    const width = container.clientWidth;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(15, 6, 25);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x1e3a5f, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xe0f2fe, 2.5);
    sunLight.position.set(20, 40, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Blue underwater up-light
    const deepOceanLight = new THREE.DirectionalLight(0x0891b2, 1.2);
    deepOceanLight.position.set(-10, -30, -10);
    scene.add(deepOceanLight);

    // 5. Ocean Surface Plane (Animated waves)
    const waterGeo = new THREE.PlaneGeometry(80, 80, 40, 40);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.72,
      wireframe: wireframeMode,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 0;
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // Store original position attribute for wave simulation
    const posAttr = waterGeo.attributes.position;
    const origPos = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count * 3; i++) {
      origPos[i] = posAttr.array[i];
    }
    waterMesh.userData.origPos = origPos;

    // 6. Stratification Grid & Depth Markers
    const depthMarkersGroup = new THREE.Group();
    const depths = [0, 25, 50, 80, 120, 150];
    depths.forEach(d => {
      const y = -(d / 150) * 35;
      // Ring boundary
      const ringGeo = new THREE.RingGeometry(18, 18.2, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: d === 0 ? 0x06b6d4 : d === 25 ? 0x14b8a6 : d === 80 ? 0x818cf8 : 0x334155,
        transparent: true,
        opacity: d === 25 || d === 80 ? 0.4 : 0.2,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = y;
      depthMarkersGroup.add(ring);
    });
    scene.add(depthMarkersGroup);

    // 7. Seabed bathymetry plane
    const seabedGeo = new THREE.PlaneGeometry(70, 70, 20, 20);
    seabedGeo.rotateX(-Math.PI / 2);
    const seabedMat = new THREE.MeshStandardMaterial({
      color: 0x0a192f,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const seabed = new THREE.Mesh(seabedGeo, seabedMat);
    seabed.position.y = -36;
    scene.add(seabed);

    // 8. Rising Bubbles Particles
    const bubbleCount = 180;
    const bubbleGeo = new THREE.BufferGeometry();
    const bubblePositions = new Float32Array(bubbleCount * 3);
    for (let i = 0; i < bubbleCount; i++) {
      bubblePositions[i * 3] = (Math.random() - 0.5) * 20;
      bubblePositions[i * 3 + 1] = -Math.random() * 35;
      bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
    const bubbleMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.25,
      transparent: true,
      opacity: 0.65,
    });
    const bubblePoints = new THREE.Points(bubbleGeo, bubbleMat);
    scene.add(bubblePoints);
    particlesRef.current = bubblePoints;

    // 9. Floating Mooring Buoy Model (Surface)
    const buoyGroup = new THREE.Group();
    buoyGroup.position.set(0, 0, 0);

    // Main Float Torus (High-vis marine yellow hull)
    const hullGeo = new THREE.CylinderGeometry(2.4, 2.0, 1.2, 24);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Marine safety yellow
      roughness: 0.4,
      metalness: 0.2,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.3;
    buoyGroup.add(hull);

    // Black protective bumper ring
    const bumperGeo = new THREE.TorusGeometry(2.45, 0.25, 12, 24);
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const bumper = new THREE.Mesh(bumperGeo, bumperMat);
    bumper.rotation.x = Math.PI / 2;
    bumper.position.y = 0.3;
    buoyGroup.add(bumper);

    // Deck deck plate
    const deckGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.2, 24);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.5, metalness: 0.6 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.95;
    buoyGroup.add(deck);

    // Solar panels (3 angled facets)
    const solarGeo = new THREE.BoxGeometry(1.2, 0.08, 0.7);
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const panel = new THREE.Mesh(solarGeo, solarMat);
      panel.position.set(Math.cos(angle) * 1.1, 1.2, Math.sin(angle) * 1.1);
      panel.rotation.y = angle;
      panel.rotation.x = 0.25;
      buoyGroup.add(panel);
    }

    // Mast / Superstructure tower
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.3 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 2.5;
    buoyGroup.add(mast);

    // GNSS Antenna radome dome
    const gpsGeo = new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const gpsMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const gpsDome = new THREE.Mesh(gpsGeo, gpsMat);
    gpsDome.position.y = 3.9;
    buoyGroup.add(gpsDome);

    // LoRa/4G Whip Antenna
    const whipGeo = new THREE.CylinderGeometry(0.02, 0.03, 2.0, 6);
    const whipMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 });
    const whip = new THREE.Mesh(whipGeo, whipMat);
    whip.position.set(0.4, 4.0, 0);
    buoyGroup.add(whip);

    // Marine Strobe Beacon (flashing red/amber LED)
    const strobeGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const strobeMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const strobe = new THREE.Mesh(strobeGeo, strobeMat);
    strobe.position.y = 4.2;
    buoyGroup.add(strobe);
    strobeLedRef.current = strobe;

    const beaconLight = new THREE.PointLight(0xf43f5e, 2, 8);
    beaconLight.position.y = 4.3;
    buoyGroup.add(beaconLight);
    beaconLightRef.current = beaconLight;

    scene.add(buoyGroup);
    buoyGroupRef.current = buoyGroup;

    // 10. Submersible CTD Sensor Package (Undersea Instrument)
    const probeGroup = new THREE.Group();
    probeGroup.position.set(0, probeTargetY, 0);

    // Titanium Cylindrical Pressure Housing
    const housingGeo = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 24);
    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Titanium metallic
      metalness: 0.85,
      roughness: 0.25,
    });
    const housing = new THREE.Mesh(housingGeo, housingMat);
    probeGroup.add(housing);

    // Sensor guard cage (Titanium vertical bars)
    const cageBarGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6);
    const cageMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const bar = new THREE.Mesh(cageBarGeo, cageMat);
      bar.position.set(Math.cos(angle) * 0.65, -1.8, Math.sin(angle) * 0.65);
      probeGroup.add(bar);
    }
    const cageRingGeo = new THREE.TorusGeometry(0.65, 0.04, 8, 24);
    const cageRing = new THREE.Mesh(cageRingGeo, cageMat);
    cageRing.rotation.x = Math.PI / 2;
    cageRing.position.y = -2.5;
    probeGroup.add(cageRing);

    // Sensor 1: Conductivity Cell (Glass quartz tube with platinum electrode bands)
    const condGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.1, 16);
    const condMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      metalness: 0.3,
      roughness: 0.1,
    });
    const condCell = new THREE.Mesh(condGeo, condMat);
    condCell.position.set(0.25, -1.8, 0);
    probeGroup.add(condCell);

    // Platinum rings on conductivity cell
    [-0.3, 0, 0.3].forEach(offset => {
      const ringGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.08, 16);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0.25, -1.8 + offset, 0);
      probeGroup.add(ring);
    });

    // Sensor 2: Fast-response PT100 Thermistor Needle Probe
    const tempGeo = new THREE.CylinderGeometry(0.04, 0.015, 1.2, 8);
    const tempMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, metalness: 0.95, roughness: 0.1 });
    const tempProbe = new THREE.Mesh(tempGeo, tempMat);
    tempProbe.position.set(-0.28, -1.8, 0.15);
    probeGroup.add(tempProbe);

    // Sensor 3: Piezoresistive Pressure Port
    const presPortGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12);
    const presMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.8 });
    const presPort = new THREE.Mesh(presPortGeo, presMat);
    presPort.position.set(-0.1, -1.25, -0.3);
    probeGroup.add(presPort);

    // Sensor 4: Acoustic Sound Velocity Transducer Mirror
    const transducerGeo = new THREE.BoxGeometry(0.35, 0.1, 0.35);
    const transducerMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7 });
    const transducer = new THREE.Mesh(transducerGeo, transducerMat);
    transducer.position.set(0, -1.3, 0.4);
    probeGroup.add(transducer);

    // CTD Glow Status Light & Sonar ping rings
    const ctdLight = new THREE.PointLight(0x06b6d4, 2.5, 6);
    ctdLight.position.set(0, -1.1, 0);
    probeGroup.add(ctdLight);

    // Dynamic Sonar expansion rings emanating from CTD
    const sonarRings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(0.7, 0.8, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const sRing = new THREE.Mesh(ringGeo, ringMat);
      sRing.position.set(0, -1.8, 0);
      sRing.userData = { scaleFactor: i * 0.33, speed: 0.015 };
      probeGroup.add(sRing);
      sonarRings.push(sRing);
    }
    sonarRingsRef.current = sonarRings;

    scene.add(probeGroup);
    probeGroupRef.current = probeGroup;

    // 11. Armored Mooring & Data Tether Cable (Connecting buoy bottom to CTD probe top)
    const cablePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, probeTargetY + 1.1, 0)];
    const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
    const cableMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 });
    const cableLine = new THREE.Line(cableGeo, cableMat);
    scene.add(cableLine);
    tetherMeshRef.current = cableLine;

    // 12. Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w && h && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 13. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Buoy gentle wave pitch & roll (harmonic wave physics)
      if (buoyGroupRef.current) {
        const waveAngle = Math.sin(elapsedTime * 1.5) * 0.08;
        const waveRoll = Math.cos(elapsedTime * 1.2) * 0.06;
        const heave = Math.sin(elapsedTime * 1.8) * 0.22;
        buoyGroupRef.current.position.y = heave;
        buoyGroupRef.current.rotation.z = waveAngle;
        buoyGroupRef.current.rotation.x = waveRoll;
        if (autoRotate && activePreset === 'overview') {
          buoyGroupRef.current.rotation.y += 0.002;
        }
      }

      // Smooth probe position lerp towards real-time depth
      if (probeGroupRef.current) {
        probeGroupRef.current.position.y += (probeTargetY - probeGroupRef.current.position.y) * 0.05;
        // Subtle underwater current sway
        probeGroupRef.current.rotation.y += 0.008;
        probeGroupRef.current.rotation.z = Math.sin(elapsedTime * 0.8) * 0.04;
      }

      // Update tether cable vertices
      if (tetherMeshRef.current && buoyGroupRef.current && probeGroupRef.current) {
        const positions = tetherMeshRef.current.geometry.attributes.position as THREE.BufferAttribute;
        // Top anchor at buoy bottom
        positions.setXYZ(0, buoyGroupRef.current.position.x, buoyGroupRef.current.position.y - 0.2, buoyGroupRef.current.position.z);
        // Bottom anchor at CTD top
        positions.setXYZ(1, probeGroupRef.current.position.x, probeGroupRef.current.position.y + 1.1, probeGroupRef.current.position.z);
        positions.needsUpdate = true;
      }

      // Animate ocean surface wave vertices
      if (waterMeshRef.current) {
        const pos = waterMeshRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const orig = waterMeshRef.current.userData.origPos;
        for (let i = 0; i < pos.count; i++) {
          const u = orig[i * 3];
          const w = orig[i * 3 + 2];
          const wave = Math.sin(u * 0.3 + elapsedTime * 2.0) * 0.25 + Math.cos(w * 0.25 + elapsedTime * 1.5) * 0.2;
          pos.setY(i, wave);
        }
        pos.needsUpdate = true;
      }

      // Sonar pulse rings expansion
      sonarRingsRef.current.forEach(ring => {
        ring.userData.scaleFactor += ring.userData.speed;
        if (ring.userData.scaleFactor > 4.5) {
          ring.userData.scaleFactor = 0.5;
        }
        ring.scale.set(ring.userData.scaleFactor, ring.userData.scaleFactor, 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 * (1 - ring.userData.scaleFactor / 4.5));
      });

      // Beacon strobe flashing
      if (beaconLightRef.current && strobeLedRef.current) {
        const flash = Math.sin(elapsedTime * 5.0) > 0.7;
        beaconLightRef.current.intensity = flash ? 3.5 : 0.2;
        (strobeLedRef.current.material as THREE.MeshBasicMaterial).color.setHex(flash ? 0xfb7185 : 0x475569);
      }

      // Bubbles upward buoyancy animation
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < bubbleCount; i++) {
          let y = positions.getY(i) + 0.04;
          if (y > 0) y = -35;
          positions.setY(i, y);
        }
        positions.needsUpdate = true;
      }

      // Camera smooth damping towards target preset
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.04);
        currentLookAt.current.lerp(targetLookAt.current, 0.04);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      waterGeo.dispose();
      waterMat.dispose();
    };
  }, []);

  // Update wireframe mode
  useEffect(() => {
    if (waterMeshRef.current) {
      (waterMeshRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframeMode;
    }
  }, [wireframeMode]);

  // Camera presets transitions
  const applyPreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    if (preset === 'overview') {
      targetCamPos.current.set(16, 6, 26);
      targetLookAt.current.set(0, -6, 0);
    } else if (preset === 'buoy') {
      targetCamPos.current.set(4.5, 4.5, 7);
      targetLookAt.current.set(0, 1.2, 0);
    } else if (preset === 'probe') {
      targetCamPos.current.set(3.2, probeTargetY - 0.2, 4.8);
      targetLookAt.current.set(0, probeTargetY - 0.5, 0);
    } else if (preset === 'wireframe') {
      targetCamPos.current.set(0, -15, 30);
      targetLookAt.current.set(0, -15, 0);
      setWireframeMode(true);
    }
  };

  // Mouse drag orbit handling
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !cameraRef.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };

    spherical.current.theta -= deltaX * 0.008;
    spherical.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.current.phi - deltaY * 0.008));

    const s = spherical.current;
    targetCamPos.current.x = targetLookAt.current.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta);
    targetCamPos.current.y = targetLookAt.current.y + s.radius * Math.cos(s.phi);
    targetCamPos.current.z = targetLookAt.current.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    spherical.current.radius = Math.max(6, Math.min(50, spherical.current.radius + e.deltaY * 0.03));
    const s = spherical.current;
    targetCamPos.current.x = targetLookAt.current.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta);
    targetCamPos.current.y = targetLookAt.current.y + s.radius * Math.cos(s.phi);
    targetCamPos.current.z = targetLookAt.current.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta);
  };

  return (
    <div className={`relative bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50 flex flex-col' : 'w-full'
    }`}>
      {/* 3D Top Control Overlay Bar */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 sm:p-4 bg-gradient-to-b from-zinc-950/90 via-zinc-950/50 to-transparent flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 backdrop-blur-md shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-zinc-100">
              <span>3D DIGITAL TWIN // POLARIS CTD ARRAY</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                LIVE INTERACTIVE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono hidden sm:block">
              Real-time Submersible Kinematics &amp; Mooring Simulation
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 pointer-events-auto font-mono text-xs">
          {/* Preset buttons */}
          <div className="flex items-center bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => applyPreset('overview')}
              className={`px-2.5 py-1 rounded transition-all ${
                activePreset === 'overview'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => applyPreset('buoy')}
              className={`px-2.5 py-1 rounded transition-all ${
                activePreset === 'buoy'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              BUOY
            </button>
            <button
              onClick={() => applyPreset('probe')}
              className={`px-2.5 py-1 rounded transition-all ${
                activePreset === 'probe'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              CTD PROBE
            </button>
          </div>

          {/* Wireframe toggle */}
          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`p-1.5 rounded-lg border backdrop-blur-md transition-all ${
              wireframeMode
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Toggle Wireframe Sonar Grid"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Auto rotate toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-lg border backdrop-blur-md transition-all ${
              autoRotate
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Auto-Rotate Camera"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Expand Fullscreen Toggle */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-100 backdrop-blur-md transition-all"
              title={isExpanded ? 'Minimize View' : 'Expand Fullscreen 3D'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Canvas Mount */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full cursor-grab active:cursor-grabbing select-none ${
          isExpanded ? 'flex-1' : 'h-[440px] lg:h-[500px]'
        }`}
      />

      {/* 3D Holographic Bottom HUD Overlay */}
      <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-zinc-950/95 via-zinc-950/70 to-transparent pointer-events-none flex flex-col md:flex-row items-end md:items-center justify-between gap-3">
        {/* Left Floating Live Probe Telemetry Tag */}
        <div className="pointer-events-auto bg-zinc-900/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 shadow-lg flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <span className="text-zinc-400 text-[10px] block">LIVE PROBE DEPTH</span>
              <span className="text-base font-bold text-cyan-300">{telemetry.depth.toFixed(2)} m</span>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <div>
            <span className="text-zinc-400 text-[10px] block">PRESSURE</span>
            <span className="text-zinc-200 font-bold">{telemetry.pressure.toFixed(2)} bar</span>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <div>
            <span className="text-zinc-400 text-[10px] block">IN-SITU TEMP</span>
            <span className="text-teal-300 font-bold">{telemetry.temperature.toFixed(2)} °C</span>
          </div>

          <div className="h-8 w-px bg-zinc-800 hidden sm:block" />

          <div className="hidden sm:block">
            <span className="text-zinc-400 text-[10px] block">ACOUSTIC VELOCITY</span>
            <span className="text-emerald-300 font-bold">{telemetry.soundSpeed.toFixed(1)} m/s</span>
          </div>
        </div>

        {/* Right 3D Interactive Controls Guide & Depth Quick-Winch */}
        <div className="pointer-events-auto flex items-center gap-3 bg-zinc-900/85 backdrop-blur-md border border-zinc-800 rounded-xl p-2.5 text-xs font-mono">
          <div className="text-zinc-400 text-[11px] hidden lg:block">
            <span className="text-zinc-300">Drag:</span> Orbit 360° | <span className="text-zinc-300">Scroll:</span> Zoom | <span className="text-zinc-300">Click:</span> Inspect
          </div>

          {onDepthChange && (
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-zinc-400">WINCH:</span>
              <input
                type="range"
                min="1"
                max="150"
                step="0.5"
                value={telemetry.depth}
                onChange={e => onDepthChange(parseFloat(e.target.value))}
                className="w-24 sm:w-28 accent-cyan-500 cursor-pointer"
                title="Winch Submersible CTD Depth in 3D"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
