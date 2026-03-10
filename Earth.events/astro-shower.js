import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";
let scene, camera, renderer, controls, composer , astroMesh;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickableObjects = [];
let activePlanet = null;
const dracoLoader = new DRACOLoader();
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

  const playBtn = document.querySelector('.play');
  const resetbtn = document.querySelector('.reset')
  // 🌞 Sun sphere (visible glow)
  const sunGeo = new THREE.SphereGeometry(30, 64, 64);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xffc400,
    emissive: 0xff9e00,
    emissiveIntensity: 6
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(-100, 0, 0);
  scene.add(sunMesh);

  // 🌞 Sun light (real illumination)
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunLight.position.set(-100, 0, 0); // same as Sun position
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  scene.add(sunLight);
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);




  const astroGeo = new THREE.SphereGeometry(0.50, 64, 64);
  const astroMat = new THREE.MeshStandardMaterial({
    color: 0x1e90ff,        // Dodger blue
    emissive: 0x00bfff,     // Deep sky blue
    emissiveIntensity: 4
  });
  const astroMesh = new THREE.Mesh(astroGeo, astroMat);
  // Position the comet 180° opposite the +X side and flip its orientation
  astroMesh.position.set(160, 70, -100);
  astroMesh.rotation.y = Math.PI;
  astroMesh.rotation.z = Math.PI*-0.1;

 
  const tailLength = 60; 
  const tailRadius = 6;  
  const tailGeo = new THREE.ConeGeometry(tailRadius, tailLength, 10, 2, true);


  function MovetheObject(object, speedX, speedY) {
   function step() {
    object.position.x += speedX;
    object.position.y += speedY;    // move continuously
    requestAnimationFrame(step);  // loop again
  }
  step(); // start loop
  }


// Usage
  
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

  const tailMesh = new THREE.Mesh(tailGeo, tailMat);

  tailMesh.rotation.z = Math.PI / 2;

 
  tailMesh.position.set(-tailLength / 2 - 1, 0, 0);

 
  tailMesh.renderOrder = 1;

  
  astroMesh.add(tailMesh);

  scene.add(astroMesh);
  astroMesh.position.set( 260 ,120 , -100)
  

  // 🌞 Sun light (real illumination)
  const astroLight = new THREE.DirectionalLight(0xffffff, 2.5);
 astroLight.position.set(200, 0, 0); // same as Sun position
 astroLight.castShadow = true;
  astroLight.shadow.mapSize.set(2048, 2048);
  scene.add (astroLight);
  // Ambient light
  playBtn.addEventListener('click',() =>{
    MovetheObject(astroMesh, -2.0, -1.0);
  })
  
  // Bloom effect
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, // strength
    0.4, // radius
    0.85 // threshold
  );
  composer.addPass(bloomPass);
  assetsLoaded = 0;
  totalAssets = 0;
  updateProgress();

const container = document.querySelector('.flyby-card');
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

  // Load planets
  
  addPlanetModel('Earth', 'Earth.glb', 40, 12);
  
}

function animate() {
  
  requestAnimationFrame(animate)


  controls.update();
  composer.render();
}


function onPointerDown(event) {
  // normalize pointer coordinates (-1 to +1)
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  // intersect only objects we marked as clickable (and their children)
  const intersects = raycaster.intersectObjects(clickableObjects, true);
  if (intersects.length > 0) {
    // find the root object that is in clickableObjects
    let hit = intersects[0].object;
    while (hit && !clickableObjects.includes(hit)) {
      hit = hit.parent;
    }
    if (hit) {
      const pname = (hit.userData && hit.userData.planetName) || hit.name || 'unknown';
      console.log('Clicked planet:', pname, hit);
      activePlanet = hit;
      const mercuryInfo = document.querySelector('.mercury-info');
     
    }
  }
}

