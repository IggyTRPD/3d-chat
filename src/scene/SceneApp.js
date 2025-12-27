import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneApp {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.modules = [];
    this.isRunning = false;

    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    };

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      100
    );
    this.camera.position.set(1, 1, 2);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;

    this.clock = new THREE.Clock();

    this.handleResize = this.handleResize.bind(this);
    this.tick = this.tick.bind(this);

    window.addEventListener("resize", this.handleResize);
  }

  addModule(module) {
    this.modules.push(module);
    if (module.init) {
      module.init(this);
    }
    return module;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick();
  }

  handleResize() {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;
    this.sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
  }

  tick() {
    if (!this.isRunning) return;

    const deltaTime = this.clock.getDelta();

    this.controls.update();

    for (const module of this.modules) {
      if (module.update) {
        module.update(deltaTime);
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.frameId = window.requestAnimationFrame(this.tick);
  }

  dispose() {
    this.isRunning = false;
    if (this.frameId) {
      window.cancelAnimationFrame(this.frameId);
    }

    window.removeEventListener("resize", this.handleResize);

    for (const module of this.modules) {
      if (module.dispose) {
        module.dispose();
      }
    }
    this.modules.length = 0;

    this.controls.dispose();
    this.renderer.dispose();
  }
}
