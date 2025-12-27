import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { SettingsProvider } from "./hooks/useSettings";
import { LoadingProvider } from "./hooks/LoadingContext";

const container = document.getElementById("root");
if (!container) throw new Error("Root container element with id 'root' not found");
const root = ReactDOM.createRoot(container);
root.render(
    <React.StrictMode>
        <HashRouter>
            <LoadingProvider>
                <AuthProvider>
                    <SettingsProvider>
                        <App />
                    </SettingsProvider>
                </AuthProvider>
            </LoadingProvider>
        </HashRouter>
    </React.StrictMode>
);
