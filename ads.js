// MCP v3 FINAL (APK build)
import { simulatedAd } from './adsSim';

// Web / test version. Real AdMob ads are in ads.native.js (used in the Android app).
export const initAds = async () => {};

// Returns 'earned' | 'dismissed' | 'unavailable'
export const showRewardedAd = (label) => simulatedAd(label);
