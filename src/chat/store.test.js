import { describe, expect, it } from "vitest";
import { createChatStore } from "./store.js";
import { MESSAGE_SIDE, MESSAGE_STATUS } from "./types.js";

describe("chat store", () => {
  it("creates outgoing messages and updates status", () => {
    const store = createChatStore();
    const outgoing = store.send("Hello");

    expect(outgoing.status).toBe(MESSAGE_STATUS.sending);
    expect(outgoing.side).toBe(MESSAGE_SIDE.me);
    expect(store.getMessages()).toHaveLength(1);

    store.ack(outgoing.clientId, "server-1", 123);
    expect(store.getMessages()[0].status).toBe(MESSAGE_STATUS.sent);
    expect(store.getMessages()[0].id).toBe("server-1");

    store.fail(outgoing.clientId);
    expect(store.getMessages()[0].status).toBe(MESSAGE_STATUS.failed);
  });

  it("receives incoming messages and emits events", () => {
    const store = createChatStore();
    const events = [];
    store.subscribe((event) => events.push(event.type));

    const incoming = store.receive("Hi there");
    expect(incoming.status).toBe(MESSAGE_STATUS.sent);
    expect(incoming.side).toBe(MESSAGE_SIDE.friend);
    expect(events).toContain("message:added");
  });
});
