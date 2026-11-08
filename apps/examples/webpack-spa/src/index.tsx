import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Relay Webpack 5 React SPA</h1>
      <p>Proxied via Relay Reverse Gateway</p>
      <div id="hmr-status">HMR Active</div>
    </main>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
