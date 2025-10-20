import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SubscriptionExpiryNotification } from "./components/SubscriptionExpiryNotification";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SubscriptionExpiryNotification />
  </>
);
