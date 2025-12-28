export const createChatInput = (store, transport) => {
  const container = document.createElement("div");
  container.className = "chat-input";

  const input = document.createElement("input");
  input.className = "chat-input__field";
  input.type = "text";
  input.placeholder = "Type your message here...";
  input.autocomplete = "off";

  const button = document.createElement("button");
  button.className = "chat-input__button";
  button.type = "button";
  button.textContent = "Send";

  const sendMessage = () => {
    const text = input.value.trim();
    if (!text) return;
    const message = store.send(text);
    transport.send(message.text, message.clientId);
    input.value = "";
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    } else if (event.key === "Escape") {
      input.value = "";
      input.blur();
    }
  };

  const handleClick = () => {
    sendMessage();
    input.focus();
  };

  input.addEventListener("keydown", handleKeyDown);
  button.addEventListener("click", handleClick);

  container.appendChild(input);
  container.appendChild(button);

  const mount = (parent = document.body) => {
    parent.appendChild(container);
  };

  const dispose = () => {
    input.removeEventListener("keydown", handleKeyDown);
    button.removeEventListener("click", handleClick);
    container.remove();
  };

  return { mount, dispose };
};
