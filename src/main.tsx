import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/theme-transitions.css";
import "./styles/theme-animations.css";
import "./styles/theme-premium.css";

// Após um deploy, chunks antigos deixam de existir no servidor e a
// navegação para uma rota lazy falha ("Failed to fetch dynamically
// imported module"). O Vite emite vite:preloadError nesse caso —
// recarregamos uma única vez para buscar a versão nova do app.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const key = "chunk-reload-at";
  const last = Number(sessionStorage.getItem(key) || 0);
  // Evita loop de reload caso o problema não seja de versão
  if (Date.now() - last > 10_000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
