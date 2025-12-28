import { layoutMessages } from "../layout/layoutMessages.js";
import { chatConfig } from "../config/chatConfig.js";
import { ChatBoard } from "../scene/ChatBoard.js";

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
  constructor(store, config = chatConfig) {
    this.store = store;
    this.config = config;
    this.scrollOffsetY = 0;
    this.needsLayout = true;
    this.heightOverrides = new Map();
    this.maxScroll = 0;
    this.stickToBottom = true;

    this.handleWheel = this.handleWheel.bind(this);
    this.handleMeasure = this.handleMeasure.bind(this);
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

    this.unsubscribe = this.store.subscribe(() => {
      this.stickToBottom = this.scrollOffsetY <= 0.001;
      this.needsLayout = true;
    });

    window.addEventListener("wheel", this.handleWheel, { passive: true });
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

  updateScrollBounds() {
    const totalHeight = estimateTotalHeight(
      this.store.getMessages(),
      this.config,
      this.heightOverrides
    );
    this.maxScroll = Math.max(0, totalHeight - this.config.viewportHeight);
  }
}
