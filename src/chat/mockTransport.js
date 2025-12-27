const FRIEND_MESSAGES = [
  "Hey! Can you see this?",
  "That's awesome! How does it look?",
  "Got it. I'll send another message...",
  "Sure thing!",
  "And here's another message to the left.",
  "Looks super cool!",
];

export class MockTransport {
  constructor({ minDelay = 700, maxDelay = 1600, failRate = 0.15 } = {}) {
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;
    this.failRate = failRate;
    this.friendIntervalId = null;

    this.onReceive = null;
    this.onAck = null;
    this.onFail = null;
  }

  start() {
    if (this.friendIntervalId) return;

    this.friendIntervalId = window.setInterval(() => {
      if (!this.onReceive) return;
      const message =
        FRIEND_MESSAGES[Math.floor(Math.random() * FRIEND_MESSAGES.length)];
      this.onReceive(message);
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
        if (this.onFail) {
          this.onFail(clientId);
        }
        return;
      }

      if (this.onAck) {
        const serverId = `server-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;
        this.onAck(clientId, serverId, Date.now());
      }
    }, delay);
  }
}
