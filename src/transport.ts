export function sendPayload(url: string, data: any): void {
  const jsonString = JSON.stringify(data);

  if (navigator.sendBeacon) {
    const blob = new Blob([jsonString], { type: "application/json" });
    const sent = navigator.sendBeacon(url, blob);
    if (sent) return;
  }

  if (typeof window.fetch === "function") {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonString,
      keepalive: true,
    }).catch(() => {});
  }
}
