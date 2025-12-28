import * as THREE from "three";
import { Text } from "troika-three-text";

const STATUS_COLORS = {
  sending: "#2f3953",
  failed: "#5a2a2a",
};

const SIDE_COLORS = {
  friend: "#1e2124ff",
  me: "#6691bcff",
};

export class MessageBubbleView {
  constructor(item, config, onMeasure) {
    this.item = item;
    this.config = config;
    this.status = item.status;
    this.onMeasure = onMeasure;
    this.group = new THREE.Group();
    this.measuredTextHeight = 0;
    this.measuredStatusHeight = 0;
    this.isSelected = false;
    this.basePosition = new THREE.Vector3();
    this.shakeTime = 0;
    this.shakePhase = Math.random() * Math.PI * 2;

    this.backgroundCanvas = document.createElement("canvas");
    this.backgroundContext = this.backgroundCanvas.getContext("2d");
    this.backgroundTexture = new THREE.CanvasTexture(this.backgroundCanvas);
    this.backgroundGeometry = new THREE.PlaneGeometry(1, 1);
    this.backgroundMaterial = new THREE.MeshBasicMaterial({
      map: this.backgroundTexture,
      transparent: true,
      opacity: 0,
    });
    this.backgroundMesh = new THREE.Mesh(
      this.backgroundGeometry,
      this.backgroundMaterial
    );
    this.backgroundMesh.userData.messageId = item.id;
    this.group.add(this.backgroundMesh);

    this.textMesh = new Text();
    this.textMesh.fontSize = this.config.lineHeight;
    this.textMesh.lineHeight = 1;
    this.textMesh.color = "#e8edf2";
    this.textMesh.anchorY = "top";
    this.textMesh.textAlign = "left";
    this.textMesh.position.z = 0.01;
    this.group.add(this.textMesh);

    this.statusText = new Text();
    this.statusText.fontSize = this.config.lineHeight * 0.7;
    this.statusText.lineHeight = 1;
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

    this.basePosition.set(item.x, item.y, 0);
    this.group.position.copy(this.basePosition);
    this.backgroundMesh.scale.set(item.w, item.h, 1);

    this.updateBackgroundTexture();

    const paddingX = this.config.bubblePaddingX;
    const paddingY = this.config.bubblePaddingY;
    const maxWidth = item.w - paddingX * 2;

    this.textMesh.text = item.text;
    this.textMesh.maxWidth = Math.max(0.1, maxWidth);
    this.textMesh.textAlign = item.side === "friend" ? "left" : "right";
    this.textMesh.anchorX = item.side === "friend" ? "left" : "right";
    this.textMesh.position.x =
      item.side === "friend" ? -item.w / 2 + paddingX : item.w / 2 - paddingX;
    this.textMesh.position.y = item.h / 2 - paddingY;
    this.textMesh.sync(() => {
      const info = this.textMesh.textRenderInfo;
      if (info && info.blockBounds) {
        this.measuredTextHeight = info.blockBounds[3] - info.blockBounds[1];
        this.reportMeasuredHeight();
      }
    });

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
      item.side === "friend" ? -item.w / 2 + paddingX : item.w / 2 - paddingX;
    this.statusText.position.y = -item.h / 2 + paddingY;
    this.statusText.sync(() => {
      const info = this.statusText.textRenderInfo;
      this.measuredStatusHeight =
        info && info.blockBounds
          ? info.blockBounds[3] - info.blockBounds[1]
          : 0;
      this.reportMeasuredHeight();
    });
  }

  setStatus(status) {
    if (this.status === status) return;
    this.status = status;
    if (status === "failed") {
      this.shakeTime = 0.5;
    }
    this.updateBackgroundTexture();
  }

  setSelected(isSelected) {
    if (this.isSelected === isSelected) return;
    this.isSelected = isSelected;
    this.updateBackgroundTexture();
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

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - deltaTime);
      const intensity = (this.shakeTime / 0.5) * 0.04;
      const offsetX = Math.sin(this.shakePhase + this.shakeTime * 40) * intensity;
      const offsetY = Math.cos(this.shakePhase + this.shakeTime * 32) * intensity;
      this.group.position.set(
        this.basePosition.x + offsetX,
        this.basePosition.y + offsetY,
        this.basePosition.z
      );
    } else {
      this.group.position.copy(this.basePosition);
    }
  }

  dispose() {
    this.backgroundGeometry.dispose();
    this.backgroundMaterial.dispose();
    this.backgroundTexture.dispose();
    this.textMesh.dispose();
    this.statusText.dispose();
  }

  reportMeasuredHeight() {
    if (!this.onMeasure) return;
    const statusGap = this.statusText.text
      ? this.config.bubblePaddingY * 0.6
      : 0;
    const measuredHeight =
      this.measuredTextHeight +
      this.measuredStatusHeight +
      this.config.bubblePaddingY * 2 +
      statusGap;
    if (measuredHeight > 0) {
      this.onMeasure(this.item.id, measuredHeight);
    }
  }

  updateBackgroundTexture() {
    const pixelsPerUnit = 220;
    const widthPx = Math.max(1, Math.floor(this.item.w * pixelsPerUnit));
    const heightPx = Math.max(1, Math.floor(this.item.h * pixelsPerUnit));
    if (
      this.backgroundCanvas.width !== widthPx ||
      this.backgroundCanvas.height !== heightPx
    ) {
      this.backgroundCanvas.width = widthPx;
      this.backgroundCanvas.height = heightPx;
    }

    const ctx = this.backgroundContext;
    ctx.clearRect(0, 0, widthPx, heightPx);

    const radius = Math.min(
      this.config.bubbleRadius * pixelsPerUnit,
      widthPx / 2,
      heightPx / 2
    );
    const baseColor = SIDE_COLORS[this.item.side] || SIDE_COLORS.friend;
    const color = STATUS_COLORS[this.status] || baseColor;

    ctx.globalAlpha = this.config.bubbleOpacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(widthPx - radius, 0);
    ctx.quadraticCurveTo(widthPx, 0, widthPx, radius);
    ctx.lineTo(widthPx, heightPx - radius);
    ctx.quadraticCurveTo(widthPx, heightPx, widthPx - radius, heightPx);
    ctx.lineTo(radius, heightPx);
    ctx.quadraticCurveTo(0, heightPx, 0, heightPx - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    if (this.isSelected) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(232, 237, 242, 0.7)";
      ctx.lineWidth = Math.max(2, pixelsPerUnit * 0.01);
      ctx.beginPath();
      ctx.moveTo(radius, ctx.lineWidth / 2);
      ctx.lineTo(widthPx - radius, ctx.lineWidth / 2);
      ctx.quadraticCurveTo(
        widthPx - ctx.lineWidth / 2,
        ctx.lineWidth / 2,
        widthPx - ctx.lineWidth / 2,
        radius
      );
      ctx.lineTo(widthPx - ctx.lineWidth / 2, heightPx - radius);
      ctx.quadraticCurveTo(
        widthPx - ctx.lineWidth / 2,
        heightPx - ctx.lineWidth / 2,
        widthPx - radius,
        heightPx - ctx.lineWidth / 2
      );
      ctx.lineTo(radius, heightPx - ctx.lineWidth / 2);
      ctx.quadraticCurveTo(
        ctx.lineWidth / 2,
        heightPx - ctx.lineWidth / 2,
        ctx.lineWidth / 2,
        heightPx - radius
      );
      ctx.lineTo(ctx.lineWidth / 2, radius);
      ctx.quadraticCurveTo(
        ctx.lineWidth / 2,
        ctx.lineWidth / 2,
        radius,
        ctx.lineWidth / 2
      );
      ctx.closePath();
      ctx.stroke();
    }

    this.backgroundTexture.needsUpdate = true;
  }
}
