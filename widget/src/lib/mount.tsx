import React from "react";
import { createRoot } from "react-dom/client";
import { CotizadorWidget } from "./ui";
import { ApiConfig } from "./api";

export interface MountOptions {
  apiBaseUrl: string;
  mode?: "cliente" | "admin";
}

export function mount(el: HTMLElement, opts: MountOptions) {
  const api: ApiConfig = { baseUrl: opts.apiBaseUrl, mode: opts.mode ?? "cliente" };
  const root = createRoot(el);
  root.render(<CotizadorWidget api={api} />);
  return () => root.unmount();
}

declare global {
  interface Window { KurvingCotizador?: { mount: typeof mount }; }
}
window.KurvingCotizador = { mount };
