import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ChipConfig {
  color: 'red' | 'gold';
  denomination: string;
  position: [number, number]; // normalized [0-1, 0-1] within section
  rotation: [number, number, number]; // initial euler angles in degrees
  size: number; // scale multiplier
}

interface Props {
  chips: ChipConfig[];
}

const COLORS = {
  red: {
    base: 0xc41e3a,
    baseDark: 0x7a1024,
    baseLight: 0xd42a46,
    stripe: 0xf0e8d8,
    inlay: 0xf0e8d8,
    inlayText: '#C41E3A',
  },
  gold: {
    base: 0xc9a84c,
    baseDark: 0x8b7635,
    baseLight: 0xd4b55c,
    stripe: 0x3c1e0a,
    inlay: 0xf5edd8,
    inlayText: '#8B7635',
  },
};

function createChipTexture(
  colorScheme: 'red' | 'gold',
  denomination: string,
  isFront: boolean,
  resolution = 512,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;

  const cx = resolution / 2;
  const cy = resolution / 2;
  const r = resolution / 2 - 4;
  const scheme = COLORS[colorScheme];

  // Base circle fill
  const baseGrad = ctx.createRadialGradient(cx * 0.85, cy * 0.75, 0, cx, cy, r);
  baseGrad.addColorStop(0, colorScheme === 'red' ? '#d42a46' : '#d4b55c');
  baseGrad.addColorStop(0.4, colorScheme === 'red' ? '#C41E3A' : '#C9A84C');
  baseGrad.addColorStop(0.75, colorScheme === 'red' ? '#9a1830' : '#a88e3a');
  baseGrad.addColorStop(1, colorScheme === 'red' ? '#7a1024' : '#8B7635');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // Rim stripes — 8 evenly spaced white/dark rectangles
  const stripeCount = 8;
  const stripeWidth = 0.028; // fraction of circumference
  const outerR = r;
  const innerR = r * 0.78;

  ctx.save();
  for (let i = 0; i < stripeCount; i++) {
    const angle = (i / stripeCount) * Math.PI * 2 - Math.PI / 2;
    const halfArc = stripeWidth * Math.PI;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, angle - halfArc, angle + halfArc);
    ctx.arc(cx, cy, innerR, angle + halfArc, angle - halfArc, true);
    ctx.closePath();

    ctx.fillStyle =
      colorScheme === 'red'
        ? 'rgba(240, 232, 216, 0.5)'
        : 'rgba(60, 30, 10, 0.5)';
    ctx.fill();
  }
  ctx.restore();

  // Embossed outer ring (dashed circle)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
  ctx.strokeStyle = colorScheme === 'red'
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(60,40,10,0.2)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Center inlay circle
  const inlayR = r * 0.42;
  const inlayGrad = ctx.createRadialGradient(cx * 0.92, cy * 0.88, 0, cx, cy, inlayR);
  inlayGrad.addColorStop(0, colorScheme === 'red' ? '#f5f0e8' : '#f5edd8');
  inlayGrad.addColorStop(0.5, colorScheme === 'red' ? '#e8dcc8' : '#e8dcc0');
  inlayGrad.addColorStop(1, colorScheme === 'red' ? '#d4c8b0' : '#d8ccaa');

  ctx.beginPath();
  ctx.arc(cx, cy, inlayR, 0, Math.PI * 2);
  ctx.fillStyle = inlayGrad;
  ctx.fill();

  // Inlay border
  ctx.beginPath();
  ctx.arc(cx, cy, inlayR, 0, Math.PI * 2);
  ctx.strokeStyle = colorScheme === 'red'
    ? 'rgba(196,30,58,0.2)'
    : 'rgba(201,168,76,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inlay inner shadow
  const shadowGrad = ctx.createRadialGradient(cx, cy, inlayR * 0.85, cx, cy, inlayR);
  shadowGrad.addColorStop(0, 'transparent');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.beginPath();
  ctx.arc(cx, cy, inlayR, 0, Math.PI * 2);
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  if (isFront) {
    // Denomination text
    ctx.font = `bold ${resolution * 0.22}px "Bebas Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = scheme.inlayText;
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    ctx.fillText(denomination, cx, cy);
    ctx.shadowColor = 'transparent';
  } else {
    // Suit symbol on back
    const suits = ['♠', '♥', '♣', '♦'];
    const suit = colorScheme === 'red' ? suits[0] : suits[3];
    ctx.font = `${resolution * 0.18}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colorScheme === 'red'
      ? 'rgba(120,20,35,0.5)'
      : 'rgba(100,80,30,0.5)';
    ctx.fillText(suit, cx, cy);
  }

  // Specular highlight on top-left
  const specGrad = ctx.createRadialGradient(cx * 0.7, cy * 0.6, 0, cx * 0.7, cy * 0.6, r * 0.5);
  specGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
  specGrad.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = specGrad;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createChipMesh(config: ChipConfig): THREE.Group {
  const group = new THREE.Group();
  const chipRadius = 1;
  const chipThickness = 0.14;

  // Create textures
  const frontTexture = createChipTexture(config.color, config.denomination, true);
  const backTexture = createChipTexture(config.color, config.denomination, false);

  // Edge texture — alternating stripes
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = 512;
  edgeCanvas.height = 64;
  const ectx = edgeCanvas.getContext('2d')!;

  // Base edge color
  ectx.fillStyle = config.color === 'red' ? '#a01828' : '#a08838';
  ectx.fillRect(0, 0, 512, 64);

  // Stripe segments
  const stripeCount = 8;
  const stripeW = 512 / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    const x = i * stripeW + stripeW * 0.35;
    const w = stripeW * 0.3;
    ectx.fillStyle = config.color === 'red'
      ? 'rgba(240, 232, 216, 0.4)'
      : 'rgba(60, 30, 10, 0.4)';
    ectx.fillRect(x, 0, w, 64);
  }

  // Top/bottom edge highlight
  const edgeHL = ectx.createLinearGradient(0, 0, 0, 64);
  edgeHL.addColorStop(0, 'rgba(255,255,255,0.08)');
  edgeHL.addColorStop(0.5, 'transparent');
  edgeHL.addColorStop(1, 'rgba(0,0,0,0.15)');
  ectx.fillStyle = edgeHL;
  ectx.fillRect(0, 0, 512, 64);

  const edgeTexture = new THREE.CanvasTexture(edgeCanvas);
  edgeTexture.wrapS = THREE.RepeatWrapping;
  edgeTexture.colorSpace = THREE.SRGBColorSpace;

  // Main cylinder body (edge)
  const cylGeom = new THREE.CylinderGeometry(chipRadius, chipRadius, chipThickness, 64, 1, true);
  const edgeMat = new THREE.MeshPhongMaterial({
    map: edgeTexture,
    shininess: 30,
    specular: new THREE.Color(0x222222),
  });
  const cylinder = new THREE.Mesh(cylGeom, edgeMat);
  group.add(cylinder);

  // Front face (top)
  const faceGeom = new THREE.CircleGeometry(chipRadius, 64);
  const frontMat = new THREE.MeshPhongMaterial({
    map: frontTexture,
    shininess: 40,
    specular: new THREE.Color(0x333333),
  });
  const frontFace = new THREE.Mesh(faceGeom, frontMat);
  frontFace.rotation.x = -Math.PI / 2;
  frontFace.position.y = chipThickness / 2;
  group.add(frontFace);

  // Back face (bottom)
  const backMat = new THREE.MeshPhongMaterial({
    map: backTexture,
    shininess: 30,
    specular: new THREE.Color(0x222222),
  });
  const backFace = new THREE.Mesh(faceGeom.clone(), backMat);
  backFace.rotation.x = Math.PI / 2;
  backFace.position.y = -chipThickness / 2;
  group.add(backFace);

  // Bevel ring (subtle rim detail)
  const bevelGeom = new THREE.TorusGeometry(chipRadius, 0.012, 8, 64);
  const bevelMat = new THREE.MeshPhongMaterial({
    color: config.color === 'red' ? 0x4a1a24 : 0x6a5830,
    shininess: 60,
    specular: new THREE.Color(0x444444),
  });
  const topBevel = new THREE.Mesh(bevelGeom, bevelMat);
  topBevel.rotation.x = Math.PI / 2;
  topBevel.position.y = chipThickness / 2;
  group.add(topBevel);

  const bottomBevel = new THREE.Mesh(bevelGeom.clone(), bevelMat);
  bottomBevel.rotation.x = Math.PI / 2;
  bottomBevel.position.y = -chipThickness / 2;
  group.add(bottomBevel);

  return group;
}

export default function PokerChip3D({ chips }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for mobile — skip rendering
    if (window.innerWidth < 768) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const section = container.closest('section');
    if (!section) return;

    // Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';

    // Lighting
    const ambient = new THREE.AmbientLight(0xfff0e0, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff8f0, 0.8);
    dirLight.position.set(-3, 4, 5);
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0xc41e3a, 0.3, 20);
    rimLight.position.set(3, -2, 3);
    scene.add(rimLight);

    // Create chips
    const chipMeshes: { mesh: THREE.Group; config: ChipConfig; basePos: THREE.Vector3; floatOffset: number; floatSpeed: number }[] = [];

    chips.forEach((chipConfig, i) => {
      const mesh = createChipMesh(chipConfig);

      // Set initial rotation
      const [rx, ry, rz] = chipConfig.rotation.map((d) => (d * Math.PI) / 180);
      mesh.rotation.set(rx, ry, rz);

      // Scale
      mesh.scale.setScalar(chipConfig.size);

      scene.add(mesh);

      chipMeshes.push({
        mesh,
        config: chipConfig,
        basePos: new THREE.Vector3(0, 0, 0), // computed on resize
        floatOffset: i * 2.1,
        floatSpeed: 0.4 + i * 0.08,
      });
    });

    // Resize handler
    function resize() {
      const w = section!.offsetWidth;
      const h = section!.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // Compute world-space positions from normalized coords
      const vFov = (camera.fov * Math.PI) / 180;
      const worldH = 2 * Math.tan(vFov / 2) * camera.position.z;
      const worldW = worldH * camera.aspect;

      chipMeshes.forEach((c) => {
        const wx = (c.config.position[0] - 0.5) * worldW;
        const wy = -(c.config.position[1] - 0.5) * worldH;
        c.basePos.set(wx, wy, 0);
      });
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(section);

    // Mouse tracking
    function onMouseMove(e: MouseEvent) {
      const rect = section!.getBoundingClientRect();
      targetMouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetMouseRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }
    function onMouseLeave() {
      targetMouseRef.current.x = 0;
      targetMouseRef.current.y = 0;
    }
    section.addEventListener('mousemove', onMouseMove);
    section.addEventListener('mouseleave', onMouseLeave);

    // Scroll parallax
    let scrollProgress = 0;

    const scrollTrigger = () => {
      const rect = section!.getBoundingClientRect();
      const viewH = window.innerHeight;
      scrollProgress = Math.max(0, Math.min(1, (viewH - rect.top) / (viewH + rect.height)));
    };
    window.addEventListener('scroll', scrollTrigger, { passive: true });
    scrollTrigger();

    // Animation loop
    let running = true;
    let startTime = performance.now();
    const getElapsedTime = () => (performance.now() - startTime) / 1000;

    function animate() {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(animate);

      const t = getElapsedTime();

      // Smooth mouse
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.05;

      const scrollSpeeds = [1.2, -1.0, 1.4];

      chipMeshes.forEach((c, i) => {
        // Float
        const floatY = Math.sin(t * c.floatSpeed + c.floatOffset) * 0.15;

        // Mouse offset
        const mx = mouseRef.current.x * 0.3 * (i % 2 === 0 ? 1 : -1);
        const my = mouseRef.current.y * 0.15 * (i % 2 === 0 ? 1 : -1);

        // Scroll offset
        const sy = (scrollProgress - 0.5) * (scrollSpeeds[i] || 1);

        c.mesh.position.set(
          c.basePos.x + mx,
          c.basePos.y + floatY + my + sy,
          c.basePos.z,
        );

        // Slow rotation
        c.mesh.rotation.y += 0.002 + i * 0.001;
      });

      renderer.render(scene, camera);
    }

    // Visibility observer — pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          animate();
        } else if (!entry.isIntersecting) {
          running = false;
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(section);

    animate();

    // Cleanup
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      observer.disconnect();
      resizeObserver.disconnect();
      section.removeEventListener('mousemove', onMouseMove);
      section.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', scrollTrigger);

      // Dispose Three.js resources
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [chips]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    />
  );
}
