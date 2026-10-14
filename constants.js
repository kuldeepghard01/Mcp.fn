// MCP v3 FINAL (APK build)
// ---------- MCP Fantasy: settings ----------
export const SUPABASE_URL = "https://zlgwkwdpwswdnuuetzhe.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ3drd2Rwd3N3ZG51dWV0emhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MTI2NjIsImV4cCI6MjEwMzQ4ODY2Mn0.cOtOhQUvBiW4PwqthRCP3Q_5pZUTq1mUEakWZWVWIMM";
export const TMDB_KEY = "15d2ea6d0dc1d476efbca3eba219bbf0";

export const APP_VERSION = "3.0.0";

// AdMob settings.
// testMode = true shows Google TEST ads (safe). Keep it true while testing, because
// clicking or over-viewing your own real ads can get your AdMob account banned.
// Set testMode to false only in the final release build.
export const ADMOB = {
  testMode: true,
  rewarded: "ca-app-pub-3558136570580125/4253439264",
  banner: "",
};

export const CATEGORIES = ["Bollywood", "Hollywood", "Tollywood", "Other"];
export const DEFAULT_QUESTIONS = ["Hero death", "Heroine death", "Love story", "Action", "Love story + Action"];
export const MAX_COLLECTION_CR = 5000;

const trim = (x) => Number(x.toFixed(2)).toString();

export const fmtNum = (n) => Number(n || 0).toLocaleString("en-US");

// Collection is stored in Crore. Show small values in Lakh.
export const fmtCr = (cr) => {
  const v = Number(cr);
  if (isNaN(v)) return "-";
  if (v > 0 && v < 1) return trim(v * 100) + " Lakh";
  return trim(v) + " Cr";
};

export const toCr = (value, unit) => {
  const v = parseFloat(value);
  if (isNaN(v)) return NaN;
  return unit === "lakh" ? v / 100 : v;
};

export const isLocked = (movie) => {
  if (!movie || !movie.lock_at) return false;
  return Date.now() >= new Date(movie.lock_at).getTime();
};

export const timeLeft = (movie) => {
  if (!movie || !movie.lock_at) return "";
  const ms = new Date(movie.lock_at).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return d + "d " + h + "h left";
  if (h > 0) return h + "h " + (m % 60) + "m left";
  return (m % 60) + "m left";
};

export const lockText = (movie) => {
  try {
    return new Date(movie.lock_at).toLocaleString();
  } catch (e) {
    return "";
  }
};

export const youtubeId = (url) => {
  const s = String(url || "").trim();
  if (!s) return "";
  const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  return "";
};

export const TERMS = [
  { h: "1. About MCP Fantasy", t: "MCP Fantasy is a free movie prediction game. You predict a movie's Day 1 box-office collection and answer a few questions about the movie. There is no entry fee, no deposit and no cash withdrawal anywhere in the app." },
  { h: "2. Eligibility", t: "You must be at least 18 years old. You are responsible for making sure that joining prediction games with prizes is allowed where you live. If it is not allowed, please do not use the app." },
  { h: "3. How to play", t: "Open a movie, enter your Day 1 collection prediction and answer the movie questions. You join by watching a short ad. You can change your prediction until entries close. Entries close at 12:00 AM (India time) on the movie release date. You can join each movie up to 4 times (each entry needs a short ad). The limit may change." },
  { h: "4. Scoring and winners", t: "Collection score: up to 100 points, based on how close your prediction is to the official Day 1 collection. Movie score: 10 points for each movie question you answer correctly. Your total score decides your rank. If scores are equal, the better collection score wins, then the earlier entry. The official collection and answers are set by the MCP team using public sources. Our decision is final." },
  { h: "5. Coins", t: "Winners receive coins by rank: Rank 1 gets 25,000, ranks 2 to 10 get 10,000 each, ranks 11 to 100 get 6,500 each, ranks 101 to 1,000 get 2,000 each and ranks 1,001 to 50,000 get 1,000 each. New users get welcome coins (the amount may change). You can also earn coins by watching ads in the Coins tab, up to the daily limit. Coins expire if they are not used within the expiry period shown in the Coins tab (90 days by default). Coins have no cash value. They cannot be bought, sold, transferred or exchanged for money." },
  { h: "6. Rewards", t: "You can use coins to request movie tickets from the Coins tab. Rewards depend on availability and are fulfilled manually by the MCP team. To request a reward, your account must meet the age and activity rules shown in the Coins tab, and monthly limits apply. We may ask for extra details, refuse suspicious requests or change the reward list, rules and coin prices at any time. If a request is refused, your coins are returned." },
  { h: "7. Fair play", t: "One person, one account. Using multiple accounts, bots, scripts, or exploiting bugs is not allowed and may lead to account removal and loss of coins." },
  { h: "8. Ads and partners", t: "The app shows ads and sponsored content from Google AdMob and partner brands. Ads may use your device advertising ID as allowed by your consent choices and local law. Sponsored links open third-party sites that we do not control." },
  { h: "9. Your data", t: "We store your name, email, phone number, game activity and coin balance to run the service, prevent abuse and measure app usage. We do not sell your personal data. You can delete your account and data anytime from Profile." },
  { h: "10. Referrals", t: "You can invite friends with your referral code. When a friend signs up with your code and joins their first contest, you receive bonus coins, up to a daily and a total limit. Fake or repeated accounts are not allowed and may lead to account removal and loss of coins." },
  { h: "11. Responsible play", t: "This is a game for entertainment. Please play in moderation." },
  { h: "12. Changes", t: "We may update these terms and the app from time to time. Continuing to use the app means you accept the updated terms." },
];
