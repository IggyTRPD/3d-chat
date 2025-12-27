import { layoutMessages } from "../layout/layoutMessages.js";
import { chatConfig } from "../config/chatConfig.js";
import { ChatBoard } from "../scene/ChatBoard.js";

const estimateLineCount = (text, maxCharsPerLine) => {
  const safeMax = Math.max(1, maxCharsPerLine);
  return Math.max(1, Math.ceil((text || "").length / safeMax));
};

const estimateTotalHeight = (messages, config) => {
  let total = 0;
  for (let i = 0; i < messages.length; i++) {
    const lines = estimateLineCount(messages[i].text, config.maxCharsPerLine);
    total += config.bubblePaddingY * 2 + lines * config.lineHeight;
    if (i < messages.length - 1) {
      total += config.itemSpacing;
    }
  }
  return total;
};

export class ChatModule {
  constructor(store, config = chatConfig) {
    this.store = store;
    this.config = config;
    this.scrollOffsetY = 0;
    this.needsLayout = true;

    this.handleWheel = this.handleWheel.bind(this);
  }

  init(app) {
    this.app = app;
    this.chatBoard = new ChatBoard(this.config);
    this.chatBoard.group.position.set(
      this.config.panelPosition.x,
      this.config.panelPosition.y,
      this.config.panelPosition.z
    );
    this.app.scene.add(this.chatBoard.group);

    this.unsubscribe = this.store.subscribe(() => {
      this.needsLayout = true;
    });

    window.addEventListener("wheel", this.handleWheel, { passive: true });
  }

  handleWheel(event) {
    this.scrollOffsetY += event.deltaY * this.config.scrollSpeed;
    const totalHeight = estimateTotalHeight(
      this.store.getMessages(),
      this.config
    );
    const maxScroll = Math.max(0, totalHeight - this.config.viewportHeight);
    this.scrollOffsetY = Math.min(Math.max(0, this.scrollOffsetY), maxScroll);
    this.needsLayout = true;
  }

  update(deltaTime) {
    if (this.needsLayout) {
      const items = layoutMessages(
        this.store.getMessages(),
        this.config,
        this.scrollOffsetY,
        this.config.viewportHeight
      );
      this.chatBoard.update(items);
      this.needsLayout = false;
    }

    this.chatBoard.updateViews(deltaTime);
  }

  dispose() {
    window.removeEventListener("wheel", this.handleWheel);
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.chatBoard) {
      this.app.scene.remove(this.chatBoard.group);
      this.chatBoard.dispose();
    }
  }
}
