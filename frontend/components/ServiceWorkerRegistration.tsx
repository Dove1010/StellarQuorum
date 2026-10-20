"use client";

import { useEffect } from "react";

/*
 * Registers the service worker for offline detection and PWA support.
 *
 * This component only runs in the browser and only when a service worker is
 * supported. It registers the worker at /sw.js and handles basic errors.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  }, []);

  return null;
}
