import { SceneApp } from "./scene/SceneApp.js";
import { RingsModule } from "./modules/RingsModule.js";
import { ChatModule } from "./modules/ChatModule.js";
import { createChatStore } from "./chat/store.js";
import { MockTransport } from "./chat/mockTransport.js";
import { TransportEvents } from "./chat/transport.js";
import { createChatInput } from "./ui/chatInput.js";

const chatStore = createChatStore();
const transport = new MockTransport();
const chatInput = createChatInput(chatStore, transport);

const canvas = document.querySelector("canvas.webgl");

const app = new SceneApp({ canvas });
const ringsModule = new RingsModule();
app.addModule(ringsModule);
app.addModule(new ChatModule(chatStore, undefined, { ringsModule }));
app.start();

transport.on(TransportEvents.receive, (text) => chatStore.receive(text));
transport.on(TransportEvents.ack, (clientId, serverId, timestamp) =>
  chatStore.ack(clientId, serverId, timestamp)
);
transport.on(TransportEvents.fail, (clientId) => chatStore.fail(clientId));

chatStore.subscribe((event, messages) => {
  console.log(`[chat] ${event.type}`, event.message, "count", messages.length);
});

transport.start();
chatInput.mount();

if (import.meta.env.DEV) {
  const demo = chatStore.send("Demo outgoing message...");
  transport.send(demo.text, demo.clientId);
}

window.chatStore = chatStore;
window.chatTransport = transport;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    chatInput.dispose();
    transport.stop();
    app.dispose();
  });
}
