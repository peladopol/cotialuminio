import "./styles.css";
import { mount } from "./lib/mount";

// Opción 2: modo Admin por URL
// - Cliente: http://localhost:5173
// - Admin:   http://localhost:5173/?admin=1
const params = new URLSearchParams(window.location.search);
const isAdmin = params.get("admin") === "1";

mount(document.getElementById("root")!, {
  apiBaseUrl: "http://localhost:8787/api",
  mode: isAdmin ? "admin" : "cliente",
});
