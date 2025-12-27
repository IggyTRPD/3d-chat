import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Axes helper
const axesHelper = new THREE.AxesHelper();
window.addEventListener("keydown", (event) => {
  if (event.key !== "a") return;

  const hasAxesHelper =
    scene.children.filter((child) => child.type === "AxesHelper").length > 0;

  if (!hasAxesHelper) {
    scene.add(axesHelper);
  } else {
    axesHelper.dispose();
    scene.remove(axesHelper);
  }
});

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const matcapTexture = textureLoader.load("/textures/matcaps/3.png");
matcapTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * Fonts
 */
const fontLoader = new FontLoader();
fontLoader.load("/fonts/helvetiker_regular.typeface.json", (font) => {
  const textGeometry = new TextGeometry("227", {
    font,
    size: 0.5,
    depth: 0.2,
    curveSegments: 5,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 4,
  });

  // Manual textGeometry centering
  //   textGeometry.computeBoundingBox();
  //   console.log("coordinates: ", textGeometry.boundingBox);
  //   //   textGeometry.translate(
  //   //     -textGeometry.boundingBox.max.x * 0.5,
  //   //     -textGeometry.boundingBox.max.y * 0.5,
  //   //     -textGeometry.boundingBox.max.z * 0.5
  //   //   );

  //   // Centering including bevel and thickness
  //   textGeometry.translate(
  //     -(textGeometry.boundingBox.max.x - 0.02) * 0.5,
  //     -(textGeometry.boundingBox.max.y - 0.02) * 0.5,
  //     -(textGeometry.boundingBox.max.z - 0.03) * 0.5
  //   );
  textGeometry.center();

  // Material
  const material = new THREE.MeshMatcapMaterial();
  material.wireframe = false;
  material.matcap = matcapTexture;

  // Debug
  gui.add(material, "wireframe");

  const textMesh = new THREE.Mesh(textGeometry, material);
  scene.add(textMesh);

  console.time("donuts");

  // Render donuts
  const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45);

  for (let i = 0; i < 300; i++) {
    // Do not create new geometry and meterial for every render
    //   const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45);
    //   const donutMaterial = new THREE.MeshMatcapMaterial({
    //     matcap: matcapTexture,
    //   });
    const donut = new THREE.Mesh(donutGeometry, material);

    // Adjust position
    donut.position.x = (Math.random() - 0.5) * 10;
    donut.position.y = (Math.random() - 0.5) * 10;
    donut.position.z = (Math.random() - 0.5) * 10;

    // Adjust rotation
    donut.rotation.x = Math.random() * Math.PI;
    donut.rotation.y = Math.random() * Math.PI;
    donut.rotation.z = Math.random() * Math.PI;

    // Adjust scale
    const scale = Math.random();
    donut.scale.set(scale, scale, scale);

    scene.add(donut);
  }

  console.timeEnd("donuts");
});

/**
 * Object
 */
// const cube = new THREE.Mesh(
//   new THREE.BoxGeometry(1, 1, 1),
//   new THREE.MeshBasicMaterial()
// );

// scene.add(cube);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 2;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
