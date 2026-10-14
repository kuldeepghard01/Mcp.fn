// MCP v3 FINAL (APK build)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_KEY } from './constants';

const SESSION_KEY = '@mcp_session_v2';
let session = null;
let refreshing = null;

const headers = (token) => {
  const h = { 'Content-Type': 'application/json', apikey: SUPABASE_KEY };
  if (token) h.Authorization = 'Bearer ' + token;
  else if (String(SUPABASE_KEY).startsWith('eyJ')) h.Authorization = 'Bearer ' + SUPABASE_KEY;
  return h;
};

const friendly = (m) => {
  const s = String(m || '');
  if (/Invalid login credentials/i.test(s)) return 'Incorrect email or password.';
  if (/User already registered/i.test(s)) return 'This email is already registered. Please log in.';
  if (/Database error saving new user/i.test(s)) return 'This phone number or email is already registered.';
  if (/Email not confirmed/i.test(s)) return 'Email not confirmed. Open the link we emailed you.';
  if (/Password should be at least/i.test(s)) return 'Password must be at least 8 characters.';
  if (/rate limit/i.test(s)) return 'Too many attempts. Please try again in a while.';
  if (/Network request failed|Failed to fetch|NetworkError/i.test(s)) return 'Check your internet connection and try again.';
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

export const signUp = async ({ email, password, name, phone, referral }) => {
  const j = await authCall('signup', { email, password, data: { name, phone, terms: 'true', referral: referral || '' } });
  if (!j.access_token) {
    throw new Error('Account created. Please confirm your email using the link we sent, then log in.');
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
    throw new Error('Your session has expired. Please log in again.');
  }
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const j = await authCall('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
        await saveSession(normalize(j));
      } catch (e) {
        await saveSession(null);
        throw new Error('Your session has expired. Please log in again.');
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
};

const token = async () => {
  if (!hasSession()) throw new Error('Please log in first.');
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
    throw new Error('Image upload failed. ' + friendly(m));
  }
  return SUPABASE_URL + '/storage/v1/object/public/banners/' + name;
};
