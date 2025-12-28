import { layoutMessages } from "../layout/layoutMessages.js";
import { chatConfig } from "../config/chatConfig.js";
import { ChatBoard } from "../scene/ChatBoard.js";
import * as THREE from "three";

const estimateLineCount = (text, maxCharsPerLine) => {
  const safeMax = Math.max(1, maxCharsPerLine);
  if (!text) return 1;
  const words = text.trim().split(/\s+/);
  let lines = 1;
  let lineLength = 0;

  for (const word of words) {
    const wordLength = word.length;
    if (lineLength === 0) {
      lineLength = wordLength;
      continue;
    }

    if (lineLength + 1 + wordLength <= safeMax) {
      lineLength += 1 + wordLength;
    } else {
      lines += 1;
      lineLength = wordLength;
    }
  }

  return Math.max(1, lines);
};

const estimateTotalHeight = (messages, config, heightOverrides) => {
  let total = 0;
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const override =
      heightOverrides && heightOverrides.has(message.id)
        ? heightOverrides.get(message.id)
        : null;
    if (override) {
      total += override;
    } else {
      const lines = estimateLineCount(message.text, config.maxCharsPerLine);
      total += config.bubblePaddingY * 2 + lines * config.lineHeight;
    }
    if (i < messages.length - 1) {
      total += config.itemSpacing;
    }
  }
  return total;
};

export class ChatModule {
  constructor(store, config = chatConfig, options = {}) {
    this.store = store;
    this.config = config;
    this.ringsModule = options.ringsModule || null;
    this.scrollOffsetY = 0;
    this.needsLayout = true;
    this.heightOverrides = new Map();
    this.maxScroll = 0;
    this.stickToBottom = true;
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.selectedId = null;

    this.handleWheel = this.handleWheel.bind(this);
    this.handleMeasure = this.handleMeasure.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
  }

  init(app) {
    this.app = app;
    this.chatBoard = new ChatBoard(this.config, this.handleMeasure);
    this.chatBoard.group.position.set(
      this.config.panelPosition.x,
      this.config.panelPosition.y,
      this.config.panelPosition.z
    );
    this.app.scene.add(this.chatBoard.group);

    this.unsubscribe = this.store.subscribe((event) => {
      this.stickToBottom = this.scrollOffsetY <= 0.001;
      this.needsLayout = true;
      if (event && event.type === "message:added") {
        this.triggerPulse();
      } else if (event && event.type === "message:updated") {
        this.chatBoard.updateStatus(event.message.id, event.message.status);
      }
    });

    window.addEventListener("wheel", this.handleWheel, { passive: true });
    window.addEventListener("pointerdown", this.handlePointerDown);
  }

  handleWheel(event) {
    this.scrollOffsetY -= event.deltaY * this.config.scrollSpeed;
    this.updateScrollBounds();
    this.scrollOffsetY = Math.min(
      Math.max(0, this.scrollOffsetY),
      this.maxScroll
    );
    this.stickToBottom = this.scrollOffsetY <= 0.001;
    this.needsLayout = true;
  }

  update(deltaTime) {
    if (this.needsLayout) {
      if (this.stickToBottom) {
        this.scrollOffsetY = 0;
      }
      this.updateScrollBounds();
      if (!this.stickToBottom) {
        this.scrollOffsetY = Math.min(
          Math.max(0, this.scrollOffsetY),
          this.maxScroll
        );
      }
      const items = layoutMessages(
        this.store.getMessages(),
        this.config,
        this.scrollOffsetY,
        this.config.viewportHeight,
        this.heightOverrides
      );
      this.chatBoard.update(items);
      this.needsLayout = false;
    }

    this.chatBoard.updateViews(deltaTime);
  }

  dispose() {
    window.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("pointerdown", this.handlePointerDown);
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.chatBoard) {
      this.app.scene.remove(this.chatBoard.group);
      this.chatBoard.dispose();
    }
  }

  handleMeasure(id, height) {
    if (!id || !height) return;
    const current = this.heightOverrides.get(id);
    if (!current || Math.abs(current - height) > 0.02) {
      this.heightOverrides.set(id, height);
      this.needsLayout = true;
    }
  }

  triggerPulse() {
    if (this.ringsModule && this.ringsModule.triggerPulse) {
      this.ringsModule.triggerPulse();
    }
  }

  handlePointerDown(event) {
    if (!this.app || !this.chatBoard) return;
    const rect = this.app.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.app.camera);
    const meshes = [];
    for (const view of this.chatBoard.views.values()) {
      meshes.push(view.backgroundMesh);
    }
    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) {
      this.chatBoard.setSelected(null);
      this.selectedId = null;
      return;
    }
    const hit = hits[0];
    const messageId = hit.object.userData.messageId;
    if (!messageId) return;
    this.selectedId = messageId;
    this.chatBoard.setSelected(messageId);
    const message = this.store
      .getMessages()
      .find((item) => item.id === messageId);
    if (message && message.text) {
      this.copyToClipboard(message.text);
    }
  }

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } catch (_) {
      // Ignore copy failures.
    }
    textarea.remove();
  }

  updateScrollBounds() {
    const totalHeight = estimateTotalHeight(
      this.store.getMessages(),
      this.config,
      this.heightOverrides
    );
    const effectiveHeight =
      this.config.viewportHeight -
      (this.config.viewportPaddingTop || 0) -
      (this.config.viewportPaddingBottom || 0);
    this.maxScroll = Math.max(0, totalHeight - effectiveHeight);
  }
}
