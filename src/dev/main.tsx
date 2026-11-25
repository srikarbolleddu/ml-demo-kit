import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";
import { createHttpClient, ExplorePanel, TabularDemo } from "../index";
import { fixtureClient } from "../test/fixtureClient";

// Playground: fixture data by default; `?api=http://localhost:8010/api/v1` for a live service.
function App() {
  const api = new URLSearchParams(window.location.search).get("api");
  const client = useMemo(() => (api ? createHttpClient(api) : fixtureClient(400)), [api]);
  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "2rem auto",
        padding: "0 1rem",
        display: "grid",
        gap: "2rem",
      }}
    >
      <p style={{ fontFamily: "system-ui", fontSize: 13 }}>
        Source: <code>{api ?? "fixtures/purchase.json"}</code>
      </p>
      <TabularDemo client={client} />
      <ExplorePanel client={client} />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
