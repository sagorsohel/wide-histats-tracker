import { Tracker } from "./tracker.js";

declare global {
  interface Window {
    __WIDE_HISTAT_LOADED__?: boolean;
    wideHistat?: {
      trackPageView: () => void;
      trackEvent: (name: string, data?: Record<string, any>) => void;
    };
  }
}

(function () {
  if (typeof window === "undefined") return;
  if (window.__WIDE_HISTAT_LOADED__) return;
  window.__WIDE_HISTAT_LOADED__ = true;

  const currentScript =
    document.currentScript ||
    (() => {
      const scripts = document.getElementsByTagName("script");
      for (let i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].getAttribute("data-website-id")) return scripts[i];
      }
      return null;
    })();

  if (!currentScript) return;

  let websiteId = currentScript ? currentScript.getAttribute("data-website-id") : null;

  // Support Histats-compatible async queue: _Hasync.push(['Histats.start', '1,4867995,...'])
  if (!websiteId && typeof window !== "undefined") {
    const hasync = (window as any)._Hasync || (window as any)._Aasync;
    if (Array.isArray(hasync)) {
      for (const item of hasync) {
        if (
          Array.isArray(item) &&
          (item[0] === "Histats.start" || item[0] === "Analycos.start")
        ) {
          if (typeof item[1] === "string" && item[1].includes(",")) {
            const parts = item[1].split(",");
            if (parts[1]) websiteId = parts[1].trim();
          } else if (item[1]) {
            websiteId = String(item[1]).trim();
          }
          break;
        }
      }
    }
  }

  if (!websiteId) return;

  const customHost = currentScript.getAttribute("data-host-url");
  let apiHost = "";
  if (customHost) {
    apiHost = customHost;
  } else if ((currentScript as HTMLScriptElement).src) {
    const a = document.createElement("a");
    a.href = (currentScript as HTMLScriptElement).src;
    apiHost = `${a.protocol}//${a.host}`;
  } else {
    apiHost = window.location.origin;
  }

  const tracker = new Tracker(websiteId, apiHost);

  window.wideHistat = {
    trackPageView: () => tracker.trackPageView(false),
    trackEvent: (name, data) => tracker.trackEvent(name, data),
  };
})();
