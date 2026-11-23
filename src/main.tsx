import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AntuikitProvider } from "@/registry/antuikit/providers/antuikit-provider";
import { App } from "./app";
import { BuyButton } from "./showcase/buy-button";
import "./styles.css";

// `?theme=light|dark|auto` opens in that theme (dark otherwise), for screenshots.
const requested = new URLSearchParams(location.search).get("theme");
const THEME = requested === "light" || requested === "auto" ? requested : "dark";

// Scrollbars stay hidden until something scrolls (see styles.css): flag the box
// that is scrolling, and clear the flag shortly after it stops.
const scrollTimers = new WeakMap<Element, number>();
addEventListener(
  "scroll",
  (e) => {
    const el = e.target === document ? document.documentElement : e.target;
    if (!(el instanceof Element)) return;
    el.setAttribute("data-scrolling", "");
    clearTimeout(scrollTimers.get(el));
    scrollTimers.set(el, window.setTimeout(() => el.removeAttribute("data-scrolling"), 900));
  },
  { capture: true, passive: true },
);

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

createRoot(root).render(
  <StrictMode>
    <AntuikitProvider defaultMode={THEME}>
      <App />
    </AntuikitProvider>
    <BuyButton />
  </StrictMode>,
);
