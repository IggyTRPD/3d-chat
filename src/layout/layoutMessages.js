const clampMin = (value, min) => (value < min ? min : value);

const estimateLineCount = (text, maxCharsPerLine) => {
  if (!text) return 1;
  const safeMax = clampMin(maxCharsPerLine, 1);
  return Math.max(1, Math.ceil(text.length / safeMax));
};

export const layoutMessages = (
  messages,
  config,
  scrollOffsetY,
  viewportHeight
) => {
  const {
    laneWidth,
    laneGap = 0,
    bubblePaddingY,
    lineHeight,
    maxCharsPerLine,
    itemSpacing,
    buffer = 0,
  } = config;

  const heights = messages.map((message) => {
    const lines = estimateLineCount(message.text, maxCharsPerLine);
    return bubblePaddingY * 2 + lines * lineHeight;
  });

  let totalHeight = 0;
  for (let i = 0; i < heights.length; i++) {
    totalHeight += heights[i];
    if (i < heights.length - 1) {
      totalHeight += itemSpacing;
    }
  }

  const items = [];
  let cursorY = totalHeight;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const height = heights[i];

    cursorY -= height / 2;
    const contentY = cursorY;
    cursorY -= height / 2 + itemSpacing;

    const x =
      message.side === "friend"
        ? -(laneGap / 2 + laneWidth / 2)
        : laneGap / 2 + laneWidth / 2;

    const y = contentY - scrollOffsetY;
    const top = y + height / 2;
    const bottom = y - height / 2;

    if (top < -buffer || bottom > viewportHeight + buffer) {
      continue;
    }

    items.push({
      id: message.id,
      side: message.side,
      x,
      y,
      w: laneWidth,
      h: height,
      text: message.text,
      status: message.status,
    });
  }

  return items;
};
