import { describe, expect, it, vi } from "vitest";
import { MockTransport } from "./mockTransport.js";
import { TransportEvents } from "./transport.js";

describe("MockTransport", () => {
  it("emits receive messages on interval", () => {
    vi.useFakeTimers();
    const transport = new MockTransport({ minDelay: 10, maxDelay: 10 });
    const received = [];
    transport.on(TransportEvents.receive, (text) => received.push(text));

    transport.start();
    vi.advanceTimersByTime(4201);

    expect(received.length).toBe(1);
    transport.stop();
    vi.useRealTimers();
  });

  it("emits ack for successful send", () => {
    vi.useFakeTimers();
    const transport = new MockTransport({ minDelay: 10, maxDelay: 10 });
    const events = [];
    transport.on(TransportEvents.ack, (clientId, serverId) => {
      events.push([clientId, serverId]);
    });

    const randomSpy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.5) // delay calc
      .mockReturnValueOnce(0.9); // fail check

    transport.send("hello", "client-1");
    vi.advanceTimersByTime(11);

    expect(events.length).toBe(1);
    expect(events[0][0]).toBe("client-1");

    randomSpy.mockRestore();
    vi.useRealTimers();
  });

  it("emits fail when random < failRate", () => {
    vi.useFakeTimers();
    const transport = new MockTransport({ minDelay: 10, maxDelay: 10, failRate: 0.5 });
    const fails = [];
    transport.on(TransportEvents.fail, (clientId) => fails.push(clientId));

    const randomSpy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.5) // delay calc
      .mockReturnValueOnce(0.1); // fail check

    transport.send("hello", "client-2");
    vi.advanceTimersByTime(11);

    expect(fails).toEqual(["client-2"]);

    randomSpy.mockRestore();
    vi.useRealTimers();
  });
});
