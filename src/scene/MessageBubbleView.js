import * as THREE from "three";
import { Text } from "troika-three-text";

const STATUS_COLORS = {
  sent: "#2f3338",
  sending: "#3a4b6a",
  failed: "#5a2a2a",
};

export class MessageBubbleView {
  constructor(item, config) {
    this.item = item;
    this.config = config;
    this.status = item.status;
    this.group = new THREE.Group();

    this.backgroundGeometry = new THREE.PlaneGeometry(1, 1);
    this.backgroundMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(STATUS_COLORS[item.status] || STATUS_COLORS.sent),
      transparent: true,
      opacity: 0,
    });
    this.backgroundMesh = new THREE.Mesh(
      this.backgroundGeometry,
      this.backgroundMaterial
    );
    this.group.add(this.backgroundMesh);

    this.textMesh = new Text();
    this.textMesh.fontSize = this.config.lineHeight;
    this.textMesh.color = "#e8edf2";
    this.textMesh.anchorY = "top";
    this.textMesh.textAlign = "left";
    this.textMesh.position.z = 0.01;
    this.group.add(this.textMesh);

    this.statusText = new Text();
    this.statusText.fontSize = this.config.lineHeight * 0.7;
    this.statusText.color = "rgba(232, 237, 242, 0.7)";
    this.statusText.anchorY = "bottom";
    this.statusText.textAlign = "left";
    this.statusText.position.z = 0.01;
    this.group.add(this.statusText);

    this.opacity = 0;
    this.scale = 0.9;
    this.group.scale.setScalar(this.scale);

    this.setLayout(item);
    this.setStatus(item.status);
  }

  setLayout(item) {
    this.item = item;

    this.group.position.set(item.x, item.y, 0);
    this.backgroundMesh.scale.set(item.w, item.h, 1);

    const paddingX = this.config.bubblePaddingX;
    const paddingY = this.config.bubblePaddingY;
    const maxWidth = item.w - paddingX * 2;

    this.textMesh.text = item.text;
    this.textMesh.maxWidth = Math.max(0.1, maxWidth);
    this.textMesh.textAlign = item.side === "friend" ? "left" : "right";
    this.textMesh.anchorX = item.side === "friend" ? "left" : "right";
    this.textMesh.position.x =
      item.side === "friend"
        ? -item.w / 2 + paddingX
        : item.w / 2 - paddingX;
    this.textMesh.position.y = item.h / 2 - paddingY;
    this.textMesh.sync();

    const statusText =
      item.status === "sending"
        ? "sending..."
        : item.status === "failed"
        ? "failed"
        : "";
    this.statusText.text = statusText;
    this.statusText.visible = Boolean(statusText);
    this.statusText.maxWidth = Math.max(0.1, maxWidth);
    this.statusText.textAlign = item.side === "friend" ? "left" : "right";
    this.statusText.anchorX = item.side === "friend" ? "left" : "right";
    this.statusText.position.x =
      item.side === "friend"
        ? -item.w / 2 + paddingX
        : item.w / 2 - paddingX;
    this.statusText.position.y = -item.h / 2 + paddingY;
    this.statusText.sync();
  }

  setStatus(status) {
    if (this.status === status) return;
    this.status = status;
    this.backgroundMaterial.color.set(
      STATUS_COLORS[status] || STATUS_COLORS.sent
    );
  }

  update(deltaTime) {
    const targetOpacity = 1;
    const targetScale = 1;

    const opacityDelta = 6 * deltaTime;
    const scaleDelta = 6 * deltaTime;

    this.opacity += (targetOpacity - this.opacity) * opacityDelta;
    this.scale += (targetScale - this.scale) * scaleDelta;

    this.backgroundMaterial.opacity = this.opacity;
    if (this.textMesh.material) {
      this.textMesh.material.transparent = true;
      this.textMesh.material.opacity = this.opacity;
    }
    if (this.statusText.material) {
      this.statusText.material.transparent = true;
      this.statusText.material.opacity = this.opacity;
    }
    this.group.scale.setScalar(this.scale);
  }

  dispose() {
    this.backgroundGeometry.dispose();
    this.backgroundMaterial.dispose();
    this.textMesh.dispose();
    this.statusText.dispose();
  }
}
