import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { sceneConfig } from "../config/sceneConfig.js";

export class SceneApp {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.modules = [];
    this.isRunning = false;
    this.config = sceneConfig;

    this.scene.fog = new THREE.Fog(
      0x000000,
      this.config.fogNear,
      this.config.fogFar
    );

    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    };

    this.camera = new THREE.PerspectiveCamera(
      this.config.cameraFov,
      this.sizes.width / this.sizes.height,
      this.config.cameraNear,
      this.config.cameraFar
    );
    this.camera.position.set(0, 0, 2);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.enabled = this.config.controlsEnabled;

    this.clock = new THREE.Clock();
    this.parallaxTarget = new THREE.Vector2(0, 0);
    this.parallaxOffset = new THREE.Vector2(0, 0);

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.tick = this.tick.bind(this);

    window.addEventListener("resize", this.handleResize);
    window.addEventListener("pointermove", this.handlePointerMove);
    this.updateCameraFraming();
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
    this.updateCameraFraming();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
  }

  tick() {
    if (!this.isRunning) return;

    const deltaTime = this.clock.getDelta();

    if (this.controls.enabled) {
      this.controls.update();
    }
    if (this.config.parallaxEnabled) {
      this.parallaxOffset.lerp(this.parallaxTarget, this.config.parallaxLerp);
      this.camera.position.x = this.parallaxOffset.x;
      this.camera.position.y = this.parallaxOffset.y;
      this.camera.position.z = this.baseCameraZ;
      this.camera.lookAt(0, 0, 0);
    }

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
    window.removeEventListener("pointermove", this.handlePointerMove);

    for (const module of this.modules) {
      if (module.dispose) {
        module.dispose();
      }
    }
    this.modules.length = 0;

    this.controls.dispose();
    this.renderer.dispose();
  }

  updateCameraFraming() {
    const targetHeight = this.config.chatPanelHeight;
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const distance = targetHeight / (2 * Math.tan(fovRad / 2));
    this.baseCameraZ = distance + this.config.cameraOffsetZ;
    this.camera.position.set(0, 0, this.baseCameraZ);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
  }

  handlePointerMove(event) {
    if (!this.config.parallaxEnabled) return;
    const nx = (event.clientX / this.sizes.width) * 2 - 1;
    const ny = (event.clientY / this.sizes.height) * 2 - 1;
    this.parallaxTarget.set(
      nx * this.config.parallaxStrength,
      -ny * this.config.parallaxStrength
    );
  }
}
