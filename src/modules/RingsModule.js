import * as THREE from "three";
import GUI from "lil-gui";

export class RingsModule {
  constructor() {
    this.group = new THREE.Group();
    this.donuts = [];
    this.donutVelocities = [];
    this.donutSpin = [];
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

    this.donutGeometry = new THREE.TorusGeometry(0.3, 0.18, 20, 45);
    const minRadius = 1.4;

    for (let i = 0; i < 520; i++) {
      const donut = new THREE.Mesh(this.donutGeometry, this.material);

      // Spread rings around the chat volume, leaving a small center pocket.
      let x = 0;
      let y = 0;
      let z = 0;
      let radius = 0;
      let attempts = 0;

      while (radius < minRadius && attempts < 20) {
        x = (Math.random() - 0.5) * 26;
        y = (Math.random() - 0.5) * 16;
        z = -(1.5 + Math.random() * 32);
        radius = Math.sqrt(x * x + y * y + z * z);
        attempts += 1;
      }

      donut.position.set(x, y, z);

      donut.rotation.x = Math.random() * Math.PI;
      donut.rotation.y = Math.random() * Math.PI;
      donut.rotation.z = Math.random() * Math.PI;

      const scale = 0.35 + Math.random() * 1.05;
      donut.scale.set(scale, scale, scale);

      this.donuts.push(donut);
      this.donutVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.06,
          (Math.random() - 0.5) * 0.06,
          (Math.random() - 0.5) * 0.06
        )
      );
      this.donutSpin.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        )
      );
      this.group.add(donut);
    }
  }

  handleKeyDown(event) {
    if (event.key !== "a") return;

    if (this.axesHelper.parent) {
      this.app.scene.remove(this.axesHelper);
      return;
    }

    this.app.scene.add(this.axesHelper);
  }

  update(deltaTime) {
    const boundsX = 13;
    const boundsY = 8;
    const minZ = -34;
    const maxZ = -1.2;

    for (let i = 0; i < this.donuts.length; i++) {
      const donut = this.donuts[i];
      const velocity = this.donutVelocities[i];
      const spin = this.donutSpin[i];

      donut.position.x += velocity.x * deltaTime;
      donut.position.y += velocity.y * deltaTime;
      donut.position.z += velocity.z * deltaTime;

      donut.rotation.x += spin.x * deltaTime;
      donut.rotation.y += spin.y * deltaTime;
      donut.rotation.z += spin.z * deltaTime;

      if (donut.position.x > boundsX) {
        donut.position.x = boundsX;
        velocity.x *= -1;
      } else if (donut.position.x < -boundsX) {
        donut.position.x = -boundsX;
        velocity.x *= -1;
      }

      if (donut.position.y > boundsY) {
        donut.position.y = boundsY;
        velocity.y *= -1;
      } else if (donut.position.y < -boundsY) {
        donut.position.y = -boundsY;
        velocity.y *= -1;
      }

      if (donut.position.z > maxZ) {
        donut.position.z = maxZ;
        velocity.z *= -1;
      } else if (donut.position.z < minZ) {
        donut.position.z = minZ;
        velocity.z *= -1;
      }
    }
  }

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

    for (const donut of this.donuts) {
      this.group.remove(donut);
    }
    this.donuts.length = 0;
    this.donutVelocities.length = 0;
    this.donutSpin.length = 0;

    if (this.app && this.group.parent) {
      this.app.scene.remove(this.group);
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
