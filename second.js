import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";


let scene, camera, renderer, controls, composer;
// store loaded models so we can animate (spin) them
const rotatables = [];
let sunModelRef = null;
// Raycasting / picking support
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
// list of root objects that should respond to clicks
const clickableObjects = [];
const clock = new THREE.Clock();
// Camera zoom targeting
let cameraTarget = null;
const zoomSpeed = 0.08; // interpolation factor per frame
// Active planet (the one user clicked / showing info)
let activePlanet = null;
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

      if (window.innerWidth < 600) {
        planet.position.y = distance;
        planet.rotation.z = Math.PI / 2; // 90 degree rotation for mobile
      } else {
        planet.position.x = distance;
        rotatables.push({ mesh: planet, speed: rotSpeed });
      }

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

function shiftPlanetLeft(name) {
  if (!clickableObjects || clickableObjects.length === 0) return;

  const planet = clickableObjects.find(
    p => (p.userData && p.userData.planetName === name) || p.name === name
  );
  if (!planet) return;

  // Calculate adaptive shift amount based on distance from origin
  const baseDistance = planet.userData?.originalPosition
    ? planet.userData.originalPosition.length()
    : 200;
  const shiftAmount = Math.min(80, Math.max(30, baseDistance * 0.08));

  // Get camera directions
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const right = forward.clone().cross(camera.up).normalize();
  const left = right.clone().multiplyScalar(-1);

  // Calculate shifted position once if not already stored
  if (!planet.userData.shiftedPosition) {
    planet.userData.shiftedPosition = planet.userData.originalPosition.clone()
      .add(left.clone().multiplyScalar(shiftAmount));
  }

  // Toggle between original and shifted position
  if (!planet.userData.isShiftedLeft) {
    planet.userData.targetPosition = planet.userData.shiftedPosition.clone();
    planet.userData.isShiftedLeft = true;
  } else {
    planet.userData.targetPosition = planet.userData.originalPosition.clone();
    planet.userData.isShiftedLeft = false;
  }
}
function shiftPlanetDownwards(name) {
  if (!clickableObjects || clickableObjects.length === 0) return;

  const planet = clickableObjects.find(
    p => (p.userData && p.userData.planetName === name) || p.name === name
  );
  if (!planet) return;

  const baseDistance = planet.userData?.originalPosition
    ? planet.userData.originalPosition.length()
    : 200;
  const shiftAmount = Math.min(50, Math.max(30, baseDistance * 0.001));

  // World down (negative Y axis)
  const down = new THREE.Vector3(0, -1, 0);

  // Always recalc shifted position
  const shiftedPosition = planet.userData.originalPosition.clone()
    .add(down.multiplyScalar(shiftAmount));

  if (!planet.userData.isShiftedDown) {
    planet.userData.targetPosition = shiftedPosition;
    planet.userData.isShiftedDown = true;
  } else {
    planet.userData.targetPosition = planet.userData.originalPosition.clone();
    planet.userData.isShiftedDown = false;
  }
}


  
function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight , 0.1, 2000);
  camera.position.set(0, 100, 80);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Pointer/click handling: listen for pointer events on the canvas
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  // Close mars card when arrow is clicked
  const marsCloseBtn = document.querySelector('.mars-card .arrow');
  if (marsCloseBtn) {
    marsCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const marsCard = document.querySelector('.mars-card');
      marsCard.style.display = 'none';
    });
  }

  // Attach per-card arrow toggle listeners once (prevent duplicate handlers)
  const mercuryCard_el = document.querySelector('.mercury-card');
  const merArrow_el = document.getElementById('mer-arrow');
    if (merArrow_el && mercuryCard_el) {
    merArrow_el.addEventListener('click', () => {
      if (mercuryCard_el.classList.contains('Left-anim')) {
        mercuryCard_el.classList.remove('Left-anim');
        controls.enableZoom = false;
        mercuryCard_el.classList.add('Right-anim');
      } else {
        mercuryCard_el.classList.remove('Right-anim');
        controls.enableZoom = true;
        mercuryCard_el.classList.add('Left-anim');
      }
      console.log('clicked');
      shiftPlanetLeft('Mercury');
    });
  }

  const venusCard_el = document.querySelector('.Venus-card');
  const venArrow_el = document.getElementById('venus-arrow');
    if (venArrow_el && venusCard_el) {
    venArrow_el.addEventListener('click', () => {
      if (venusCard_el.classList.contains('Left-anim')) {
        venusCard_el.classList.remove('Left-anim');
        controls.enableZoom = false;
        venusCard_el.classList.add('Right-anim');
      } else {
        venusCard_el.classList.remove('Right-anim');
        controls.enableZoom = true;
        venusCard_el.classList.add('Left-anim');
      }
      console.log('clicked');
      shiftPlanetLeft('Venus');
    });
  }

  const earthCard_el = document.querySelector('.earth-card');
const earthArrow_el = document.getElementById('earth-arrow');

if (earthArrow_el && earthCard_el) {
  earthArrow_el.addEventListener('click', () => {
    if (earthCard_el.classList.contains('Left-anim')) {
      earthCard_el.classList.remove('Left-anim');
      controls.enableZoom = false;
      earthCard_el.classList.add('Right-anim');
    } else {
      earthCard_el.classList.remove('Right-anim');
      controls.enableZoom = true;
      earthCard_el.classList.add('Left-anim');
    }

    console.log('clicked');

    
     if (window.innerWidth < 600) {
          // Mobile: shift downwards/upwards
          shiftPlanetDownwards('Earth');
        } else {
          // Desktop: shift left/right
          shiftPlanetLeft('Earth');
        }
      });
}


 
  const marsCard_el = document.querySelector('.mars-card');
  const marsArrow_el = document.getElementById('mars-arrow');
  if (marsArrow_el && marsCard_el) {
    marsArrow_el.addEventListener('click', () => {
      if (marsCard_el.classList.contains('Left-anim')) {
        marsCard_el.classList.remove('Left-anim');
        controls.enableZoom = false;
        marsCard_el.classList.add('Right-anim');
      } else {
        marsCard_el.classList.remove('Right-anim');
        controls.enableZoom = true;
        marsCard_el.classList.add('Left-anim');
      }
      console.log('clicked');
      shiftPlanetLeft('Mars');
    });
  }
  const jupiterCard_el = document.querySelector('.jupiter-card');
  const jupiterArrow_el = document.getElementById('jupiter-arrow');
  if (jupiterArrow_el && jupiterCard_el) {
    jupiterArrow_el.addEventListener('click', () => {
      if (jupiterCard_el.classList.contains('Left-anim')) {
        jupiterCard_el.classList.remove('Left-anim');
        controls.enableZoom = false;
        jupiterCard_el.classList.add('Right-anim');
      } else {
        jupiterCard_el.classList.remove('Right-anim');
        controls.enableZoom = true;
        jupiterCard_el.classList.add('Left-anim');
      }
      console.log('clicked');
      shiftPlanetLeft('Jupiter');
    });
  }
   const saturnCard_el = document.querySelector('.saturn-card');
   const saturnArrow_el = document.getElementById('saturn-arrow');
  if (saturnArrow_el && saturnCard_el) {
    saturnArrow_el.addEventListener('click', () => {
      if (saturnCard_el.classList.contains('Left-anim')) {
        saturnCard_el.classList.remove('Left-anim');
        controls.enableZoom = false;
        saturnCard_el.classList.add('Right-anim');
      } else {
        saturnCard_el.classList.remove('Right-anim');
        controls.enableZoom = true;
        saturnCard_el.classList.add('Left-anim');
      }
      console.log('clicked');
      shiftPlanetLeft('Saturn');
    });
  }
  const uranusCard_el = document.querySelector('.uranus-card');
  const uranusArrow_el = document.getElementById('uranus-arrow');
  if (uranusArrow_el && uranusCard_el) {
    uranusArrow_el.addEventListener('click', () => {
      if (uranusCard_el.classList.contains('Left-anim')) {
        uranusCard_el.classList.remove('Left-anim');
        controls.enableZoom = false;
        uranusCard_el.classList.add('Right-anim');
      } else {
        uranusCard_el.classList.remove('Right-anim');
        controls.enableZoom = true;
        uranusCard_el.classList.add('Left-anim');
      }
      console.log('clicked');
      shiftPlanetLeft('Uranus');
    });
  }
  const neptuneCard_el = document.querySelector('.neptune-card');
  const neptuneArrow_el = document.getElementById('neptune-arrow');
  if (neptuneArrow_el && neptuneCard_el) {
    neptuneArrow_el.addEventListener('click', () => {
      if (neptuneCard_el.classList.contains('Left-anim')) {
        neptuneCard_el.classList.remove('Left-anim');
        controls.enableZoom = false;
        neptuneCard_el.classList.add('Right-anim');
      } else {
        neptuneCard_el.classList.remove('Right-anim');
        controls.enableZoom = true;
        neptuneCard_el.classList.add('Left-anim');
      }
      console.log('clicked');
      shiftPlanetLeft('Neptune');
    });
  }

  // Lighting
  // Stronger sun point light at origin
 
  // Add a hemisphere light for warm/cool fill lighting
  // const hemi = new THREE.HemisphereLight(0xffeebf, 0x080820, 0.8);
  // scene.add(hemi);

  // // Brighter ambient to lift shadows
  // const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  // scene.add(ambientLight);

  // Sun: load your 3D sun model instead of creating a simple sphere
  
  const sunGeo = new THREE.SphereGeometry(64, 64, 64);
  const sunMat = new THREE.MeshStandardMaterial({
      color: 0xffc400,
      emissive: 0xff9e00,
      emissiveIntensity: 6
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(-120, 0, 0);
    scene.add(sunMesh);
    if(innerWidth < 600){
      sunMesh.position.set(-10, -260, 0);
    }else{
      sunMesh.position.set(-120, 0, 0);
    }
    
      // 🌞 Sun light (real illumination)
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(-100, 0, 0); // same as Sun position
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    scene.add(sunLight);
      // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
  
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
  
  // Now load planets (AFTER scene exists)
  // reset progress counters each time we initialize
  assetsLoaded = 0;
  totalAssets = 0;
  updateProgress();

  addPlanetModel('Mercury', 'mercry-draco.glb', 100, 6, 0.5, 0.04);
  addPlanetModel('Venus', 'Venus(draco).glb', 180, 8, 0.3, 0.015);
  addPlanetModel('Earth', 'Earth.glb', 270, 12, 0.6, 0.01);
  addPlanetModel('Mars', 'Mars(draco).glb', 360, 12, 0.45, 0.008);
  addPlanetModel('Jupiter', 'Jupiter(draco).glb', 450, 18, 0.2, 0.003);
  addPlanetModel('Saturn', 'Saturn(Draco).glb', 540, 16, 0.15, 0.002);
  addPlanetModel('Uranus', 'uranus(draco).glb', 630, 14, 0.1, 0.001);
  addPlanetModel('Neptune', 'neptune(draco).glb', 720, 13, 0.08, 0.0005);

  // Resize handling
  window.addEventListener('resize', onWindowResize);

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
  controls.update();

  // Smooth camera zoom towards target
  if (cameraTarget) {
    const currentPos = camera.position;
    const distance = currentPos.distanceTo(cameraTarget);

    if (distance > 1) {
      // Lerp towards target
      currentPos.lerp(cameraTarget, zoomSpeed);
    } else {
      // Reached target
      currentPos.copy(cameraTarget);
      cameraTarget = null;
    }
  }

  // Smoothly move planets toward their UI-driven target positions
  const moveLerp = 0.01; // interpolation factor for planet translation
  clickableObjects.forEach(obj => {
    if (obj.userData && obj.userData.targetPosition) {
      // lerp world position
      obj.position.lerp(obj.userData.targetPosition, moveLerp);

      // snap when very close
      if (obj.position.distanceTo(obj.userData.targetPosition) < 0.1) {
        obj.position.copy(obj.userData.targetPosition);
      }
    }
  });

  // Spin each planet on its own axis
  rotatables.forEach(rotatable => {
    rotatable.mesh.rotation.y += rotatable.speed * 0.016; // ~60fps delta
  });

  // Render scene
  composer.render();
}
init();

// Pointer down handler using raycaster to detect clicked planet
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
      
      const mercuryCard = document.querySelector('.mercury-card');
      const merArrow = document.getElementById('mer-arrow');
      if(pname ==='Mercury'){
        if (mercuryCard.classList.contains('Right-anim')) {
          mercuryCard.classList.remove('Right-anim');
          controls.enableZoom = true;
          mercuryCard.classList.add('Left-anim');
        } else {
          mercuryCard.classList.remove('Left-anim');
          controls.enableZoom = false;
          mercuryCard.classList.add('Right-anim');
        }
      }

      const venusCard = document.querySelector('.Venus-card');
      const venarrow = document.getElementById('venus-arrow');
      if(pname ==='Venus'){
        if (venusCard.classList.contains('Right-anim')) {
          venusCard.classList.remove('Right-anim');
          controls.enableZoom = true;
          venusCard.classList.add('Left-anim');
        } else {
          venusCard.classList.remove('Left-anim');
          controls.enableZoom = false;
          venusCard.classList.add('Right-anim');
        }
      }

      const earthCard = document.querySelector('.earth-card');
      const eartharrow = document.getElementById('earth-arrow');
      if(pname ==='Earth'){
        // Only toggle card animations on desktop
       
          if (earthCard.classList.contains('Right-anim')) {
            earthCard.classList.remove('Right-anim');
            controls.enableZoom = true;
            earthCard.classList.add('Left-anim');
          } else {
            earthCard.classList.remove('Left-anim');
            controls.enableZoom = false;
            earthCard.classList.add('Right-anim');
          }
        
      }

      const marsCard = document.querySelector('.mars-card');
      const marsArrow = document.getElementById('mars-arrow');
      if(pname ==='Mars'){
        if (marsCard.classList.contains('Right-anim')) {
          marsCard.classList.remove('Right-anim');
          controls.enableZoom = true;
          marsCard.classList.add('Left-anim');
        } else {
          marsCard.classList.remove('Left-anim');
          controls.enableZoom = false;
          marsCard.classList.add('Right-anim');
        }
      }

      const jupiterCard = document.querySelector('.jupiter-card');
      if(pname ==='Jupiter'){
        if (jupiterCard.classList.contains('Right-anim')) {
          jupiterCard.classList.remove('Right-anim');
          controls.enableZoom = true;
          jupiterCard.classList.add('Left-anim');
        } else {
          jupiterCard.classList.remove('Left-anim');
          controls.enableZoom = false;
          jupiterCard.classList.add('Right-anim');
        }
      }

      const saturnCard = document.querySelector('.saturn-card');
      if(pname ==='Saturn'){
        if (saturnCard.classList.contains('Right-anim')) {
          saturnCard.classList.remove('Right-anim');
          controls.enableZoom = true;
          saturnCard.classList.add('Left-anim');
        } else {
          saturnCard.classList.remove('Left-anim');
          controls.enableZoom = false;
          saturnCard.classList.add('Right-anim');
        }
      }

      const uranusCard = document.querySelector('.uranus-card');
      if(pname ==='Uranus'){
        if (uranusCard.classList.contains('Right-anim')) {
          uranusCard.classList.remove('Right-anim');
          controls.enableZoom = true;
          uranusCard.classList.add('Left-anim');
        } else {
          uranusCard.classList.remove('Left-anim');
          controls.enableZoom = false;
          uranusCard.classList.add('Right-anim');
        }
      }

      const neptuneCard = document.querySelector('.neptune-card');
      const neptunearrow = document.getElementById('neptune-arrow');
      if(pname ==='Neptune'){
        if (neptuneCard.classList.contains('Right-anim')) {
          neptuneCard.classList.remove('Right-anim');
          controls.enableZoom = true;
          neptuneCard.classList.add('Left-anim');
        } else {
          neptuneCard.classList.remove('Left-anim');
          controls.enableZoom = false;
          neptuneCard.classList.add('Right-anim');
        }
      }

      const scrollBox = document.querySelector('.my-box');

      // Set camera target to zoom towards the planet
      const planetPos = new THREE.Vector3();
      hit.getWorldPosition(planetPos);
      
      // Update OrbitControls to look at planet center instead of sun
      controls.target.copy(planetPos);
      controls.autoRotate = false;
      
      // Camera offset: move to planet + a distance away from camera direction
      const cameraDirection = camera.position.clone().sub(planetPos).normalize();
      const zoomDistance = 30;
      cameraTarget = planetPos.clone().add(cameraDirection.multiplyScalar(zoomDistance));

      // Check if mobile or desktop
      if (window.innerWidth < 600) {
        // Mobile: shift downwards/upwards only
        // Reset any left-shift state first
        hit.userData.isShiftedLeft = false;
        hit.userData.shiftedPosition = null;
        
        const baseDistance = hit.userData?.originalPosition
          ? hit.userData.originalPosition.length()
          : 200;
        const shiftAmount = Math.min(50, Math.max(30, baseDistance * 0.001));
        
        // World down (negative Y axis)
        const down = new THREE.Vector3(0, -1, 0);
        
        // Always recalc shifted position
        const shiftedPosition = hit.userData.originalPosition.clone()
          .add(down.clone().multiplyScalar(shiftAmount));
        
        if (!hit.userData.isShiftedDown) {
          hit.userData.targetPosition = shiftedPosition;
          hit.userData.isShiftedDown = true;
        } else {
          hit.userData.targetPosition = hit.userData.originalPosition.clone();
          hit.userData.isShiftedDown = false;
        }
      } else {
        // Desktop: shift left/right
        const baseDistance = hit.userData.originalPosition.length() || 200;
        const shiftAmount = Math.min(80, Math.max(30, baseDistance * 0.08));
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const right = forward.clone().cross(camera.up).normalize();
        const left = right.clone().multiplyScalar(-1);

        if (!hit.userData.shiftedPosition) {
          hit.userData.shiftedPosition = hit.userData.originalPosition.clone().add(left.clone().multiplyScalar(shiftAmount));
        }

        if (!hit.userData.isShiftedLeft) {
          hit.userData.targetPosition = hit.userData.shiftedPosition.clone();
          hit.userData.isShiftedLeft = true;
        } else {
          hit.userData.targetPosition = hit.userData.originalPosition.clone();
          hit.userData.isShiftedLeft = false;
        }
      }
    }
  }
}
