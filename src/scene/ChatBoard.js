import * as THREE from "three";
import { MessageBubbleView } from "./MessageBubbleView.js";

export class ChatBoard {
  constructor(config) {
    this.config = config;
    this.group = new THREE.Group();
    this.views = new Map();
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

      const view = new MessageBubbleView(item, this.config);
      this.views.set(item.id, view);
      this.group.add(view.group);
    }
  }

  updateViews(deltaTime) {
    for (const view of this.views.values()) {
      view.update(deltaTime);
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
