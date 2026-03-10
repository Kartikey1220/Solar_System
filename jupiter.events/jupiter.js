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
let MauraMesh;
let CauraMesh;
let assetsLoaded = 0;
let totalAssets = 0; // will be set once we know how many planets we plan to load
const dracoLoader = new DRACOLoader();
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
function addPlanetModel(name, path, distance, scale = 1, rotSpeed = 0.2 ) {
  // each call increments totalAssets; used for progress calculation
  totalAssets += 1;

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  loader.load(
    path,
    (gltf) => {
      const planet = gltf.scene;
      planet.scale.set(scale, scale, scale);
      planet.rotation.y = 0;

      

      planet.userData = planet.userData || {};
      planet.userData.planetName = name;
      planet.name = name;
      clickableObjects.push(planet);

      planet.userData.originalPosition = planet.position.clone();
      planet.userData.targetPosition = planet.position.clone();
      planet.userData.isShiftedLeft = false;

      scene.add(planet);

      // mark asset as loaded and update progress bar
      assetsLoaded += 1;
      updateProgress();
      if (assetsLoaded === totalAssets) {
        // everything is in place
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
      // even if there was an error we consider this asset "done" to avoid hanging the loader
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
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  // 🌞 Sun sphere (visible glow)
  const sunGeo = new THREE.SphereGeometry(30, 64, 64);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xffc400,
    emissive: 0xff9e00,
    emissiveIntensity: 6
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

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const innerRadius = 2.5;     // Size of the hole
  const outerRadius = 5;       // Total size of the ring
  const segments = 128;        // Smoothness

  const MauraGeo = new THREE.RingGeometry(innerRadius, outerRadius, segments);

// Optional: rotate to face upward (if needed)
  MauraGeo.rotateX(Math.PI / 2);

  const MauraMat = new THREE.MeshStandardMaterial({
    color: 0x8A2BE2,        // BlueViolet base
emissive:  0xCC0066
,     // MediumPurple glow
emissiveIntensity: 8,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
   
  });

  MauraMesh = new THREE.Mesh(MauraGeo, MauraMat);
  scene.add(MauraMesh);
  MauraMesh.position.set(0,15,0)

  const CinnerRadius = 2.5;     // Size of the hole
  const CouterRadius = 5;       // Total size of the ring
  const Csegments = 128;        // Smoothness

  const CauraGeo = new THREE.RingGeometry(CinnerRadius, CouterRadius, Csegments);

// Optional: rotate to face upward (if needed)
  CauraGeo.rotateX(Math.PI / 2);

  const CauraMat = new THREE.MeshStandardMaterial({
    color: 0x0077FF,             // Deep sky blue
    emissive: 0x0000FF,          // Blue glow
    emissiveIntensity: 10,
    transparent:true,
    opacity:0.8,
       // Soft glow
    side: THREE.DoubleSide
  });

  CauraMesh = new THREE.Mesh(CauraGeo, CauraMat);
  scene.add(CauraMesh);
  CauraMesh.position.set(0, -15 ,0)
  
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, // strength
    0.4, // radius
    0.85 // threshold
  );
  composer.addPass(bloomPass);
   const container = document.querySelector('.jupiter-card');
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

  // Load Jupiter
  addPlanetModel('jupiter', 'Jupiter(draco).glb', 0, 15);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Animate MauraMesh opacity and emissive intensity
  function Fadeanimation(object, speed){
    const time = Date.now() * 0.001; // Time in seconds
    const oscillation = Math.sin(time * speed) * 0.5 + 0.5; // Smooth oscillation between 0 and 1 (faster)
    
    // Animate opacity (0.2 to 1.0 - much wider range)
    object.material.opacity = 0.4 + oscillation * 0.8;
    
    // Animate emissive intensity (2 to 15 - more dramatic effect)
    object.material.emissiveIntensity =15 + oscillation * 13;
  }
   function CFadeanimation(object, speed){
    const time = Date.now() * 0.001; // Time in seconds
    const oscillation = Math.sin(time * speed) * 0.5 + 0.5; // Smooth oscillation between 0 and 1 (faster)
    
    // Animate opacity (0.2 to 1.0 - much wider range)
    object.material.opacity = 0.4 + oscillation * 0.8;
    
    // Animate emissive intensity (2 to 15 - more dramatic effect)
    object.material.emissiveIntensity =20 + oscillation * 13;
  }
  Fadeanimation(MauraMesh , 0.5);
  CFadeanimation(CauraMesh, 0.7);

  composer.render();
}



function onPointerDown(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(clickableObjects, true);
  if (intersects.length > 0) {
    let hit = intersects[0].object;
    while (hit && !clickableObjects.includes(hit)) {
      hit = hit.parent;
    }
    if (hit) {
      const pname = (hit.userData && hit.userData.planetName) || hit.name || 'unknown';
      console.log('Clicked planet:', pname, hit);
      activePlanet = hit;
    }
  }
}