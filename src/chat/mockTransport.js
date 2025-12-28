import { TransportEvents } from "./transport.js";

/**
 * Mock transport that simulates friend messages and async acks/failures.
 */
const FRIEND_MESSAGES = [
  "Hey! Can you see this?",
  "That's awesome! How does it look?",
  "Got it. I'll send another message...",
  "Sure thing!",
  "And here's another message to the left, but this one is a little bit longer in order to test the bubble behavior.",
  "Looks super cool!",
];

export class MockTransport {
  constructor({ minDelay = 700, maxDelay = 1600, failRate = 0.15 } = {}) {
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;
    this.failRate = failRate;
    this.friendIntervalId = null;

    this.listeners = new Map();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
  }

  off(event, handler) {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(handler);
  }

  emit(event, ...args) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      handler(...args);
    }
  }

  start() {
    if (this.friendIntervalId) return;

    this.friendIntervalId = window.setInterval(() => {
      const message =
        FRIEND_MESSAGES[Math.floor(Math.random() * FRIEND_MESSAGES.length)];
      this.emit(TransportEvents.receive, message);
    }, 4200);
  }

  stop() {
    if (!this.friendIntervalId) return;
    window.clearInterval(this.friendIntervalId);
    this.friendIntervalId = null;
  }

  send(text, clientId) {
    if (!clientId) return;

    const delay =
      this.minDelay + Math.random() * (this.maxDelay - this.minDelay);

    window.setTimeout(() => {
      if (Math.random() < this.failRate) {
        this.emit(TransportEvents.fail, clientId);
        return;
      }

      const serverId = `server-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;
      this.emit(TransportEvents.ack, clientId, serverId, Date.now());
    }, delay);
  }
}
