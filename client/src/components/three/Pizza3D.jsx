import { Component, Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  OrbitControls,
  Sparkles,
} from '@react-three/drei';
import * as THREE from 'three';

const CRUST_STYLES = {
  'whole-wheat': { color: '#c0874a', height: 0.14, rim: 0.17 },
  'thin-crust': { color: '#e8b56b', height: 0.07, rim: 0.1 },
  'cheese-burst': { color: '#f2c56d', height: 0.2, rim: 0.2 },
  'garlic-bread-base': { color: '#eec47c', height: 0.16, rim: 0.17 },
  'classic-hand-tossed': { color: '#e8b267', height: 0.15, rim: 0.18 },
};

const SAUCE_COLORS = {
  'classic-tomato': '#c92f28',
  'basil-pesto': '#6c8c35',
  'smoky-bbq': '#7c3b22',
  'peri-peri': '#c3471f',
  'white-alfredo': '#efe0c5',
};

const CHEESE_COLORS = {
  mozzarella: '#f7dda0',
  'sharp-cheddar': '#f1b74d',
  parmesan: '#f4e4b6',
  'vegan-cheddar': '#f2cd62',
  'four-cheese-blend': '#f6c75d',
};

const VEG_TOPPINGS = {
  'red-onion': { count: 8, type: 'ring', color: '#b05b84' },
  capsicum: { count: 7, type: 'ring', color: '#4d8e3b' },
  'sweet-corn': { count: 18, type: 'corn', color: '#f4c53e' },
  mushroom: { count: 8, type: 'mushroom', color: '#c39b74' },
  'black-olives': { count: 8, type: 'ring', color: '#2d2024' },
  jalapeno: { count: 8, type: 'ring', color: '#5d8a34' },
  'cherry-tomato': { count: 9, type: 'tomato', color: '#d53a2c' },
  'baby-spinach': { count: 10, type: 'leaf', color: '#477b2f' },
  paneer: { count: 10, type: 'cube', color: '#f2e2c4' },
  'smoked-pepperoni': { count: 10, type: 'pepperoni', color: '#b53125' },
  'herb-chicken': { count: 10, type: 'chicken', color: '#bb7a3c' },
  'fresh-basil': { count: 8, type: 'leaf', color: '#3f7a2b' },
};

const GOLDEN_ANGLE = 2.399963229728653;

function hashString(value = '') {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function scatter(slug, count, radius = 1.22) {
  const seed = (hashString(slug) % 628) / 100;
  return Array.from({ length: count }, (_, index) => {
    const angle = index * GOLDEN_ANGLE + seed;
    const distance = radius * Math.sqrt((index + 0.55) / count);
    return {
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      rotation: angle + (index % 3) * 0.45,
      scale: 0.82 + ((hashString(`${slug}-${index}`) % 25) / 100),
    };
  });
}

function canvasTexture(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  draw(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function makeCheeseTexture(baseColor) {
  return canvasTexture(512, (ctx, size) => {
    const base = new THREE.Color(baseColor);
    const baseCss = `#${base.getHexString()}`;
    ctx.fillStyle = baseCss;
    ctx.fillRect(0, 0, size, size);

    for (let index = 0; index < 130; index += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 8 + Math.random() * 45;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const light = Math.random() > 0.5 ? '255, 246, 205' : '240, 189, 91';
      gradient.addColorStop(0, `rgba(${light}, ${0.1 + Math.random() * 0.22})`);
      gradient.addColorStop(1, `rgba(${light}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let index = 0; index < 36; index += 1) {
      ctx.fillStyle = `rgba(166, 101, 33, ${0.05 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, 1 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function makeSauceTexture(baseColor) {
  return canvasTexture(512, (ctx, size) => {
    const base = new THREE.Color(baseColor);
    ctx.fillStyle = `#${base.getHexString()}`;
    ctx.fillRect(0, 0, size, size);
    for (let index = 0; index < 220; index += 1) {
      const alpha = 0.08 + Math.random() * 0.2;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha * 0.5})` : `rgba(30,10,8,${alpha})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, 1 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function makeCrustTexture(baseColor) {
  return canvasTexture(512, (ctx, size) => {
    const base = new THREE.Color(baseColor);
    ctx.fillStyle = `#${base.getHexString()}`;
    ctx.fillRect(0, 0, size, size);

    for (let index = 0; index < 90; index += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 4 + Math.random() * 26;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(126, 74, 27, ${0.03 + Math.random() * 0.12})`);
      gradient.addColorStop(1, 'rgba(126, 74, 27, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let index = 0; index < 40; index += 1) {
      ctx.fillStyle = `rgba(86, 44, 15, ${0.18 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, 0.8 + Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function useLeafGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.055, 0.075, 0.14, 0.07, 0.19, 0);
    shape.bezierCurveTo(0.14, -0.07, 0.055, -0.075, 0, 0);
    const geometry = new THREE.ShapeGeometry(shape, 12);
    geometry.center();
    return geometry;
  }, []);
}

function Leaf({ position, rotation, scale = 1, color }) {
  const geometry = useLeafGeometry();
  return (
    <mesh
      geometry={geometry}
      position={[position[0], position[1] + 0.012, position[2]]}
      rotation={[-Math.PI / 2, 0, rotation]}
      scale={[scale, scale, scale]}
      castShadow
    >
      <meshStandardMaterial color={color} roughness={0.72} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Topping({ slug, index, item }) {
  const spec = VEG_TOPPINGS[slug] || VEG_TOPPINGS['fresh-basil'];
  const positions = scatter(slug, spec.count);
  const position = positions[index];
  if (!position) return null;
  const y = 0.195;
  const scale = position.scale * item.scale;
  const [x, , z] = [position.x, 0, position.z];

  if (spec.type === 'ring') {
    return (
      <mesh
        position={[x, y + 0.015, z]}
        rotation={[Math.PI / 2, 0, position.rotation]}
        scale={[scale, scale, scale]}
        castShadow
      >
        <torusGeometry args={[0.092, 0.018, 8, 24]} />
        <meshStandardMaterial color={spec.color} roughness={0.62} />
      </mesh>
    );
  }

  if (spec.type === 'corn') {
    return (
      <mesh position={[x, y + 0.02, z]} scale={[scale, scale * 0.65, scale]} castShadow>
        <sphereGeometry args={[0.033, 8, 8]} />
        <meshStandardMaterial color={spec.color} roughness={0.68} />
      </mesh>
    );
  }

  if (spec.type === 'mushroom') {
    return (
      <group position={[x, y, z]} rotation={[0, position.rotation, 0]} scale={scale}>
        <mesh position={[0, 0.025, 0]} castShadow>
          <sphereGeometry args={[0.085, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={spec.color} roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.025, 0.032, 0.045, 8]} />
          <meshStandardMaterial color="#efe2c7" roughness={0.7} />
        </mesh>
      </group>
    );
  }

  if (spec.type === 'leaf') {
    return (
      <Leaf
        position={[x, y, z]}
        rotation={position.rotation * 1.5}
        scale={scale * 0.9}
        color={spec.color}
      />
    );
  }

  if (spec.type === 'cube') {
    return (
      <mesh position={[x, y + 0.025, z]} rotation={[0, position.rotation, 0]} scale={scale} castShadow>
        <boxGeometry args={[0.08, 0.07, 0.08]} />
        <meshStandardMaterial color={spec.color} roughness={0.62} />
      </mesh>
    );
  }

  if (spec.type === 'tomato') {
    return (
      <group position={[x, y + 0.018, z]} rotation={[0, position.rotation, 0]} scale={scale}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.022, 16]} />
          <meshStandardMaterial color={spec.color} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.014, 0]}>
          <cylinderGeometry args={[0.062, 0.062, 0.006, 16]} />
          <meshStandardMaterial color="#f08a68" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.019, 0]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#f6cf6d" />
        </mesh>
      </group>
    );
  }

  if (spec.type === 'chicken') {
    return (
      <mesh position={[x, y + 0.03, z]} rotation={[0.3, position.rotation, 0.2]} scale={scale} castShadow>
        <dodecahedronGeometry args={[0.075, 0]} />
        <meshStandardMaterial color={spec.color} roughness={0.75} flatShading />
      </mesh>
    );
  }

  return (
    <group position={[x, y + 0.018, z]} rotation={[0, position.rotation, 0]} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.018, 20]} />
        <meshStandardMaterial color={spec.color} roughness={0.5} />
      </mesh>
      {[0, 1, 2].map((dot) => (
        <mesh
          key={dot}
          position={[Math.cos(dot * 2.1) * 0.055, 0.012, Math.sin(dot * 2.1) * 0.055]}
          scale={[1, 0.3, 1]}
        >
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="#e9b08d" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function CrustChar() {
  const spots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const angle = index * 1.87;
        const radius = 1.58 + Math.sin(index * 2.4) * 0.05;
        return {
          position: [Math.cos(angle) * radius, 0.24, Math.sin(angle) * radius],
          scale: [0.045 + (index % 4) * 0.012, 0.012, 0.06 + (index % 3) * 0.02],
        };
      }),
    []
  );
  return (
    <group>
      {spots.map((spot, index) => (
        <mesh key={index} position={spot.position} scale={spot.scale} rotation={[0, index, 0]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#7d4520" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function FloatingTomato({ position = [2.35, 0.65, 0.5], scale = 1 }) {
  return (
    <Float speed={1.4} rotationIntensity={0.7} floatIntensity={0.7}>
      <group position={position} rotation={[0.5, 0.3, 0.9]} scale={scale}>
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.06, 20]} />
          <meshStandardMaterial color="#d9362b" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.01, 20]} />
          <meshStandardMaterial color="#f0876e" roughness={0.6} />
        </mesh>
        {[0, 1, 2, 3, 4].map((index) => (
          <mesh
            key={index}
            position={[Math.cos(index * 1.25) * 0.1, 0.05, Math.sin(index * 1.25) * 0.1]}
            scale={[1, 0.35, 1]}
          >
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#f5d473" />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function FloatingBasil({ position = [-2.35, 0.6, 0.8], scale = 1.35 }) {
  return (
    <Float speed={1.7} rotationIntensity={0.8} floatIntensity={0.6}>
      <group position={position} rotation={[0.2, 0.4, -0.4]} scale={scale}>
        <Leaf position={[0, 0, 0]} rotation={-0.8} scale={1} color="#477f2f" />
      </group>
    </Float>
  );
}

function FloatingCheese({ position = [-2.2, 0.25, -1.5], scale = 0.9 }) {
  return (
    <Float speed={1.3} rotationIntensity={1} floatIntensity={0.8}>
      <mesh position={position} rotation={[0.35, 0.5, 0.2]} scale={scale} castShadow>
        <boxGeometry args={[0.38, 0.28, 0.34]} />
        <meshStandardMaterial color="#ffcb45" roughness={0.55} />
      </mesh>
    </Float>
  );
}

function FloatingOlive({ position = [2.45, 0.2, -1.2], scale = 1 }) {
  return (
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={0.7}>
      <group position={position} rotation={[0.5, 0.2, 0.2]} scale={scale}>
        <mesh castShadow>
          <torusGeometry args={[0.14, 0.075, 12, 24]} />
          <meshStandardMaterial color="#3f2c31" roughness={0.6} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.14, 0.035, 10, 24]} />
          <meshStandardMaterial color="#b8986a" roughness={0.8} />
        </mesh>
      </group>
    </Float>
  );
}

function PizzaModel({ sauceSlug, cheeseSlug, baseSlug, toppers = [], plate = true }) {
  const group = useRef();
  const crust = CRUST_STYLES[baseSlug] || CRUST_STYLES['classic-hand-tossed'];
  const sauceColor = SAUCE_COLORS[sauceSlug] || SAUCE_COLORS['classic-tomato'];
  const cheeseColor = CHEESE_COLORS[cheeseSlug] || CHEESE_COLORS.mozzarella;
  const crustTexture = useMemo(() => makeCrustTexture(crust.color), [crust.color]);
  const sauceTexture = useMemo(() => makeSauceTexture(sauceColor), [sauceColor]);
  const cheeseTexture = useMemo(() => makeCheeseTexture(cheeseColor), [cheeseColor]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.015;
  });

  const visibleToppers = toppers.filter((slug) => VEG_TOPPINGS[slug]);

  return (
    <group ref={group}>
      {plate ? (
        <group position={[0, -0.12, 0]}>
          <mesh receiveShadow castShadow>
            <cylinderGeometry args={[2.24, 2.12, 0.09, 64]} />
            <meshPhysicalMaterial color="#f7efe2" roughness={0.32} clearcoat={0.6} clearcoatRoughness={0.4} />
          </mesh>
          <mesh position={[0, 0.051, 0]}>
            <torusGeometry args={[1.92, 0.016, 10, 64]} />
            <meshStandardMaterial color="#d9c7aa" roughness={0.5} />
          </mesh>
        </group>
      ) : null}

      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.68, 1.76, crust.height, 64]} />
        <meshStandardMaterial color={crust.color} roughness={0.82} map={crustTexture} />
      </mesh>

      <mesh position={[0, crust.height / 2 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[1.55, crust.rim, 18, 64]} />
        <meshStandardMaterial color={crust.color} roughness={0.85} map={crustTexture} />
      </mesh>

      <mesh position={[0, crust.height / 2 + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.52, 64]} />
        <meshStandardMaterial color={sauceColor} roughness={0.55} map={sauceTexture} />
      </mesh>

      {cheeseSlug ? (
        <mesh position={[0, crust.height / 2 + 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.46, 64]} />
          <meshStandardMaterial color={cheeseColor} roughness={0.4} map={cheeseTexture} />
        </mesh>
      ) : null}

      {cheeseSlug
        ? Array.from({ length: 11 }, (_, index) => {
            const angle = index * 2.3;
            const radius = 0.4 + (index % 4) * 0.24;
            return (
              <mesh
                key={`cheese-${index}`}
                position={[Math.cos(angle) * radius, crust.height / 2 + 0.04, Math.sin(angle) * radius]}
                rotation={[-Math.PI / 2, 0, index]}
                scale={[0.8 + (index % 3) * 0.15, 0.65 + (index % 4) * 0.1, 1]}
              >
                <circleGeometry args={[0.32, 24]} />
                <meshStandardMaterial color={cheeseColor} roughness={0.38} />
              </mesh>
            );
          })
        : null}

      <CrustChar />

      {visibleToppers.map((slug) => {
        const spec = VEG_TOPPINGS[slug];
        return Array.from({ length: spec.count }, (_, index) => (
          <Topping key={`${slug}-${index}`} slug={slug} index={index} item={{ scale: 1 }} />
        ));
      })}
    </group>
  );
}

function SceneContent({ sauceSlug, cheeseSlug, baseSlug, toppers, showFloating, autoRotate }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4.5, 7, 4]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <pointLight position={[-4, 3, -3]} intensity={24} color="#ffcf67" distance={12} />
      <pointLight position={[3, 2, 4]} intensity={12} color="#ff7f8c" distance={10} />
      <Suspense fallback={null}>
        <PizzaModel sauceSlug={sauceSlug} cheeseSlug={cheeseSlug} baseSlug={baseSlug} toppers={toppers} />
        {showFloating ? (
          <>
            <FloatingTomato />
            <FloatingBasil />
            <FloatingCheese />
            <FloatingOlive />
            <Sparkles count={28} scale={[6.5, 3, 6.5]} size={1.8} speed={0.3} opacity={0.45} color="#ffc93c" />
          </>
        ) : null}
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.4} position={[0, 6, -8]} scale={[10, 8, 1]} color="#fff5dd" />
          <Lightformer form="ring" intensity={2} position={[-6, 2, -4]} scale={3} color="#ffd46b" />
          <Lightformer form="ring" intensity={1.6} position={[6, 3, -3]} scale={2.5} color="#ff9fac" />
          <Lightformer form="rect" intensity={1.2} position={[0, -4, 4]} scale={[8, 3, 1]} color="#7a4b92" />
        </Environment>
      </Suspense>
      <ContactShadows position={[0, -0.28, 0]} opacity={0.42} scale={7} blur={2.6} far={4} color="#3b1c2b" />
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.65}
        minPolarAngle={Math.PI / 5.5}
        maxPolarAngle={Math.PI / 2.25}
        target={[0, 0, 0]}
      />
    </>
  );
}

function webglAvailable() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export default function Pizza3D({
  baseSlug = 'classic-hand-tossed',
  sauceSlug = 'classic-tomato',
  cheeseSlug = 'mozzarella',
  toppers = ['smoked-pepperoni', 'fresh-basil', 'black-olives', 'cherry-tomato'],
  autoRotate = true,
  showFloating = false,
  fallbackImage = '/media/margherita.webp',
  className = '',
  cameraPosition = [0, 3.6, 5.6],
}) {
  const supported = useMemo(webglAvailable, []);
  const fallback = (
    <div className={`three-fallback ${className}`}>
      <img src={fallbackImage} alt="Freshly baked pizza" className="three-fallback__img" />
    </div>
  );

  if (!supported) return fallback;

  return (
    <div className={className}>
      <SceneBoundary fallback={fallback}>
        <Canvas
          shadows
          dpr={[1, 1.8]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: cameraPosition, fov: 34 }}
        >
          <SceneContent
            baseSlug={baseSlug}
            sauceSlug={sauceSlug}
            cheeseSlug={cheeseSlug}
            toppers={toppers}
            showFloating={showFloating}
            autoRotate={autoRotate}
          />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
