import { MESSAGE_SIDE, MESSAGE_STATUS } from "./types.js";

let nextId = 1;

const createId = (prefix) => `${prefix}-${Date.now()}-${nextId++}`;

export const createChatStore = () => {
  const messages = [];
  const listeners = new Set();

  const emit = (event) => {
    for (const listener of listeners) {
      listener(event, messages);
    }
  };

  const send = (text) => {
    const clientId = createId("client");
    const message = {
      id: clientId,
      clientId,
      authorId: "me",
      side: MESSAGE_SIDE.me,
      text,
      timestamp: Date.now(),
      status: MESSAGE_STATUS.sending,
    };
    messages.push(message);
    emit({ type: "message:added", message });
    return message;
  };

  const receive = (text) => {
    const message = {
      id: createId("server"),
      authorId: "friend",
      side: MESSAGE_SIDE.friend,
      text,
      timestamp: Date.now(),
      status: MESSAGE_STATUS.sent,
    };
    messages.push(message);
    emit({ type: "message:added", message });
    return message;
  };

  const ack = (clientId, serverId, timestamp) => {
    const message = messages.find((item) => item.clientId === clientId);
    if (!message) return null;

    message.id = serverId || message.id;
    message.timestamp = timestamp || message.timestamp;
    message.status = MESSAGE_STATUS.sent;

    emit({ type: "message:updated", message });
    return message;
  };

  const fail = (clientId) => {
    const message = messages.find((item) => item.clientId === clientId);
    if (!message) return null;

    message.status = MESSAGE_STATUS.failed;
    emit({ type: "message:updated", message });
    return message;
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    getMessages: () => messages,
    send,
    receive,
    ack,
    fail,
    subscribe,
  };
};
