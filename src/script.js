import { SceneApp } from "./scene/SceneApp.js";
import { RingsModule } from "./modules/RingsModule.js";

const canvas = document.querySelector("canvas.webgl");

const app = new SceneApp({ canvas });
app.addModule(new RingsModule());
app.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.dispose();
  });
}
