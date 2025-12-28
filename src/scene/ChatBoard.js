import * as THREE from "three";
import { MessageBubbleView } from "./MessageBubbleView.js";

export class ChatBoard {
  constructor(config, onMeasure) {
    this.config = config;
    this.onMeasure = onMeasure;
    this.group = new THREE.Group();
    this.views = new Map();
    this.selectId = null;
  }

  update(items) {
    const nextIds = new Set(items.map((item) => item.id));

    for (const [id, view] of this.views.entries()) {
      if (!nextIds.has(id)) {
        this.group.remove(view.group);
        view.dispose();
        this.views.delete(id);
      }
    }

    for (const item of items) {
      const existing = this.views.get(item.id);
      if (existing) {
        existing.setLayout(item);
        existing.setStatus(item.status);
        continue;
      }

      const view = new MessageBubbleView(item, this.config, this.onMeasure);
      view.setSelected(item.id === this.selectId);
      this.views.set(item.id, view);
      this.group.add(view.group);
    }
  }

  updateViews(deltaTime) {
    for (const view of this.views.values()) {
      view.update(deltaTime);
    }
  }

  setSelected(id) {
    if (this.selectId === id) return;
    const prev = this.views.get(this.selectId);
    if (prev) {
      prev.setSelected(false);
    }
    this.selectId = id;
    const next = this.views.get(id);
    if (next) {
      next.setSelected(true);
    }
  }

  dispose() {
    for (const view of this.views.values()) {
      this.group.remove(view.group);
      view.dispose();
    }
    this.views.clear();
  }
}
