import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import GUI from "lil-gui";

export class RingsModule {
  constructor() {
    this.group = new THREE.Group();
    this.donuts = [];
    this.isDisposed = false;

    this.axesHelper = new THREE.AxesHelper();
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  init(app) {
    this.app = app;
    this.app.scene.add(this.group);

    this.gui = new GUI();

    this.textureLoader = new THREE.TextureLoader();
    this.matcapTexture = this.textureLoader.load("/textures/matcaps/3.png");
    this.matcapTexture.colorSpace = THREE.SRGBColorSpace;

    this.material = new THREE.MeshMatcapMaterial({
      matcap: this.matcapTexture,
    });
    this.material.wireframe = false;

    this.gui.add(this.material, "wireframe");

    window.addEventListener("keydown", this.handleKeyDown);

    const fontLoader = new FontLoader();
    fontLoader.load("/fonts/helvetiker_regular.typeface.json", (font) => {
      if (this.isDisposed) return;

      this.textGeometry = new TextGeometry("227", {
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
      this.textGeometry.center();

      this.textMesh = new THREE.Mesh(this.textGeometry, this.material);
      this.group.add(this.textMesh);

      this.donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45);

      for (let i = 0; i < 300; i++) {
        const donut = new THREE.Mesh(this.donutGeometry, this.material);

        donut.position.x = (Math.random() - 0.5) * 10;
        donut.position.y = (Math.random() - 0.5) * 10;
        donut.position.z = (Math.random() - 0.5) * 10;

        donut.rotation.x = Math.random() * Math.PI;
        donut.rotation.y = Math.random() * Math.PI;
        donut.rotation.z = Math.random() * Math.PI;

        const scale = Math.random();
        donut.scale.set(scale, scale, scale);

        this.donuts.push(donut);
        this.group.add(donut);
      }
    });
  }

  handleKeyDown(event) {
    if (event.key !== "a") return;

    if (this.axesHelper.parent) {
      this.app.scene.remove(this.axesHelper);
      return;
    }

    this.app.scene.add(this.axesHelper);
  }

  update() {}

  dispose() {
    this.isDisposed = true;

    window.removeEventListener("keydown", this.handleKeyDown);

    if (this.gui) {
      this.gui.destroy();
      this.gui = null;
    }

    if (this.axesHelper.parent) {
      this.app.scene.remove(this.axesHelper);
    }
    this.axesHelper.dispose();

    if (this.textMesh) {
      this.group.remove(this.textMesh);
      this.textMesh = null;
    }

    for (const donut of this.donuts) {
      this.group.remove(donut);
    }
    this.donuts.length = 0;

    if (this.app && this.group.parent) {
      this.app.scene.remove(this.group);
    }

    if (this.textGeometry) {
      this.textGeometry.dispose();
      this.textGeometry = null;
    }

    if (this.donutGeometry) {
      this.donutGeometry.dispose();
      this.donutGeometry = null;
    }

    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    if (this.matcapTexture) {
      this.matcapTexture.dispose();
      this.matcapTexture = null;
    }
  }
}
