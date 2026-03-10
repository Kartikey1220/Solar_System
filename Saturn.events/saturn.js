import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";

let scene, camera, renderer, controls, composer;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickableObjects = [];
let activePlanet = null;
let fallingMesh;
const dracoLoader = new DRACOLoader();

// loading screen state --------------------------------------------------
let assetsLoaded = 0;
let totalAssets = 0; // will be set once we know how many planets we plan to load

init();
animate();

function updateProgress() {
  const progressBar = document.querySelector('#loading-screen .progress');
  if (!progressBar) return;
  const percentage = (assetsLoaded / totalAssets) * 100;
  progressBar.style.width = percentage + '%';
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}

// If user lands directly on second.html without clicking start, make sure
// loading screen is visible until we tell it otherwise.
document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
  }
});
// Path to Draco decoder files (included in Three.js examples)
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
function addPlanetModel(name, path, distance, scale = 1, rotSpeed = 0.2) {
  totalAssets += 1;

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    path,
    (gltf) => {
      const planetScene = gltf.scene;

      // Create a wrapper container
      const container = new THREE.Object3D();
      container.add(planetScene);

      // Position the container instead of the baked mesh
      container.position.set(distance, 0, 0);
      container.scale.set(scale, scale, scale);

      // Store metadata
      container.userData = container.userData || {};
      container.userData.planetName = name;
      container.userData.rotSpeed = rotSpeed;
      container.name = name;

      clickableObjects.push(container);

      // Save positions for later use
      container.userData.originalPosition = container.position.clone();
      container.userData.targetPosition = container.position.clone();
      container.userData.isShiftedLeft = false;

      scene.add(container);

      // Update progress
      assetsLoaded += 1;
      updateProgress();
      if (assetsLoaded === totalAssets) {
        hideLoadingScreen();
      }
    },
    // progress callback
    (xhr) => {
      if (xhr.lengthComputable) {
        const percentLoaded = (xhr.loaded / xhr.total) * 100;
        const base = (assetsLoaded / totalAssets) * 100;
        const increment = percentLoaded / totalAssets;
        const progressBar = document.querySelector('#loading-screen .progress');
        if (progressBar) {
          progressBar.style.width = base + increment + '%';
        }
      }
    },
    (error) => {
      console.error("Error loading model:", path, error);
      assetsLoaded += 1;
      updateProgress();
      if (assetsLoaded === totalAssets) {
        hideLoadingScreen();
      }
    }
  );
}

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera
  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
  camera.position.set(0, 30, 120);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  controls.update();
  

  // 🌞 Sun sphere (visible glow)
  const sunGeo = new THREE.SphereGeometry(30, 64, 64);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xffc400,
    emissive: 0xff9e00,
    emissiveIntensity: 6,
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(-150, 0, 0);
  scene.add(sunMesh);

  // 🌞 Sun light (real illumination)
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunLight.position.set(-100, 0, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  scene.add(sunLight);

  // Saturn Rings
  const RoneGeo = new THREE.RingGeometry(17, 23, 64);
  RoneGeo.rotateX(Math.PI / 2);
  const RoneMat = new THREE.MeshStandardMaterial({
    color: 0xfdfdfd,
    transparent: true,
    opacity: 0.75,
    emissive: 0xf5deb3,
    emissiveIntensity: 0.08,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.1,
  });
  const RoneMesh = new THREE.Mesh(RoneGeo, RoneMat);
  RoneMesh.position.set(20, 0, 0);
  scene.add(RoneMesh);

  const RsecGeo = new THREE.RingGeometry(25, 34, 64);
  RsecGeo.rotateX(Math.PI / 2);
  const RsecMat = new THREE.MeshStandardMaterial({
    color: 0xf5deb3,
    transparent: true,
    opacity: 0.65,
    emissive: 0xf5deb3,
    emissiveIntensity: 0.06,
    side: THREE.DoubleSide,
    roughness: 0.85,
    metalness: 0.1,
  });
  const RsecMesh = new THREE.Mesh(RsecGeo, RsecMat);
  RsecMesh.position.set(20, 0, 0);
  scene.add(RsecMesh);

  // 🌧️ Ring Rain Particle System
  const particleCount = 500;
  const positions = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = THREE.MathUtils.lerp(17, 32, Math.random());
    const x = Math.cos(angle) * radius + 20;
    const z = Math.sin(angle) * radius;
    const y = 0;
    positions.push(x, y, z);
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xf5deb3,
    size: 0.3,
    transparent: true,
    opacity: 0.7,
  });

  fallingMesh = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(fallingMesh);

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  // Composer
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  composer.addPass(bloomPass);
   const container = document.querySelector('.Saturn-card');
const rocket = document.querySelector('.rocket');

let isRight = false;

rocket.addEventListener('click', () => {
  if (!isRight) {
    // Move right, rocket points right
    container.classList.add('active');
    rocket.classList.remove('flipped');
  } else {
    // Move left, rocket flips to drag card
    container.classList.remove('active');
    rocket.classList.add('flipped');

    // After slide finishes, rotate rocket back to normal
    setTimeout(() => {
      rocket.classList.remove('flipped');
    }, 1600); // match CSS transition duration
  }
  isRight = !isRight;
});

  // Resize handling
  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  // Load Saturn model
  addPlanetModel("Saturn", "SaturnRings(Draco).glb", 20, 15);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // 🌧️ Animate ring rain particles toward Jupiter’s south pole
  if (fallingMesh) {
    const positions = fallingMesh.geometry.attributes.position.array;
    const jupiterSouthPole = new THREE.Vector3(20, -15, 0);

    for (let i = 0; i < positions.length; i += 3) {
      const particlePos = new THREE.Vector3(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      );

      const dir = new THREE.Vector3()
        .subVectors(jupiterSouthPole, particlePos)
        .normalize();

      particlePos.addScaledVector(dir, 0.05);

      positions[i] = particlePos.x;
      positions[i + 1] = particlePos.y;
      positions[i + 2] = particlePos.z;

      if (particlePos.distanceTo(jupiterSouthPole) < 1) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = THREE.MathUtils.lerp(17, 32, Math.random());
        positions[i] = Math.cos(angle) * radius + 20;
        positions[i + 1] = 0;
        positions[i + 2] = Math.sin(angle) * radius;
      }
    }
    fallingMesh.geometry.attributes.position.needsUpdate = true;
  }

  composer.render();
}

