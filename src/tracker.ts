import { getVisitorKey, getSessionKey } from "./session.js";
import { getUtmParams } from "./attribution.js";
import { sendPayload } from "./transport.js";

export class Tracker {
  private websiteId: string;
  private apiHost: string;
  private lastTrackedPath: string = "";

  constructor(websiteId: string, apiHost: string) {
    this.websiteId = websiteId;
    this.apiHost = apiHost.replace(/\/$/, "");
    this.init();
  }

  private init() {
    this.trackPageView(false);
    this.hookHistory();

    // Heartbeat every 15 seconds to keep active visitor state fresh
    setInterval(() => {
      this.sendHeartbeat();
    }, 15000);

    // Immediate heartbeat when user switches tab back into focus
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.sendHeartbeat();
        }
      });
    }
  }

  public trackPageView(isSpaNavigation: boolean = false) {
    const currentPath = window.location.pathname + window.location.search;

    if (isSpaNavigation && currentPath === this.lastTrackedPath) return;
    this.lastTrackedPath = currentPath;

    const visitorKey = getVisitorKey();
    const sessionKey = getSessionKey();
    const utm = getUtmParams();

    const payload = {
      websiteId: this.websiteId,
      url: window.location.href,
      path: currentPath,
      title: document.title || "",
      referrer: document.referrer || "",
      visitorKey,
      sessionKey,
      screen: window.screen
        ? `${window.screen.width}x${window.screen.height}`
        : undefined,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
    };

    sendPayload(`${this.apiHost}/api/v1/track/pageview`, payload);
  }

  public sendHeartbeat() {
    // Keep session alive even if user is listening in background or watching match
    const visitorKey = getVisitorKey();
    const sessionKey = getSessionKey();

    sendPayload(`${this.apiHost}/api/v1/track/heartbeat`, {
      websiteId: this.websiteId,
      visitorKey,
      sessionKey,
      path: window.location.pathname,
    });
  }

  public trackEvent(eventName: string, eventData: Record<string, any> = {}) {
    const visitorKey = getVisitorKey();
    const sessionKey = getSessionKey();

    sendPayload(`${this.apiHost}/api/v1/track/event`, {
      websiteId: this.websiteId,
      visitorKey,
      sessionKey,
      eventName,
      eventData,
    });
  }

  private hookHistory() {
    const origPushState = history.pushState;
    if (origPushState) {
      history.pushState = (...args) => {
        const ret = origPushState.apply(history, args);
        setTimeout(() => this.trackPageView(true), 50);
        return ret;
      };
    }

    const origReplaceState = history.replaceState;
    if (origReplaceState) {
      history.replaceState = (...args) => {
        const ret = origReplaceState.apply(history, args);
        setTimeout(() => this.trackPageView(true), 50);
        return ret;
      };
    }

    window.addEventListener("popstate", () => {
      setTimeout(() => this.trackPageView(true), 50);
    });
  }
}
