import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/TextGeometry.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";


let scene, camera, renderer, controls, composer;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickableObjects = [];
let activePlanet = null;
let loadedFont;
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
function addPlanetModel(name, path, distance, scale = 1, rotSpeed = 0.2 , deg = 270) {
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
      container.rotation.z = THREE.MathUtils.degToRad(deg)

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
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  // 🌞 Sun sphere (visible glow)
  
 
  // Bloom effect
  const RinnerRadius = 8;
  const RouterRadius = 12;
  const Rsegments = 64;
  const RGeo = new THREE.RingGeometry(RinnerRadius, RouterRadius , Rsegments,              // phiSegments
  0,              // thetaStart (default 0)
  Math.PI / 2   );
  const Rmat = new THREE.MeshStandardMaterial({
    color:0xff0000,
    emissive:0xff0000,
    emissiveIntensity:1,
    side:THREE.DoubleSide
  })
  const RMesh = new THREE.Mesh(RGeo, Rmat);
  scene.add(RMesh)
  RMesh.position.set(16, 0 ,0)
  RMesh.rotation.y = Math.PI / 2
  const OinnerRadius = 4;
  const OouterRadius = 8;
  const Osegments = 64;
  const OGeo = new THREE.RingGeometry(OinnerRadius, OouterRadius , Osegments,              // phiSegments
  0,              // thetaStart (default 0)
  Math.PI / 2   );
  const Omat = new THREE.MeshStandardMaterial({
    color:0xffA500,
    emissive:0xffA500,
    emissiveIntensity:1.7,
    side:THREE.DoubleSide
  })
  const OMesh = new THREE.Mesh(OGeo, Omat);
  scene.add(OMesh)
  OMesh.position.set(16, 0 ,0)
  OMesh.rotation.y = Math.PI / 2

  const YinnerRadius = 2;
  const YouterRadius = 4;
  const Ysegments = 64;
  const YGeo = new THREE.RingGeometry(YinnerRadius, YouterRadius , Ysegments,              // phiSegments
  0,              // thetaStart (default 0)
  Math.PI / 2   );
  const Ymat = new THREE.MeshStandardMaterial({
    color:0xffff00,
    emissive:0xffffff,
    emissiveIntensity:2,
    side:THREE.DoubleSide
  })
  const YMesh = new THREE.Mesh(YGeo, Ymat);
  scene.add(YMesh)
  YMesh.position.set(16, 0 ,0)
  YMesh.rotation.y = Math.PI / 2
  const points = [
  new THREE.Vector3(0, 0, 0),     // start
  new THREE.Vector3(1, -2, 0),  // downward leg
  new THREE.Vector3(4, 1, 0),     // upward diagonal
  new THREE.Vector3(8, 1, 0)      // long horizontal bar (stretched)
];


const geometry = new THREE.BufferGeometry().setFromPoints(points);


const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });


const sqrtSymbol = new THREE.Line(geometry, material);

// Position it in the scene
sqrtSymbol.position.set(-2, 0, 0);
scene.add(sqrtSymbol);
sqrtSymbol.rotation.y = Math.PI * 3
sqrtSymbol.position.set(16, 10, 0)

const Secpoints = [
  new THREE.Vector3(0, 0, 0),     // start
  new THREE.Vector3(1, -2, 0),  // downward leg
  new THREE.Vector3(4, 1, 0),     // upward diagonal
  new THREE.Vector3(8, 1, 0)      // long horizontal bar (stretched)
];


const Secgeometry = new THREE.BufferGeometry().setFromPoints(Secpoints);


const Secmaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });


const SecSymbol = new THREE.Line(Secgeometry, Secmaterial);

// Position it in the scene
SecSymbol.position.set(-2, 0, 0);
scene.add(SecSymbol);
SecSymbol.rotation.y = Math.PI * 3
SecSymbol.position.set(16, 6, 0)

const Thirdpoints = [
  new THREE.Vector3(0, 0, 0),     // start
  new THREE.Vector3(1, -2, 0),  // downward leg
  new THREE.Vector3(4, 1, 0),     // upward diagonal
  new THREE.Vector3(8, 1, 0)      // long horizontal bar (stretched)
];


const Thirdgeometry = new THREE.BufferGeometry().setFromPoints(Thirdpoints);


const Thirdmaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });


const ThirdSymbol = new THREE.Line(Thirdgeometry, Thirdmaterial);


ThirdSymbol.position.set(-2, 0, 0);
scene.add(ThirdSymbol);
ThirdSymbol.rotation.y = Math.PI * 3
ThirdSymbol.position.set(16, 2,0)
const Fourthpoints = [
  new THREE.Vector3(0, 0, 0),     // start
  new THREE.Vector3(1, -2, 0),  // downward leg
  new THREE.Vector3(4, 1, 0),     // upward diagonal
  new THREE.Vector3(8, 1, 0)      // long horizontal bar (stretched)
];


const Fourthgeometry = new THREE.BufferGeometry().setFromPoints(Fourthpoints);


const Fourthmaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });


const FourthSymbol = new THREE.Line(Fourthgeometry, Fourthmaterial);

// Position it in the scene

scene.add(FourthSymbol);
FourthSymbol.rotation.y = Math.PI * 3
FourthSymbol.position.set(16, 12, 0);

function addText(message, x, y, z) {
  const textGeometry = new TextGeometry(message, {
    font: loadedFont,   // use the font you stored earlier
    size: 1,
    height: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.00,
    bevelSegments: 5
  });

  const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff,
    emissive:0xffffff
   });
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.set(x, y, z);
  scene.add(textMesh);
}

 const loader = new FontLoader();
loader.load(
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
  function (font) {
    loadedFont = font;
    addText("Crust" , 4.5, 13, 0)
    addText("Mantle" , 3.5 ,11 ,0 )
    addText("Outer Core" , 1 ,7 ,0)
    addText("Inner Core" , 1.5, 3 , 0)
  }
);
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const ambient = new THREE.AmbientLight(0x404040); // soft fill light
scene.add(ambient);


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
   const container = document.querySelector('.earth-card');
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
  addPlanetModel('earth' ,'Half-Earth(draco).glb' , 22, 12 
  )
  
}

function animate() {
  requestAnimationFrame(animate);
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
