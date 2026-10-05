import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, Linking, Animated, Easing, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import Admin from './Admin';
import WalletModal from './Wallet';
import { MovieDetailModal, PredictModal, LeaderboardModal, PrivateRoomModal, NotificationsModal, SettingsModal, TermsModal } from './Modals';
import { C, notify, confirmBox, Btn, Field, Tag } from './ui';
import { loadSession, hasSession, getUserId, getEmail, signIn, signUp, signOut, recover, select, rpc } from './api';
import { CURRENCIES, CATEGORIES, curInfo, fmt, isLocked, APP_VERSION } from './constants';

const SEEN_KEY = '@mcp_seen_notif';
const PLACEHOLDER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500';

// ---------- Splash Screen (logo + zoom animation, ~1.7 sec) ----------
function SplashScreen({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(500),
          Animated.parallel([
            Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(textScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
        ]),
      ]),
      Animated.delay(400),
    ]).start(() => onFinish());
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Image
        source={require('./icon.png')}
        style={{ width: 230, height: 230, opacity: logoOpacity, transform: [{ scale: logoScale }] }}
        resizeMode="contain"
      />
      <Animated.View style={{ alignItems: 'center', marginTop: 24, opacity: textOpacity, transform: [{ scale: textScale }] }}>
        <Text style={{ color: '#FFD700', fontSize: 40, fontWeight: 'bold', letterSpacing: 6 }}>MCP</Text>
        <Text style={{ color: '#fff', fontSize: 16, letterSpacing: 2, marginTop: 6 }}>Movie Collection Prediction</Text>
      </Animated.View>
    </View>
  );
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [booting, setBooting] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState({ coin: 0, diamond: 0, red: 0 });
  const [movies, setMovies] = useState([]);
  const [entries, setEntries] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [seenId, setSeenId] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('contests');
  const [category, setCategory] = useState('ALL');

  // modals
  const [detailMovie, setDetailMovie] = useState(null);
  const [predict, setPredict] = useState(null);
  const [board, setBoard] = useState(null);
  const [roomModal, setRoomModal] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // login / register form
  const [mode, setMode] = useState('login');
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fPass, setFPass] = useState('');
  const [agree, setAgree] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  const loadAll = useCallback(async (silent) => {
    const id = getUserId();
    if (!id) return;
    try {
      const results = await Promise.all([
        select('mcp_profiles', 'id=eq.' + id + '&select=name,phone,is_admin,terms_accepted_at'),
        select('mcp_balances', 'user_id=eq.' + id + '&select=cur,amount'),
        select('mcp_movies', 'select=*&order=release_date.desc'),
        select('mcp_entries', 'user_id=eq.' + id + '&select=*&order=created_at.desc'),
        select('mcp_notifications', 'select=*&order=created_at.desc&limit=30'),
      ]);
      const p = results[0];
      if (p && p[0]) setProfile(p[0]);
      const bal = { coin: 0, diamond: 0, red: 0 };
      (results[1] || []).forEach((r) => { bal[r.cur] = Number(r.amount); });
      setBalances(bal);
      setMovies(results[2] || []);
      setEntries(results[3] || []);
      setNotifs(results[4] || []);
    } catch (e) {
      if (!hasSession()) {
        setLoggedIn(false);
        setProfile(null);
        if (!silent) notify(e.message);
      } else if (!silent) {
        notify(e.message);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadSession();
        if (hasSession()) setLoggedIn(true);
        const seen = await AsyncStorage.getItem(SEEN_KEY);
        if (seen) setSeenId(Number(seen) || 0);
      } catch (e) {}
      setBooting(false);
    })();
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    loadAll(false);
    const t = setInterval(() => loadAll(true), 30000);
    return () => clearInterval(t);
  }, [loggedIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll(false);
    setRefreshing(false);
  };

  // ---------- auth ----------
  const doLogin = async () => {
    if (!isEmail(fEmail) || !fPass) { notify('Email aur password daalein.'); return; }
    setAuthBusy(true);
    try {
      await signIn(fEmail.trim().toLowerCase(), fPass);
      setLoggedIn(true);
      setFPass('');
    } catch (e) {
      notify(e.message);
    }
    setAuthBusy(false);
  };

  const doRegister = async () => {
    if (fName.trim().length < 2) { notify('Apna naam daalein.'); return; }
    if (!isEmail(fEmail)) { notify('Sahi email daalein.'); return; }
    if (!/^[6-9][0-9]{9}$/.test(fPhone.trim())) { notify('10 digit ka sahi phone number daalein.'); return; }
    if (fPass.length < 8) { notify('Password kam se kam 8 akshar ka rakhein.'); return; }
    if (!agree) { notify('18+ confirm karein aur Terms & Conditions accept karein.'); return; }
    setAuthBusy(true);
    try {
      await signUp({ email: fEmail.trim().toLowerCase(), password: fPass, name: fName.trim(), phone: fPhone.trim() });
      setLoggedIn(true);
      setFPass('');
    } catch (e) {
      notify(e.message);
    }
    setAuthBusy(false);
  };

  const doForgot = async () => {
    if (!isEmail(fEmail)) { notify('Pehle upar apna email daalein.'); return; }
    try {
      await recover(fEmail.trim().toLowerCase());
      notify('Password reset ka link email par bhej diya gaya hai.');
    } catch (e) {
      notify(e.message);
    }
  };

  const doLogout = async () => {
    const ok = await confirmBox('Logout karna hai?');
    if (!ok) return;
    await signOut();
    setLoggedIn(false);
    setProfile(null);
    setMovies([]);
    setEntries([]);
    setBalances({ coin: 0, diamond: 0, red: 0 });
    setSettingsOpen(false);
    setTab('contests');
  };

  const acceptTerms = async () => {
    try {
      await rpc('mcp_accept_terms', {});
      await loadAll(false);
    } catch (e) {
      notify(e.message);
    }
  };

  const markSeen = async () => {
    const top = notifs.length > 0 ? notifs[0].id : 0;
    setSeenId(top);
    try { await AsyncStorage.setItem(SEEN_KEY, String(top)); } catch (e) {}
  };

  const movieById = (id) => movies.find((m) => m.id === id) || null;
  const unseen = notifs.length > 0 && notifs[0].id > seenId;
  const isAdmin = !!(profile && profile.is_admin);
  const filteredMovies = category === 'ALL' ? movies : movies.filter((m) => (m.category || '').toLowerCase() === category.toLowerCase());
  const afterAction = () => { setPredict(null); loadAll(true); };

  if (!splashDone) return <SplashScreen onFinish={() => setSplashDone(true)} />;
  if (booting) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  // ---------- Login / Register screen ----------
  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 18 }} keyboardShouldPersistTaps="handled">
          <View style={styles.authCard}>
            <Text style={styles.authLogo}>🎬 MCP Fantasy</Text>
            <Text style={styles.authSub}>Movie Collection Prediction</Text>
            <View style={{ flexDirection: 'row', marginBottom: 14 }}>
              <TouchableOpacity style={[styles.tabItem, mode === 'login' && styles.activeTab]} onPress={() => setMode('login')}>
                <Text style={styles.tabText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabItem, mode === 'register' && styles.activeTab]} onPress={() => setMode('register')}>
                <Text style={styles.tabText}>Naya Account</Text>
              </TouchableOpacity>
            </View>
            {mode === 'register' ? <Field label="Naam" value={fName} onChangeText={setFName} autoCapitalize="words" maxLength={30} /> : null}
            <Field label="Email" value={fEmail} onChangeText={setFEmail} keyboardType="email-address" />
            {mode === 'register' ? <Field label="Phone (10 digit)" value={fPhone} onChangeText={setFPhone} keyboardType="phone-pad" maxLength={10} /> : null}
            <Field label="Password (kam se kam 8 akshar)" value={fPass} onChangeText={setFPass} secure />
            {mode === 'register' ? (
              <View style={{ marginBottom: 12 }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setAgree(!agree)}>
                  <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: C.sub, backgroundColor: agree ? C.red : 'transparent', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                    {agree ? <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text> : null}
                  </View>
                  <Text style={{ color: '#ccc', fontSize: 11, flex: 1 }}>Meri umar 18 saal ya usse zyada hai aur main Terms & Conditions maanta hoon.</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTermsOpen(true)}>
                  <Text style={{ color: C.blue, fontSize: 11, marginTop: 6 }}>📜 Terms & Conditions padhein</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <Btn title={authBusy ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Account banayein')} onPress={mode === 'login' ? doLogin : doRegister} disabled={authBusy} />
            {mode === 'login' ? (
              <TouchableOpacity onPress={doForgot}>
                <Text style={{ color: C.blue, fontSize: 12, textAlign: 'center', marginTop: 12 }}>Password bhool gaye?</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
        <TermsModal visible={termsOpen} onClose={() => setTermsOpen(false)} />
      </SafeAreaView>
    );
  }

  // ---------- Terms gate (purane account ke liye) ----------
  if (profile && !profile.terms_accepted_at) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 18 }}>
          <View style={styles.authCard}>
            <Text style={styles.authLogo}>📜 Terms & Conditions</Text>
            <Text style={{ color: '#ccc', fontSize: 12, marginVertical: 12 }}>Aage badhne ke liye 18+ confirm karein aur Terms & Conditions accept karein.</Text>
            <Btn title="Padhein" color="#333" onPress={() => setTermsOpen(true)} style={{ marginBottom: 8 }} />
            <Btn title="Main 18+ hoon aur accept karta hoon" onPress={acceptTerms} />
            <Btn title="Logout" color="#333" onPress={doLogout} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
        <TermsModal visible={termsOpen} onClose={() => setTermsOpen(false)} />
      </SafeAreaView>
    );
  }

  // ---------- Main app ----------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.logoText}>🎬 MCP Fantasy</Text>
          <Text style={{ color: C.sub, fontSize: 10 }}>{'👤 ' + (profile ? profile.name : '') + (isAdmin ? ' (Admin)' : '')}</Text>
        </View>
        <TouchableOpacity style={{ marginRight: 10 }} onPress={() => setNotifOpen(true)}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
          {unseen ? <View style={{ position: 'absolute', right: 0, top: 0, width: 7, height: 7, borderRadius: 4, backgroundColor: C.red }} /> : null}
        </TouchableOpacity>
        <TouchableOpacity style={{ marginRight: 10 }} onPress={() => setSettingsOpen(true)}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setWalletOpen(true)} style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#141414', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#262626' }}>
        {CURRENCIES.map((c) => (
          <Text key={c.cur} style={{ color: c.color, fontWeight: 'bold', fontSize: 13 }}>{c.icon + ' ' + fmt(balances[c.cur])}</Text>
        ))}
        <Text style={{ color: C.green, fontWeight: 'bold', fontSize: 12 }}>👛 Wallet</Text>
      </TouchableOpacity>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, tab === 'contests' && styles.activeTab]} onPress={() => setTab('contests')}><Text style={styles.tabText}>🔥 Contests</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, tab === 'mycontests' && styles.activeTab]} onPress={() => setTab('mycontests')}><Text style={styles.tabText}>🎯 My Contests</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, tab === 'profile' && styles.activeTab]} onPress={() => setTab('profile')}><Text style={styles.tabText}>👤 Profile</Text></TouchableOpacity>
        {isAdmin ? (
          <TouchableOpacity style={[styles.tabItem, tab === 'admin' && styles.activeTab]} onPress={() => setTab('admin')}>
            <Text style={{ color: C.red, fontWeight: 'bold', fontSize: 11 }}>⚡ Admin</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {tab === 'contests' ? (
        <View style={styles.listSection}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
            {['ALL'].concat(CATEGORIES).map((cat) => (
              <TouchableOpacity key={cat} style={[styles.filterChip, category === cat && styles.activeFilterChip]} onPress={() => setCategory(cat)}>
                <Text style={{ color: '#fff', fontSize: 11 }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Btn title="🔑 Private Room me join karein" color="#6a1b9a" small onPress={() => setRoomModal({ movie: null })} style={{ marginBottom: 8 }} />
          <FlatList
            data={filteredMovies}
            keyExtractor={(item) => item.id}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={<Text style={{ color: C.sub, textAlign: 'center', marginTop: 40 }}>Abhi koi contest active nahi hai.</Text>}
            renderItem={({ item }) => {
              const locked = isLocked(item);
              const official = item.actual_collection !== null && item.actual_collection !== undefined;
              return (
                <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setDetailMovie(item)}>
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: item.banner_url || PLACEHOLDER }} style={styles.bannerImage} resizeMode="cover" />
                    {official ? (
                      <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: C.green }}>
                        <Text style={{ color: C.sub, fontSize: 9, fontWeight: 'bold' }}>DAY 1 OFFICIAL</Text>
                        <Text style={{ color: C.green, fontSize: 18, fontWeight: 'bold' }}>{fmt(item.actual_collection) + ' CR'}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.cardDetails}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.movieTitle, { flex: 1 }]}>{item.title}</Text>
                      <TouchableOpacity
                        style={{ backgroundColor: item.trailer_url ? C.red : '#333', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }}
                        onPress={() => {
                          if (item.trailer_url) Linking.openURL(item.trailer_url).catch(() => notify('Link nahi khul paya.'));
                          else notify('Trailer jaldi aayega!');
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{item.trailer_url ? '▶ Trailer' : '⏳ No Trailer'}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: '#888', fontSize: 11, marginTop: 4 }}>{'📅 Release Date: ' + item.release_date + '  |  ' + item.category}</Text>
                    <View style={styles.actionRow}>
                      <Text style={{ color: official ? C.gold : C.green, fontWeight: 'bold', fontSize: 11, flex: 1 }}>
                        {official ? '🏆 Result aa gaya' : (locked ? '🔒 Contest locked' : '🟢 Contests open')}
                      </Text>
                      {locked ? (
                        <View style={styles.closedBtn}><Text style={{ color: C.sub, fontSize: 11, fontWeight: 'bold' }}>Dekhein ➔</Text></View>
                      ) : (
                        <View style={styles.predictBtn}><Text style={styles.predictBtnText}>View Contests ➔</Text></View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : null}

      {tab === 'mycontests' ? (
        <View style={styles.listSection}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>🎯 Meri entries</Text>
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={<Text style={{ color: C.sub, textAlign: 'center', marginTop: 40 }}>Aapne abhi koi contest join nahi kiya.</Text>}
            renderItem={({ item }) => {
              const mv = movieById(item.movie_id);
              if (!mv) return null;
              const info = curInfo(item.cur);
              const locked = isLocked(mv);
              return (
                <View style={[styles.card, { padding: 12 }]}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>{'🎬 ' + mv.title}</Text>
                  <Text style={{ color: info.color, fontSize: 12, marginTop: 4 }}>
                    {info.icon + ' ' + info.label + (item.room_code ? ' | Room ' + item.room_code : ' | Public contest') + ' | Entry ' + fmt(item.fee)}
                  </Text>
                  <Text style={{ color: '#ddd', fontSize: 13, marginTop: 4 }}>{'Meri prediction: ' + fmt(item.prediction) + ' Cr'}</Text>
                  {item.final_rank ? (
                    <Text style={{ color: C.gold, fontSize: 12, marginTop: 4 }}>
                      {'Rank #' + item.final_rank + (Number(item.prize) > 0 ? '  |  🏆 Jeete: ' + fmt(item.prize) + ' ' + info.icon : '')}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    {!locked ? (
                      <Btn title="✏️ Edit" small color={C.blue} style={{ marginRight: 8 }} onPress={() => setPredict({ movie: mv, cur: item.cur, room: item.room_code, entry: item })} />
                    ) : (
                      <Text style={{ color: '#777', fontSize: 11, marginRight: 8, alignSelf: 'center' }}>🔒 Locked</Text>
                    )}
                    <Btn title="📊 Leaderboard" small color="#333" onPress={() => setBoard({ movie: mv, cur: item.cur, room: item.room_code })} />
                  </View>
                </View>
              );
            }}
          />
        </View>
      ) : null}

      {tab === 'profile' ? (
        <ScrollView style={styles.listSection}>
          <View style={styles.adminCard}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{'👤 ' + (profile ? profile.name : '')}</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>{'✉️ ' + getEmail()}</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>{'📞 +91 ' + (profile && profile.phone ? profile.phone : '-')}</Text>
            <View style={{ marginTop: 14, padding: 12, backgroundColor: C.card2, borderRadius: 8 }}>
              <Text style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>Wallet Balance</Text>
              {CURRENCIES.map((c) => (
                <Text key={c.cur} style={{ color: c.color, fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
                  {c.icon + ' ' + c.label + ': ' + fmt(balances[c.cur])}
                </Text>
              ))}
            </View>
            <Btn title="👛 Wallet kholein" onPress={() => setWalletOpen(true)} style={{ marginTop: 12 }} />
            <Btn title="📜 Terms & Conditions" color="#333" onPress={() => setTermsOpen(true)} style={{ marginTop: 8 }} />
            <Btn title="🚪 Logout" color="#333" onPress={doLogout} style={{ marginTop: 8 }} />
            <Text style={{ color: '#555', fontSize: 10, textAlign: 'center', marginTop: 12 }}>{'Version ' + APP_VERSION}</Text>
          </View>
        </ScrollView>
      ) : null}

      {tab === 'admin' && isAdmin ? <Admin movies={movies} onChanged={() => loadAll(true)} /> : null}

      <MovieDetailModal
        visible={!!detailMovie}
        movie={detailMovie}
        entries={entries}
        onClose={() => setDetailMovie(null)}
        onJoin={(cur) => setPredict({ movie: detailMovie, cur: cur, room: null, entry: null })}
        onBoard={(cur, room) => setBoard({ movie: detailMovie, cur: cur, room: room })}
        onRooms={() => setRoomModal({ movie: detailMovie })}
      />

      <PrivateRoomModal
        visible={!!roomModal}
        movie={roomModal ? roomModal.movie : null}
        onClose={() => setRoomModal(null)}
        onJoinRoom={(r) => {
          const mv = movieById(r.movie_id);
          if (!mv) { notify('Is room ki movie nahi mili. App refresh karein.'); return; }
          const mine = entries.find((e) => e.room_code === r.code);
          if (mine) { notify('Aap is room me pehle se join ho. Prediction My Contests se badlein.'); return; }
          setRoomModal(null);
          setPredict({ movie: mv, cur: r.cur, room: r.code, entry: null });
        }}
        onBoard={(r) => {
          const mv = movieById(r.movie_id);
          if (mv) setBoard({ movie: mv, cur: r.cur, room: r.code });
        }}
      />

      <PredictModal
        visible={!!predict}
        movie={predict ? predict.movie : null}
        cur={predict ? predict.cur : 'coin'}
        room={predict ? predict.room : null}
        entry={predict ? predict.entry : null}
        balances={balances}
        onClose={() => setPredict(null)}
        onDone={afterAction}
        onNeedFunds={() => { setPredict(null); setWalletOpen(true); }}
      />

      <LeaderboardModal
        visible={!!board}
        movie={board ? board.movie : null}
        cur={board ? board.cur : 'coin'}
        room={board ? board.room : null}
        onClose={() => setBoard(null)}
      />

      <WalletModal
        visible={walletOpen}
        onClose={() => { setWalletOpen(false); loadAll(true); }}
        balances={balances}
        onChanged={() => loadAll(true)}
      />

      <NotificationsModal
        visible={notifOpen}
        notifs={notifs}
        onClose={() => { setNotifOpen(false); markSeen(); }}
      />

      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onTerms={() => setTermsOpen(true)}
        onLogout={doLogout}
        appVersion={APP_VERSION}
      />

      <TermsModal visible={termsOpen} onClose={() => setTermsOpen(false)} />
    </SafeAreaView>
  );
}
