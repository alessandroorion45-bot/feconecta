import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/theme-transitions.css";
import "./styles/theme-animations.css";

createRoot(document.getElementById("root")!).render(<App />);
