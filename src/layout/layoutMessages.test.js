import { describe, expect, it } from "vitest";
import { layoutMessages } from "./layoutMessages.js";

describe("layoutMessages", () => {
  it("positions items by lane and estimates heights", () => {
    const config = {
      laneWidth: 4,
      laneGap: 1,
      bubblePaddingY: 0.2,
      lineHeight: 0.3,
      maxCharsPerLine: 10,
      itemSpacing: 0.1,
      buffer: 0,
    };
    const messages = [
      { id: "1", side: "friend", text: "hello", status: "sent" },
      { id: "2", side: "me", text: "0123456789012", status: "sent" },
    ];

    const items = layoutMessages(messages, config, 0, 100);

    expect(items).toHaveLength(2);
    expect(items[0].x).toBeCloseTo(-(config.laneGap / 2 + config.laneWidth / 2));
    expect(items[1].x).toBeCloseTo(config.laneGap / 2 + config.laneWidth / 2);

    const firstHeight = config.bubblePaddingY * 2 + 1 * config.lineHeight;
    const secondHeight = config.bubblePaddingY * 2 + 2 * config.lineHeight;
    expect(items[0].h).toBeCloseTo(firstHeight);
    expect(items[1].h).toBeCloseTo(secondHeight);
  });

  it("virtualizes items outside the viewport", () => {
    const config = {
      laneWidth: 4,
      laneGap: 1,
      bubblePaddingY: 0.2,
      lineHeight: 0.3,
      maxCharsPerLine: 8,
      itemSpacing: 0.1,
      buffer: 0,
    };
    const messages = Array.from({ length: 40 }, (_, index) => ({
      id: `m${index}`,
      side: index % 2 === 0 ? "friend" : "me",
      text: "lorem ipsum",
      status: "sent",
    }));

    const items = layoutMessages(messages, config, 0, 2);

    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThan(messages.length);
  });
});
