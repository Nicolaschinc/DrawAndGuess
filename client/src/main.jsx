import React from "react";
import { createRoot } from "react-dom/client";
import "./i18n"; // Initialize i18n
import App from "./App";
import "./global.scss";

// Expose app version to global window object
window.__APP_VERSION__ = __APP_VERSION__;
console.log(`Draw & Guess Client v${window.__APP_VERSION__}`);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
