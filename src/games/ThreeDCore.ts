import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface ThreeEngineContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  isSoftwareGl: boolean;
  clock: THREE.Clock;
  dispose: () => void;
  startLoop: (onTick: (delta: number, elapsed: number) => void) => () => void;
}

export function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function createThreeEngine(
  container: HTMLElement,
  options?: {
    skyColor?: number;
    fogNear?: number;
    fogFar?: number;
    fov?: number;
    cameraPos?: [number, number, number];
  }
): ThreeEngineContext {
  const isSoftwareGl = detectSoftwareWebGL();
  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 240);

  const scene = new THREE.Scene();
  const skyColor = options?.skyColor ?? 0xe0f2fe;
  scene.background = new THREE.Color(skyColor);
  scene.fog = new THREE.Fog(
    skyColor,
    options?.fogNear ?? 18,
    options?.fogFar ?? 75
  );

  const camera = new THREE.PerspectiveCamera(
    options?.fov ?? 55,
    width / height,
    0.1,
    180
  );
  const camPos = options?.cameraPos ?? [0, 5, 10];
  camera.position.set(camPos[0], camPos[1], camPos[2]);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
  scene.environment = envTarget.texture;
  roomEnv.dispose();
  pmremGenerator.dispose();

  // Warm/Cool 3-Point Studio Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x94a3b8, 0.85);
  hemiLight.position.set(0, 30, 0);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
  keyLight.position.set(12, 22, 10);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.left = -20;
  keyLight.shadow.camera.right = 20;
  keyLight.shadow.camera.top = 20;
  keyLight.shadow.camera.bottom = -20;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.55);
  rimLight.position.set(-12, 10, -14);
  scene.add(rimLight);

  const clock = new THREE.Clock();

  const handleResize = () => {
    const w = Math.max(container.clientWidth, 320);
    const h = Math.max(container.clientHeight, 240);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', handleResize);

  const startLoop = (onTick: (delta: number, elapsed: number) => void) => {
    let frameId = 0;
    let active = true;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const afterDraw = (cb: () => void) => {
      try {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (!active) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } catch {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (!active) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      onTick(delta, elapsed);
      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
    };
  };

  const dispose = () => {
    window.removeEventListener('resize', handleResize);
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });
    envTarget.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return { scene, camera, renderer, isSoftwareGl, clock, dispose, startLoop };
}

// Composite 8-part procedural 3D Car (primary hull, cabin, spoiler, 4 wheels, headlights)
export function buildCompositeCar(bodyColor: number, accentColor: number): THREE.Group {
  const car = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.25,
    metalness: 0.65,
  });
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.12,
    metalness: 0.85,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.35,
    metalness: 0.4,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.1,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.9,
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfacc15,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  // 1. Lower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 2.9), bodyMat);
  chassis.position.y = 0.42;
  chassis.castShadow = true;
  car.add(chassis);

  // 2. Cabin canopy
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.42, 1.45), cabinMat);
  cabin.position.set(0, 0.82, 0.1);
  cabin.castShadow = true;
  car.add(cabin);

  // 3. Racing stripe / hood trim
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 2.85), accentMat);
  stripe.position.set(0, 0.64, 0);
  car.add(stripe);

  // 4. Rear wing / spoiler
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 0.35), accentMat);
  spoiler.position.set(0, 0.82, 1.32);
  car.add(spoiler);

  // 5-6. Front headlights
  const leftLamp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), lightMat);
  leftLamp.position.set(-0.48, 0.44, -1.46);
  const rightLamp = leftLamp.clone();
  rightLamp.position.x = 0.48;
  car.add(leftLamp, rightLamp);

  // 7-10. 4 composite wheels (tire + alloy hub)
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 18);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.26, 12);
  hubGeo.rotateZ(Math.PI / 2);

  const wheelPositions: [number, number, number][] = [
    [-0.78, 0.32, -0.92],
    [0.78, 0.32, -0.92],
    [-0.78, 0.32, 0.92],
    [0.78, 0.32, 0.92],
  ];
  wheelPositions.forEach(([x, y, z]) => {
    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.position.set(x, y, z);
    tire.castShadow = true;
    const hub = new THREE.Mesh(hubGeo, rimMat);
    hub.position.set(x, y, z);
    car.add(tire, hub);
  });

  return car;
}

// Composite 6-part procedural Starfighter Cruiser
export function buildCompositeStarfighter(): THREE.Group {
  const ship = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.28,
    metalness: 0.72,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.35,
    metalness: 0.55,
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.9,
  });
  const thrusterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.5, 8), hullMat);
  fuselage.rotation.x = -Math.PI / 2;
  fuselage.position.y = 0.45;
  ship.add(fuselage);

  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.3, 0.9), canopyMat);
  cockpit.position.set(0, 0.65, -0.1);
  ship.add(cockpit);

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.85), wingMat);
  leftWing.position.set(-0.95, 0.42, 0.35);
  leftWing.rotation.z = -0.12;
  const rightWing = leftWing.clone();
  rightWing.position.x = 0.95;
  rightWing.rotation.z = 0.12;
  ship.add(leftWing, rightWing);

  const leftEngine = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.7, 12), thrusterMat);
  leftEngine.rotation.x = Math.PI / 2;
  leftEngine.position.set(-0.42, 0.42, 1.1);
  const rightEngine = leftEngine.clone();
  rightEngine.position.x = 0.42;
  ship.add(leftEngine, rightEngine);

  return ship;
}

// Composite 5-part procedural Explorer Character
export function buildCompositeExplorer(shirtColor = 0x0d9488): THREE.Group {
  const hero = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.7 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.35), bootMat);
  legs.position.y = 0.25;
  legs.castShadow = true;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.7, 12), bodyMat);
  torso.position.y = 0.82;
  torso.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), skinMat);
  head.position.y = 1.42;
  head.castShadow = true;

  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 16), hatMat);
  hatBrim.position.y = 1.66;
  const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.24, 16), hatMat);
  hatTop.position.y = 1.8;

  hero.add(legs, torso, head, hatBrim, hatTop);
  return hero;
}
