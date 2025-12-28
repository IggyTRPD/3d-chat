const clampMin = (value, min) => (value < min ? min : value);

const estimateLineCount = (text, maxCharsPerLine) => {
  if (!text) return 1;
  const safeMax = clampMin(maxCharsPerLine, 1);
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

export const layoutMessages = (
  messages,
  config,
  scrollOffsetY,
  viewportHeight,
  heightOverrides
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
    if (heightOverrides && heightOverrides.has(message.id)) {
      return heightOverrides.get(message.id);
    }
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

  const bottomEdge = -viewportHeight / 2;
  let cursorY = bottomEdge + totalHeight;

  const items = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const height = heights[i];

    cursorY -= height / 2;
    const contentY = cursorY;
    cursorY -= height / 2;
    if (i < messages.length - 1) {
      cursorY -= itemSpacing;
    }

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
