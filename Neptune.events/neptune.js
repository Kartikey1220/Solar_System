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
const playbtn = document.querySelector('.play')
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
  renderer.domElement.addEventListener("pointerdown", onPointerDown);

   function createGradientTexture() {
    const w = 256, h = 1024; // narrow vertical gradient matching cone length
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Create vertical gradient from tip (bright white) to base (soft orange) to transparent
    const grad = ctx.createLinearGradient(0, h, 0, 0); // reversed direction: bottom to top

   grad.addColorStop(0.0, 'rgba(255,255,255,1)');        // bright white at base (head)
  grad.addColorStop(0.10, 'rgba(180,220,255,0.95)');    // icy pale blue
  grad.addColorStop(0.20, 'rgba(100,180,255,0.8)');     // strong comet blue
  grad.addColorStop(0.30, 'rgba(30,144,255,0.5)');      // deep sky blue
  grad.addColorStop(0.40, 'rgba(30,144,255,0.2)');      // fading
  grad.addColorStop(0.50, 'rgba(30,144,255,0)');        // fully transparent
  grad.addColorStop(1.0, 'rgba(0,0,0,0)');              // extra fade buffer (optional)      // fully transparent at tail end  // fade to transparent  
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }


  // 🌞 Sun sphere (visible glow)
  const sunGeo = new THREE.SphereGeometry(30, 64, 64);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xffc400,
    emissive: 0xff9e00,
    emissiveIntensity: 6,
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(-200, 0, 0);
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
  const particleCount = 10;
  const cometGroup = new THREE.Group();
const comets = []

function createGradientTexture() {
  const w = 256, h = 1024; // narrow vertical gradient matching cone length
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Create vertical gradient from tip (bright white) to base (soft orange) to transparent
  const grad = ctx.createLinearGradient(0, h, 0, 0); // reversed direction: bottom to top

  grad.addColorStop(0.0, 'rgba(255,255,255,1)');        // bright white at base (head)
  grad.addColorStop(0.10, 'rgba(180,220,255,0.95)');    // icy pale blue
  grad.addColorStop(0.20, 'rgba(100,180,255,0.8)');     // strong comet blue
  grad.addColorStop(0.30, 'rgba(30,144,255,0.5)');      // deep sky blue
  grad.addColorStop(0.40, 'rgba(30,144,255,0.2)');      // fading
  grad.addColorStop(0.50, 'rgba(30,144,255,0)');        // fully transparent
  grad.addColorStop(1.0, 'rgba(0,0,0,0)');              // extra fade buffer (optional)      // fully transparent at tail end  // fade to transparent  
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

const tailTexture = createGradientTexture();

const tailMat = new THREE.MeshBasicMaterial({
  map: tailTexture,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
});

// Align the tail texture so the bright tip matches the cone tip
tailMat.map.center = new THREE.Vector2(0.5, 0.0);
tailMat.map.rotation = 10;

const tailLength = 30;
const tailRadius =3;
const tailGeo = new THREE.ConeGeometry(tailRadius, tailLength, 5, 2, true);

for (let i = 0; i < particleCount; i++) {
  const angle = Math.random() * 2 * Math.PI;
  const radius = THREE.MathUtils.lerp(17, 32, Math.random());
  const x = Math.cos(angle) * radius + 100;
  const z = Math.sin(angle) * radius;
  const y = 10;

  // Comet nucleus
  const cometGeo = new THREE.SphereGeometry(1.5, 16, 16);
  const cometMat = new THREE.MeshStandardMaterial({
    color: 0x1e90ff,
    emissive: 0x00bfff,
    emissiveIntensity: 4,
    transparent: true,
    opacity: 0.9,
  });
  const cometMesh = new THREE.Mesh(cometGeo, cometMat);
  cometMesh.position.set( i *20, y, z + 250);
  cometMesh.rotation.y = Math.PI / 2;
  cometMesh.rotation.z = Math.PI / 2 * 3.5;

  // Tail mesh
  const tailMesh = new THREE.Mesh(tailGeo, tailMat);
  tailMesh.rotation.z = Math.PI / 2;
  tailMesh.position.set(-tailLength / 2 - 1, 0, 0);
  tailMesh.renderOrder = 1;

  // Attach tail to comet
  cometMesh.add(tailMesh);
  
  // Assign unique speed to each comet
  cometMesh.userData.speedY = (Math.random() * 0.5 + 0.3); // range 0.1 to 0.4
  cometMesh.userData.speedZ = (Math.random() * 0.6 + 0.4); // range 0.2 to 0.6

  cometGroup.add(cometMesh);
  comets.push(cometMesh);
 comets.forEach((comet, i) =>{
  comet.position.x  = 100 + i *10 
  comet.position.y = 130  + i * 10
  

 })

  
}
function MovetheObject(objects) {
  function step() {
    objects.forEach(comet => {
      // Use individual speed for each comet
      comet.position.y -= comet.userData.speedY;
      comet.position.z -= comet.userData.speedZ;
    });
    requestAnimationFrame(step); // keep looping
  }
  step(); // start loop
}
scene.add(cometGroup);
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
 playbtn.addEventListener('click',() =>{
    MovetheObject(comets);
  })
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
   const container = document.querySelector('.Neptune-card');
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
  addPlanetModel("Neptune", "neptune(draco).glb", 20, 15);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  

  composer.render();
}


function onPointerDown(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(clickableObjects, true);
  if (intersects.length > 0) {
    let hit = intersects[0].object;
    while (hit && !clickableObjects.includes(hit)) {
      hit = hit.parent;
    }
    if (hit) {
      const pname =
        (hit.userData && hit.userData.planetName) || hit.name || "unknown";
      console.log("Clicked planet:", pname, hit);
      activePlanet = hit;
    }
  }
}