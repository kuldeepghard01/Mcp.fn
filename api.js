import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_KEY } from './constants';

const SESSION_KEY = '@mcp_session_v2';
let session = null;
let refreshing = null;

const headers = (token) => ({
  'Content-Type': 'application/json',
  apikey: SUPABASE_KEY,
  Authorization: 'Bearer ' + (token || SUPABASE_KEY),
});

const friendly = (m) => {
  const s = String(m || '');
  if (/Invalid login credentials/i.test(s)) return 'Email ya password galat hai.';
  if (/User already registered/i.test(s)) return 'Ye email pehle se registered hai. Login karein.';
  if (/Database error saving new user/i.test(s)) return 'Ye phone number ya email pehle se registered hai.';
  if (/Email not confirmed/i.test(s)) return 'Email confirm nahi hua. Mail me aaya link kholein.';
  if (/Password should be at least/i.test(s)) return 'Password kam se kam 8 akshar ka rakhein.';
  if (/rate limit/i.test(s)) return 'Bahut zyada koshish ho gayi. Thodi der baad dobara try karein.';
  if (/Network request failed|Failed to fetch|NetworkError/i.test(s)) return 'Internet check karein aur dobara try karein.';
  return s;
};

const normalize = (j) => ({
  access_token: j.access_token,
  refresh_token: j.refresh_token,
  expires_at: Math.floor(Date.now() / 1000) + (Number(j.expires_in) || 3600),
  user: j.user ? { id: j.user.id, email: j.user.email } : null,
});

const saveSession = async (s) => {
  session = s;
  try {
    if (s) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else await AsyncStorage.removeItem(SESSION_KEY);
  } catch (e) {}
};

export const loadSession = async () => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    session = raw ? JSON.parse(raw) : null;
  } catch (e) {
    session = null;
  }
  return session;
};

export const hasSession = () => !!(session && session.access_token);
export const getUserId = () => (session && session.user ? session.user.id : null);
export const getEmail = () => (session && session.user ? session.user.email : '');

const authCall = async (path, body) => {
  let res;
  try {
    res = await fetch(SUPABASE_URL + '/auth/v1/' + path, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  } catch (e) {
    throw new Error(friendly(e.message));
  }
  let j = {};
  try { j = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error(friendly(j.msg || j.message || j.error_description || j.error || ('Error ' + res.status)));
  return j;
};

export const signUp = async ({ email, password, name, phone }) => {
  const j = await authCall('signup', { email, password, data: { name, phone, terms: 'true' } });
  if (!j.access_token) {
    throw new Error('Account ban gaya, par email confirm karna hoga. Mail me aaya link kholkar phir login karein.');
  }
  await saveSession(normalize(j));
};

export const signIn = async (email, password) => {
  const j = await authCall('token?grant_type=password', { email, password });
  await saveSession(normalize(j));
};

export const recover = async (email) => {
  await authCall('recover', { email });
};

export const signOut = async () => {
  try {
    if (session && session.access_token) {
      await fetch(SUPABASE_URL + '/auth/v1/logout', { method: 'POST', headers: headers(session.access_token) });
    }
  } catch (e) {}
  await saveSession(null);
};

const refresh = async () => {
  if (!session || !session.refresh_token) {
    await saveSession(null);
    throw new Error('Session khatam ho gaya. Dobara login karein.');
  }
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const j = await authCall('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
        await saveSession(normalize(j));
      } catch (e) {
        await saveSession(null);
        throw new Error('Session khatam ho gaya. Dobara login karein.');
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
};

const token = async () => {
  if (!hasSession()) throw new Error('Pehle login karein.');
  if (session.expires_at - 60 < Math.floor(Date.now() / 1000)) await refresh();
  return session.access_token;
};

const call = async (url, opts, retry) => {
  const t = await token();
  let res;
  try {
    res = await fetch(url, { ...opts, headers: { ...headers(t), ...(opts.headers || {}) } });
  } catch (e) {
    throw new Error(friendly(e.message));
  }
  const text = await res.text();
  let j = null;
  try { j = text ? JSON.parse(text) : null; } catch (e) {}
  if (res.status === 401 && retry) {
    await refresh();
    return call(url, opts, false);
  }
  if (!res.ok) throw new Error(friendly((j && (j.message || j.error || j.msg)) || ('Error ' + res.status)));
  return j;
};

export const rpc = (fn, args) =>
  call(SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', body: JSON.stringify(args || {}) }, true);

export const select = (table, query) =>
  call(SUPABASE_URL + '/rest/v1/' + table + (query ? '?' + query : ''), { method: 'GET' }, true);

export const uploadBanner = async (uri) => {
  const t = await token();
  const blob = await (await fetch(uri)).blob();
  const name = 'b_' + Date.now() + '.jpg';
  const res = await fetch(SUPABASE_URL + '/storage/v1/object/banners/' + name, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + t, 'Content-Type': blob.type || 'image/jpeg' },
    body: blob,
  });
  if (!res.ok) {
    let m = '';
    try { const j = await res.json(); m = j.message || j.error || ''; } catch (e) {}
    throw new Error('Banner upload nahi hua. ' + friendly(m));
  }
  return SUPABASE_URL + '/storage/v1/object/public/banners/' + name;
};
