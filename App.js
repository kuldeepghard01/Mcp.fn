// MCP v3 FINAL (APK build)
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, ScrollView, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import Splash from './Splash';
import AuthScreen from './AuthScreen';
import Admin from './Admin';
import AdHost from './AdHost';
import MoviesTab from './MoviesTab';
import MyContestsTab from './MyContestsTab';
import CoinsTab from './CoinsTab';
import ProfileTab from './ProfileTab';
import MovieScreen from './MovieScreen';
import JoinModal from './JoinModal';
import TrailerPlayer from './TrailerPlayer';
import { NotificationsModal, TermsModal } from './Modals';
import { C, notify, confirmBox, Btn } from './ui';
import { loadSession, hasSession, getUserId, signOut, select, rpc, loadCache, saveCache } from './api';
import { initAds } from './ads';
import { fmtNum, isLocked, ADMOB, sortMovies } from './constants';

const SEEN_KEY = '@mcp_seen_notif_v3';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [booting, setBooting] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState(null);
  const [movies, setMovies] = useState([]);
  const [counts, setCounts] = useState({});
  const [entries, setEntries] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [settings, setSettings] = useState({});
  const [seenId, setSeenId] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('contests');
  const [category, setCategory] = useState('ALL');
  const [adminStart, setAdminStart] = useState('overview');
  const [loadingFirst, setLoadingFirst] = useState(true);

  const [screen, setScreen] = useState(null);
  const [join, setJoin] = useState(null);
  const [trailerId, setTrailerId] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const applyData = useCallback((d, light) => {
    if (d.profile) setProfile(d.profile);
    if (d.movies) setMovies(sortMovies(d.movies));
    if (d.counts) {
      const c = {};
      d.counts.forEach((x) => { c[x.movie_id] = Number(x.entries); });
      setCounts(c);
    }
    if (d.entries) setEntries(d.entries);
    if (!light) {
      if (d.notifs) setNotifs(d.notifs);
      if (d.tiers) setTiers(d.tiers);
      if (d.rewards) setRewards(d.rewards);
      if (d.sponsors) setSponsors(d.sponsors);
      if (d.settings) {
        const sm = {};
        d.settings.forEach((x) => { sm[x.key] = x.value; });
        setSettings(sm);
        // Real ads only when the admin switches them on. The admin account always sees test ads.
        const isAdm = !!(d.profile && d.profile.is_admin);
        ADMOB.testMode = sm.ads_test_mode !== '0' || isAdm;
      }
    }
  }, []);

  // Backup way (used only if the one-request loader is not installed on the server yet)
  const legacyLoad = async (id, light) => {
    const ok = (p) => p.catch(() => undefined);
    const jobs = [
      ok(select('mcp_profiles', 'id=eq.' + id + '&select=name,phone,coins,is_admin,terms_accepted_at')),
      ok(select('mcp_movies', 'select=*&order=release_date.desc')),
      ok(rpc('mcp_entry_counts', {})),
      ok(select('mcp_entries', 'user_id=eq.' + id + '&select=*&order=created_at.desc')),
    ];
    if (!light) {
      jobs.push(ok(select('mcp_notifications', 'select=*&order=created_at.desc&limit=30')));
      jobs.push(ok(select('mcp_prize_tiers', 'select=*&order=from_rank.asc')));
      jobs.push(ok(select('mcp_rewards', 'active=eq.true&select=*&order=sort.asc')));
      jobs.push(ok(select('mcp_sponsors', 'active=eq.true&select=*&order=created_at.desc')));
      jobs.push(ok(select('mcp_settings', 'select=*')));
    }
    const r = await Promise.all(jobs);
    if (r.every((x) => x === undefined)) throw new Error('Cannot reach the server. Check your internet and pull down to refresh.');
    return {
      profile: r[0] && r[0][0], movies: r[1], counts: r[2], entries: r[3],
      notifs: r[4], tiers: r[5], rewards: r[6], sponsors: r[7], settings: r[8],
    };
  };

  const loadAll = useCallback(async (silent, light) => {
    const id = getUserId();
    if (!id) return;
    try {
      let d = null;
      try {
        d = await rpc('mcp_bootstrap', { p_light: !!light });
      } catch (e) {
        if (!hasSession()) throw e;
        d = null;
      }
      if (!d) d = await legacyLoad(id, light);
      applyData(d, light);
      if (!light) saveCache(id, d);
    } catch (e) {
      if (!hasSession()) {
        setLoggedIn(false);
        setProfile(null);
      }
      if (!silent) notify(e.message);
    }
    setLoadingFirst(false);
  }, [applyData]);

  useEffect(() => {
    (async () => {
      try {
        await loadSession();
        if (hasSession()) {
          // show the last saved data at once, fresh data follows a moment later
          const cached = await loadCache(getUserId());
          if (cached) {
            applyData(cached, false);
            setLoadingFirst(false);
          }
          setLoggedIn(true);
        }
        const seen = await AsyncStorage.getItem(SEEN_KEY);
        if (seen) setSeenId(Number(seen) || 0);
      } catch (e) {}
      setBooting(false);
    })();
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    initAds();
    loadAll(false);
    rpc('mcp_touch', {}).catch(() => {});
    let tick = 0;
    const t = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      tick += 1;
      loadAll(true, tick % 5 !== 0);
      if (tick % 2 === 0) rpc('mcp_touch', {}).catch(() => {});
    }, 120000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        loadAll(true, true);
        rpc('mcp_touch', {}).catch(() => {});
      }
    });
    return () => {
      clearInterval(t);
      if (sub && sub.remove) sub.remove();
    };
  }, [loggedIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll(false);
    setRefreshing(false);
  };

  const resetSession = async () => {
    await signOut();
    setLoggedIn(false);
    setProfile(null);
    setMovies([]);
    setEntries([]);
    setScreen(null);
    setJoin(null);
    setTab('contests');
  };

  const doLogout = async () => {
    const ok = await confirmBox('Log out of MCP Fantasy?');
    if (ok) await resetSession();
  };

  const doDelete = async () => {
    const ok = await confirmBox('Delete your account? Your entries and coins will be removed permanently. This cannot be undone.');
    if (!ok) return;
    try {
      await rpc('mcp_delete_my_account', {});
      await resetSession();
      notify('Your account has been deleted.');
    } catch (e) {
      notify(e.message);
    }
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

  const find = (id) => (id ? movies.find((m) => m.id === id) || null : null);
  const screenMovie = screen ? find(screen.id) : null;
  const screenEntries = screenMovie ? entries.filter((e) => e.movie_id === screenMovie.id) : [];
  const joinMovie = join ? find(join.id) : null;
  const joinEntry = join && join.entryId ? entries.find((e) => e.id === join.entryId) || null : null;
  const trailerMovie = find(trailerId);
  const unseen = notifs.length > 0 && notifs[0].id > seenId;
  const isAdmin = !!(profile && profile.is_admin);
  const joinedMap = {};
  entries.forEach((e) => { joinedMap[e.movie_id] = (joinedMap[e.movie_id] || 0) + 1; });
  const maxEntries = Number(settings.max_entries_per_movie || 4);
  // Movies whose release day is over but results are not declared yet (admin reminder)
  const pendingResults = isAdmin ? movies.filter((m) => !m.settled_at && Date.now() >= new Date(m.lock_at).getTime() + 86400000) : [];

  if (!splashDone) return <Splash onFinish={() => setSplashDone(true)} />;
  if (booting) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  if (!loggedIn) return <AuthScreen onLoggedIn={() => setLoggedIn(true)} />;

  if (profile && !profile.terms_accepted_at) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 18 }}>
          <View style={styles.authCard}>
            <Text style={styles.authLogo}>📜 Terms & Privacy</Text>
            <Text style={{ color: '#ccc', fontSize: 12, marginVertical: 12 }}>To continue, confirm you are 18 or older and accept the Terms and Privacy Policy.</Text>
            <Btn title="Read" color="#333" onPress={() => setTermsOpen(true)} style={{ marginBottom: 8 }} />
            <Btn title="I am 18+ and I accept" onPress={acceptTerms} />
            <Btn title="Log out" color="#333" onPress={doLogout} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
        <TermsModal visible={termsOpen} onClose={() => setTermsOpen(false)} />
      </SafeAreaView>
    );
  }

  const tabItem = (key, label) => (
    <TouchableOpacity style={[styles.tabItem, tab === key && styles.activeTab]} onPress={() => setTab(key)}>
      <Text style={styles.tabText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.logoText}>🎬 MCP Fantasy</Text>
          <Text style={{ color: C.sub, fontSize: 10 }}>{'👤 ' + (profile ? profile.name : '') + (isAdmin ? ' (Admin)' : '')}</Text>
        </View>
        <TouchableOpacity onPress={() => setTab('coins')} style={{ backgroundColor: '#2a2208', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, marginRight: 12, borderWidth: 1, borderColor: C.gold }}>
          <Text style={{ color: C.gold, fontWeight: 'bold', fontSize: 12 }}>{'🪙 ' + fmtNum(profile ? profile.coins : 0)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginRight: 6 }} onPress={() => setNotifOpen(true)}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
          {unseen ? <View style={{ position: 'absolute', right: 0, top: 0, width: 7, height: 7, borderRadius: 4, backgroundColor: C.red }} /> : null}
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {tabItem('contests', '🔥 Contests')}
        {tabItem('my', '🎯 My Contests')}
        {tabItem('coins', '🪙 Coins')}
        {tabItem('profile', '👤 Profile')}
        {isAdmin ? (
          <TouchableOpacity style={[styles.tabItem, tab === 'admin' && styles.activeTab]} onPress={() => { setAdminStart('overview'); setTab('admin'); }}>
            <Text style={{ color: C.red, fontWeight: 'bold', fontSize: 11 }}>{'⚡ Admin' + (pendingResults.length > 0 ? ' (' + pendingResults.length + ')' : '')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {pendingResults.length > 0 && tab !== 'admin' ? (
        <TouchableOpacity onPress={() => { setAdminStart('results'); setTab('admin'); }} style={{ backgroundColor: '#5a1010', padding: 10, borderBottomWidth: 1, borderBottomColor: '#7a1a1a' }}>
          <Text style={{ color: '#ffb4b4', fontSize: 12, fontWeight: 'bold' }}>{'⏰ Declare results: ' + pendingResults.map((m) => m.title).join(', ') + '  (tap here)'}</Text>
        </TouchableOpacity>
      ) : null}

      {tab === 'contests' ? (
        <MoviesTab
          movies={movies}
          counts={counts}
          joined={joinedMap}
          maxEntries={maxEntries}
          sponsors={sponsors}
          loading={loadingFirst}
          category={category}
          onCategory={setCategory}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onOpen={(m) => {
            if (isLocked(m)) setScreen({ id: m.id, tab: m.settled_at ? 'leaderboard' : 'prizes' });
            else if ((joinedMap[m.id] || 0) >= maxEntries) {
              notify('You have used all ' + maxEntries + ' entries for this movie. You can edit them or see the leaderboard in My Contests.');
              setTab('my');
            } else {
              setJoin({ id: m.id, entryId: null });
            }
          }}
          onTrailer={(m) => setTrailerId(m.id)}
        />
      ) : null}
      {tab === 'my' ? (
        <MyContestsTab
          entries={entries}
          movies={movies}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onOpen={(m) => setScreen({ id: m.id, tab: m.settled_at ? 'leaderboard' : 'prizes' })}
          onEdit={(m, en) => setJoin({ id: m.id, entryId: en.id })}
        />
      ) : null}
      {tab === 'coins' ? <CoinsTab coins={profile ? Number(profile.coins) : 0} rewards={rewards} settings={settings} onChanged={() => loadAll(true)} /> : null}
      {tab === 'profile' ? <ProfileTab profile={profile} settings={settings} onTerms={() => setTermsOpen(true)} onLogout={doLogout} onDelete={doDelete} /> : null}
      {tab === 'admin' && isAdmin ? <Admin movies={movies} start={adminStart} onChanged={() => loadAll(true)} /> : null}

      <MovieScreen
        visible={!!screenMovie}
        movie={screenMovie}
        entries={screenEntries}
        maxEntries={maxEntries}
        tiers={tiers}
        count={screenMovie ? counts[screenMovie.id] || 0 : 0}
        initialTab={screen ? screen.tab : 'prizes'}
        onClose={() => setScreen(null)}
        onJoin={(m, en) => setJoin({ id: m.id, entryId: en ? en.id : null })}
        onTrailer={(m) => setTrailerId(m.id)}
      />
      <JoinModal
        visible={!!joinMovie}
        movie={joinMovie}
        entry={joinEntry}
        used={joinMovie ? joinedMap[joinMovie.id] || 0 : 0}
        max={maxEntries}
        requireAd={settings.join_requires_ad === '1'}
        topPrize={tiers.length > 0 ? tiers[0].coins : 0}
        onTrailer={(m) => setTrailerId(m.id)}
        onClose={() => setJoin(null)}
        onDone={() => { setJoin(null); loadAll(true); }}
      />
      <TrailerPlayer visible={!!trailerMovie} url={trailerMovie ? trailerMovie.trailer_url : ''} title={trailerMovie ? trailerMovie.title : ''} onClose={() => setTrailerId(null)} />
      <NotificationsModal visible={notifOpen} notifs={notifs} onClose={() => { setNotifOpen(false); markSeen(); }} />
      <TermsModal visible={termsOpen} onClose={() => setTermsOpen(false)} />
      <AdHost />
    </SafeAreaView>
  );
}
