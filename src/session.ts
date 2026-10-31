const VISITOR_KEY = "_wh_vk";
const SESSION_KEY = "_wh_sk";
const SESSION_TIMESTAMP_KEY = "_wh_st";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getVisitorKey(): string {
  try {
    let vk = localStorage.getItem(VISITOR_KEY);
    if (!vk) {
      vk = generateUUID();
      localStorage.setItem(VISITOR_KEY, vk);
    }
    return vk;
  } catch {
    return generateUUID();
  }
}

export function getSessionKey(): string {
  const now = Date.now();
  try {
    let sk = sessionStorage.getItem(SESSION_KEY);
    const lastActive = parseInt(
      sessionStorage.getItem(SESSION_TIMESTAMP_KEY) || "0",
      10
    );

    if (!sk || now - lastActive > SESSION_TIMEOUT) {
      sk = generateUUID();
      sessionStorage.setItem(SESSION_KEY, sk);
    }
    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
    return sk;
  } catch {
    return generateUUID();
  }
}
