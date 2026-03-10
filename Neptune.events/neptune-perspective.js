import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";

let scene, camera, renderer, controls, composer;
const clickableObjects = [];

let activePlanet = null;
let cameraLocked = false;
let lockedY = 0;
let lockedZ = 0;
let cameraRotationY = 0; // yaw (left/right)
let cameraRotationX = 0; // pitch (up/down)
let isPointerDown = false;
let prevPointerX = 0;
let prevPointerY = 0;

const dracoLoader = new DRACOLoader();

// loading screen state --------------------------------------------------
let assetsLoaded = 0;
let totalAssets = 0; // will be set once we know how many planets we plan to load

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
      if (name === "roughy-surface") {
      activePlanet = planet;
      const bbox = new THREE.Box3().setFromObject(planet);
      const planetPos = new THREE.Vector3();
      planet.getWorldPosition(planetPos);

      lockedY = bbox.max.y + 2; // just above surface
      lockedZ = planetPos.z;
      cameraLocked = true;

      if (camera) {
        camera.position.set(planetPos.x, lockedY, lockedZ);
        camera.rotation.order = "YXZ";
        camera.rotation.y = 0;
        camera.rotation.x = 0;
        cameraRotationY = 0;
        cameraRotationX = 0;
      }
    }


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
  scene.background = new THREE.Color(0x00000); // solid orange background

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 100, 500);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // Controls (disabled, we’ll use custom rotation)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;

  // Pointer handlers for horizontal + vertical rotation
  function onPointerDown(e) {
    if (!cameraLocked) return;
    isPointerDown = true;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isPointerDown || !cameraLocked) return;
    const deltaX = e.clientX - prevPointerX;
    const deltaY = e.clientY - prevPointerY;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;

    // Rotate camera around Y axis (left/right)
    cameraRotationY += deltaX * 0.002;
    // Rotate camera around X axis (up/down)
    cameraRotationX += deltaY * 0.002;

    // Clamp pitch so you can't flip upside down
    const maxPitch = Math.PI / 3;   // ~60° up
    const minPitch = -Math.PI / 6;  // ~30° down
    cameraRotationX = Math.max(minPitch, Math.min(maxPitch, cameraRotationX));

    camera.rotation.order = "YXZ";
    camera.rotation.y = cameraRotationY;
    camera.rotation.x = cameraRotationX;

    e.preventDefault();
  }

  function onPointerUp() {
    isPointerDown = false;
  }

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);

  // 🌞 Sun model
  const sunGeo = new THREE.SphereGeometry(64, 64, 64);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xffc400,
    emissive: 0xff9e00,
    emissiveIntensity: 2,
  });
  

  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(-600, 200, 0);
  scene.add(sunMesh);
  // Add corona glow (sun rays)
  

  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
  const sunX = 300
  const sunz= 0
  sunLight.position.set(sunX, 0, sunz);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  scene.add(sunLight);

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 3);
  scene.add(ambientLight);
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
   cometMesh.position.set( i *20, y, z + 350);
   cometMesh.position.y = Math.PI/2  * 3.5
   cometMesh.rotation.z = Math.PI / 2* 3.5;
 
   // Tail mesh
   const tailMesh = new THREE.Mesh(tailGeo, tailMat);
   tailMesh.rotation.z = Math.PI / 2;
   tailMesh.position.set(-tailLength / 2 - 1, 0, 0);
   tailMesh.renderOrder = 1;
 
   // Attach tail to comet
   cometMesh.add(tailMesh);
   
   // Assign unique speed to each comet    
   cometMesh.userData.speedX = (Math.random() * 0.7 + 0.5);
   cometMesh.userData.speedY = (Math.random() * 0.7 + 0.5);

 
   cometGroup.add(cometMesh);
   comets.push(cometMesh);
  comets.forEach((comet, i) =>{
   comet.position.x  = 100 + i *10 
   comet.position.y = 230  + i * 10
   
 
  })
 
   
 }
 function MovetheObject(objects) {
   function step() {
     objects.forEach(comet => {
       // Use individual speed for each comet
       comet.position.x += comet.userData.speedX;
       comet.position.y -= comet.userData.speedY;
     });
     requestAnimationFrame(step); // keep looping
   }
   step(); // start loop
 }
 scene.add(cometGroup);
  

  // 🌞 Sun light (real illumination)
  const astroLight = new THREE.DirectionalLight(0xffffff, 2.5);
 astroLight.position.set(200, 0, 0); // same as Sun position
 astroLight.castShadow = true;
  astroLight.shadow.mapSize.set(2048, 2048);
  scene.add (astroLight);
  // Ambient light
  const playbtn = document.querySelector('.play');
 playbtn.addEventListener('click',() =>{
    MovetheObject(comets);
  })

  
  // Bloom effect
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  composer.addPass(bloomPass);

  // Load rocky surface planet
  
  addPlanetModel("roughy-surface", "Rocky-Surface(Draco).glb", 100, 20 , 0);

  // Resize handling
  window.addEventListener("resize", onWindowResize);

  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // Lock camera to surface position
  if (cameraLocked && activePlanet) {
    const planetPos = new THREE.Vector3();
    activePlanet.getWorldPosition(planetPos);

    camera.position.x = planetPos.x;
    camera.position.y = lockedY;
    camera.position.z = lockedZ;
    // Rotation.x and .y are controlled by pointer drag
  }

  composer.render();
}

init();