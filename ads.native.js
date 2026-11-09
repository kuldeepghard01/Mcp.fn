// MCP v3 FINAL (APK build)
import { simulatedAd } from './adsSim';
import { ADMOB } from './constants';

let lib = null;
try {
  lib = require('react-native-google-mobile-ads');
} catch (e) {
  lib = null;
}

let started = false;

export const initAds = async () => {
  if (!lib || started) return;
  started = true;
  try {
    if (lib.AdsConsent && lib.AdsConsent.gatherConsent) await lib.AdsConsent.gatherConsent();
  } catch (e) {}
  try {
    await lib.default().initialize();
  } catch (e) {}
};

// ---- Full-screen ad between screens (never at app start, capped by count and time) ----
let inter = null;
let interLoaded = false;
let actionCount = 0;
let lastShown = 0;

const loadInterstitial = () => {
  if (!lib || !lib.InterstitialAd) return;
  if (!ADMOB.testMode && !ADMOB.interstitial) return;
  try {
    const unit = (ADMOB.testMode || !ADMOB.interstitial) ? lib.TestIds.INTERSTITIAL : ADMOB.interstitial;
    interLoaded = false;
    inter = lib.InterstitialAd.createForAdRequest(unit);
    inter.addAdEventListener(lib.AdEventType.LOADED, () => { interLoaded = true; });
    inter.addAdEventListener(lib.AdEventType.CLOSED, () => {
      interLoaded = false;
      setTimeout(loadInterstitial, 1500);
    });
    inter.addAdEventListener(lib.AdEventType.ERROR, () => { interLoaded = false; });
    inter.load();
  } catch (e) {}
};

export const preloadInterstitial = () => {
  if (!inter) loadInterstitial();
};

// everyN = 0 means off. Shows at most once per gapMinutes.
export const maybeShowInterstitial = (everyN, gapMinutes) => {
  const n = Number(everyN) || 0;
  if (n <= 0 || !lib) return;
  actionCount += 1;
  if (actionCount % n !== 0) return;
  const gap = (Number(gapMinutes) || 3) * 60000;
  if (Date.now() - lastShown < gap) return;
  if (inter && interLoaded) {
    try {
      inter.show();
      lastShown = Date.now();
    } catch (e) {}
  } else if (!inter) {
    loadInterstitial();
  }
};

// Returns 'earned' | 'dismissed' | 'unavailable'
export const showRewardedAd = (label) =>
  new Promise((resolve) => {
    if (!lib || !lib.RewardedAd) {
      simulatedAd(label).then(resolve);
      return;
    }
    let finished = false;
    let earned = false;
    let loaded = false;
    const subs = [];
    const cleanup = () => {
      subs.forEach((u) => {
        try { u(); } catch (e) {}
      });
    };
    const finish = (res) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(res);
    };
    try {
      const unit = (ADMOB.testMode || !ADMOB.rewarded) ? lib.TestIds.REWARDED : ADMOB.rewarded;
      const ad = lib.RewardedAd.createForAdRequest(unit);
      subs.push(ad.addAdEventListener(lib.RewardedAdEventType.LOADED, () => {
        loaded = true;
        try { ad.show(); } catch (e) { finish('unavailable'); }
      }));
      subs.push(ad.addAdEventListener(lib.RewardedAdEventType.EARNED_REWARD, () => { earned = true; }));
      subs.push(ad.addAdEventListener(lib.AdEventType.CLOSED, () => finish(earned ? 'earned' : 'dismissed')));
      subs.push(ad.addAdEventListener(lib.AdEventType.ERROR, () => finish(loaded ? 'dismissed' : 'unavailable')));
      ad.load();
      setTimeout(() => { if (!loaded) finish('unavailable'); }, 20000);
    } catch (e) {
      finish('unavailable');
    }
  });
