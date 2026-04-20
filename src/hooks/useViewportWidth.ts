import { useSyncExternalStore } from "react";

type Listener = () => void;

const DEFAULT_WIDTH = 1280;
const listeners = new Set<Listener>();

let currentWidth = typeof window === "undefined" ? DEFAULT_WIDTH : window.innerWidth;
let listening = false;

const notify = () => {
  listeners.forEach((listener) => listener());
};

const handleResize = () => {
  const nextWidth = window.innerWidth;
  if (nextWidth === currentWidth) return;
  currentWidth = nextWidth;
  notify();
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  if (!listening && typeof window !== "undefined") {
    listening = true;
    currentWidth = window.innerWidth;
    window.addEventListener("resize", handleResize, { passive: true });
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && listening && typeof window !== "undefined") {
      window.removeEventListener("resize", handleResize);
      listening = false;
    }
  };
};

const getSnapshot = () => (typeof window === "undefined" ? DEFAULT_WIDTH : currentWidth);
const getServerSnapshot = () => DEFAULT_WIDTH;

export function useViewportWidth() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
