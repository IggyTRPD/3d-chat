/**
 * Transport interface (1:1 MVP).
 *
 * Methods:
 * - start()
 * - stop()
 * - send(text, clientId)
 * - on(event, handler)
 * - off(event, handler)
 *
 * Events:
 * - "receive": (text) => void
 * - "ack": (clientId, serverId, timestamp) => void
 * - "fail": (clientId) => void
 */
export const TransportEvents = {
  receive: "receive",
  ack: "ack",
  fail: "fail",
};
