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

// Quando um deploy novo sai, o service worker novo instala e assume na hora
// (skipWaiting + clientsClaim no sw.ts). Só que a aba já aberta continua
// rodando os chunks antigos — por isso era preciso recarregar DUAS vezes pra
// ver a correção. Aqui recarregamos uma única vez assim que a versão nova
// assume o controle, então a atualização aparece sozinha.
if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    // Na primeiríssima instalação não havia controlador — não precisa recarregar.
    if (!sessionStorage.getItem("sw-controlled")) {
      sessionStorage.setItem("sw-controlled", "1");
      return;
    }
    reloading = true;
    window.location.reload();
  });
  if (navigator.serviceWorker.controller) sessionStorage.setItem("sw-controlled", "1");

  // Alguns usuários ficavam presos numa versão antiga por dias: no celular o
  // app instalado quase nunca faz uma navegação nova, e é só nela que o
  // navegador reconsulta o service worker. Sem consulta, nunca descobre que
  // saiu deploy. Aqui forçamos a checagem quando o app volta ao foco e a cada
  // 15 min — achando versão nova, ela assume e o listener acima recarrega.
  navigator.serviceWorker.ready.then((reg) => {
    const check = () => {
      if (document.visibilityState === "visible") reg.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    setInterval(check, 15 * 60 * 1000);
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
