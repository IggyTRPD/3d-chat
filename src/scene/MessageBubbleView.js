import * as THREE from "three";

const STATUS_COLORS = {
  sent: "#2f3338",
  sending: "#3a4b6a",
  failed: "#5a2a2a",
};

const wrapText = (ctx, text, maxWidth) => {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
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

    this.textCanvas = document.createElement("canvas");
    this.textContext = this.textCanvas.getContext("2d");
    this.textTexture = new THREE.CanvasTexture(this.textCanvas);
    this.textMaterial = new THREE.MeshBasicMaterial({
      map: this.textTexture,
      transparent: true,
      opacity: 0,
    });
    this.textMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      this.textMaterial
    );
    this.textMesh.position.z = 0.01;
    this.group.add(this.textMesh);

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

    this.textMesh.scale.set(item.w, item.h, 1);

    const pixelsPerUnit = this.config.textPixelsPerUnit;
    const widthPx = Math.max(1, Math.floor(item.w * pixelsPerUnit));
    const heightPx = Math.max(1, Math.floor(item.h * pixelsPerUnit));

    if (this.textCanvas.width !== widthPx || this.textCanvas.height !== heightPx) {
      this.textCanvas.width = widthPx;
      this.textCanvas.height = heightPx;
    }

    const ctx = this.textContext;
    ctx.clearRect(0, 0, widthPx, heightPx);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, widthPx, heightPx);

    const paddingX = this.config.bubblePaddingX * pixelsPerUnit;
    const paddingY = this.config.bubblePaddingY * pixelsPerUnit;
    const fontSize = Math.max(10, this.config.lineHeight * pixelsPerUnit);
    ctx.font = `${fontSize}px Arial`;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#e8edf2";
    ctx.textAlign = item.side === "friend" ? "left" : "right";

    const maxWidth = widthPx - paddingX * 2;
    const lines = wrapText(ctx, item.text, maxWidth);

    let cursorY = paddingY;
    for (const line of lines) {
      const x = item.side === "friend" ? paddingX : widthPx - paddingX;
      ctx.fillText(line, x, cursorY);
      cursorY += fontSize;
    }

    if (item.status !== "sent") {
      ctx.font = `${Math.max(9, fontSize * 0.7)}px Arial`;
      ctx.fillStyle = "rgba(232, 237, 242, 0.7)";
      const statusText = item.status === "sending" ? "sending..." : "failed";
      const x = item.side === "friend" ? paddingX : widthPx - paddingX;
      ctx.fillText(statusText, x, heightPx - paddingY - fontSize * 0.8);
    }

    this.textTexture.needsUpdate = true;
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
    this.textMaterial.opacity = this.opacity;
    this.group.scale.setScalar(this.scale);
  }

  dispose() {
    this.backgroundGeometry.dispose();
    this.backgroundMaterial.dispose();
    this.textMesh.geometry.dispose();
    this.textMaterial.dispose();
    this.textTexture.dispose();
  }
}
