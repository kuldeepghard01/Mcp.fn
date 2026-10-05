// ---------- MCP Fantasy: settings ----------
export const SUPABASE_URL = "https://zlgwkwdpswdnuuetzhle.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ3drd2Rwc3dkbnV1ZXR6aGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTEyNjUsImV4cCI6MjA3MjAyNzI2NX0.cDTOhQUvBIw4PwqthRCP3Q_5pZUTq1nUEskWZvWVtMM";
export const TMDB_KEY = "15d2ea6d0dc1d476efbca3eba219bbf0";

// Coins kharidne ke liye UPI (QR is ID se banta hai)
export const UPI_ID = "9001641023@ibl";
export const UPI_NAME = "MCP Fantasy";
export const MIN_REDEEM_RS = 100;
export const APP_VERSION = "2.0.0";

export const CURRENCIES = [
  { cur: "coin", label: "Coin", icon: "🪙", rupees: 9, color: "#FFC107" },
  { cur: "diamond", label: "Diamond", icon: "💎", rupees: 49, color: "#4FC3F7" },
  { cur: "red", label: "Red Diamond", icon: "♦️", rupees: 99, color: "#FF5252" },
];

export const curInfo = (c) => CURRENCIES.find((x) => x.cur === c) || CURRENCIES[0];

export const fmt = (n) => {
  const v = Number(n);
  if (isNaN(v)) return "0";
  return v.toFixed(2).replace(/\.?0+$/, "");
};

// Sirf dikhane ke liye. Asli lock server (database) ki ghadi se hota hai.
export const isLocked = (movie) => {
  if (!movie || !movie.lock_at) return false;
  return Date.now() >= new Date(movie.lock_at).getTime();
};

export const CATEGORIES = ["Bollywood", "Hollywood", "Tollywood", "Other"];

export const TERMS = [
  { h: "1. Eligibility (18+)", t: "Ye app sirf 18 saal ya usse zyada umar ke users ke liye hai. Is app ko use karne se pehle aapko dekhna hoga ki aapke state/desh mein aisi activity kanooni roop se allowed hai. Agar allowed nahi hai to app use na karein." },
  { h: "2. Kaise khelna hai", t: "Kisi movie ke contest mein join karke us movie ke Day 1 box-office collection (Crore mein) ka andaza lagayein. Actual collection ke sabse nazdeek andaza lagane wale jeetenge. Har user ek contest mein ek hi prediction laga sakta hai, jo contest lock hone se pehle badli ja sakti hai." },
  { h: "3. Coins, Diamonds, Red Diamonds", t: "App ke andar sirf Coin, Diamond aur Red Diamond chalte hain. Rate: 1 Coin = Rs 9, 1 Diamond = Rs 49, 1 Red Diamond = Rs 99. Kharidne aur redeem karne dono par yahi rate lagu hota hai. Coin ke contest mein sirf Coin, Diamond ke contest mein sirf Diamond aur Red Diamond ke contest mein sirf Red Diamond lagta hai." },
  { h: "4. Entry aur Prize Pool", t: "Har public contest mein entry 1 unit hoti hai. Jitne zyada log join karte hain, prize pool utna badhta hai. Kul entries ka 80 percent prize pool banta hai aur 20 percent platform fee hoti hai." },
  { h: "5. Winners aur Inaam", t: "Rank 1 ko prize pool ka 50 percent, Rank 2 se 8 ko 30 percent (barabar bant kar), Rank 9 se 25 ko 20 percent (barabar bant kar). Agar players kam hon to sirf bhare hue tiers ke beech pool bant jata hai. Barabar diff hone par pehle prediction lagane wala upar rahega." },
  { h: "6. Lock aur Result", t: "Movie ki release date shuru hote hi (raat 12:00 AM, India time) us movie ke saare contest aur private rooms lock ho jate hain. Actual Day 1 collection admin official source se dekh kar declare karta hai. Admin ka faisla final hoga." },
  { h: "7. Refund", t: "Agar kisi contest ya room mein 2 se kam players hon to sabki entry wapas kar di jati hai. Movie hata di jaye to bhi entry wapas hoti hai." },
  { h: "8. Private Rooms", t: "Aap apne doston ke liye private room bana sakte hain (apna entry aur spots chun kar). Room ka code share karke dost join kar sakte hain. Room ka result bhi alag declare hota hai." },
  { h: "9. Coins kharidna", t: "UPI se payment karke 12 digit UTR number app mein daalein. Admin payment verify karne ke baad hi Coins add karta hai. Galat ya nakli UTR dene par account block ho sakta hai." },
  { h: "10. Redeem (rupaye nikalna)", t: "Pehle apna payout account (UPI ya Bank) save karein. Redeem karne par aapke Coins/Diamonds kat kar rupaye (upar wale rate se) aapke account mein bheje jate hain. Minimum redeem value Rs 100 hai. Processing admin verification par nirbhar hai. Sirf aapke apne naam ka account use karein." },
  { h: "11. Tax", t: "Jeet par lagu kanoon ke hisaab se TDS/tax kata ja sakta hai ya aapko dena pad sakta hai. Iski zimmedari user ki hai." },
  { h: "12. Fair Play", t: "Ek insaan ka ek hi account. Multiple accounts, fraud, bug ka galat fayda uthana ya system ke saath chhed-chhad karne par account block ho sakta hai aur balance roka ja sakta hai." },
  { h: "13. Responsible Gaming", t: "Sirf utna khelein jitna aap aaram se afford kar sakein. Ye game aadat ban sakta hai. Agar aapko lage ki control nahi ho raha to khelna band kar dein." },
  { h: "14. Privacy", t: "Aapka naam, email, phone number aur payout details sirf service dene aur fraud rokne ke liye use hote hain. Ye kisi ko becha nahi jata." },
  { h: "15. Badlav", t: "Ye terms samay samay par badal sakte hain. App use karte rehne ka matlab hai ki aap naye terms maante hain." },
];
