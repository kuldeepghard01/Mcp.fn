// MCP v3 FINAL (APK build)
// Simulated rewarded ad (used on web and when the real ads module is not available).
let host = null;

export const registerAdHost = (fn) => {
  host = fn;
  return () => {
    if (host === fn) host = null;
  };
};

// Resolves to 'earned' or 'dismissed'
export const simulatedAd = (label) =>
  new Promise((resolve) => {
    if (!host) {
      resolve('earned');
      return;
    }
    host({ label: label || 'Rewarded ad', done: (res) => resolve(res) });
  });
