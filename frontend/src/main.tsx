import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { WalletContext } from "./context/WalletContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletContext>
      <App />
    </WalletContext>
  </React.StrictMode>
);
