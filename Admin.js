import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { C, notify, confirmBox, Btn, Field, Chips, Tag, dateText } from './ui';
import { rpc, select, uploadBanner } from './api';
import { CURRENCIES, CATEGORIES, curInfo, fmt, isLocked, TMDB_KEY } from './constants';

const box = { backgroundColor: C.card, padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#282828' };
const head = { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8 };

// ---------- Overview ----------
function AdminOverview() {
  const [data, setData] = useState(null);
  const load = async () => {
    try { setData(await rpc('mcp_admin_overview', {})); } catch (e) { notify(e.message); }
  };
  useEffect(() => { load(); }, []);
  const house = (data && data.house) || {};
  const hold = (data && data.users_hold) || {};
  return (
    <View>
      <View style={box}>
        <Text style={head}>💼 Aapki kamai (20% commission)</Text>
        {CURRENCIES.map((c) => (
          <Text key={c.cur} style={{ color: c.color, fontSize: 15, fontWeight: 'bold', marginBottom: 2 }}>
            {c.icon + ' ' + c.label + ': ' + fmt(house[c.cur] || 0) + '  (= Rs ' + fmt(Number(house[c.cur] || 0) * c.rupees) + ')'}
          </Text>
        ))}
      </View>
      <View style={box}>
        <Text style={head}>👥 Users ke paas kul balance</Text>
        {CURRENCIES.map((c) => (
          <Text key={c.cur} style={{ color: '#ddd', fontSize: 13 }}>{c.icon + ' ' + c.label + ': ' + fmt(hold[c.cur] || 0)}</Text>
        ))}
      </View>
      <View style={box}>
        <Text style={{ color: '#ddd', fontSize: 13 }}>{'Total users: ' + (data ? data.users : '-')}</Text>
        <Text style={{ color: '#ddd', fontSize: 13 }}>{'Pending kharidari requests: ' + (data ? data.pending_deposits : '-')}</Text>
        <Text style={{ color: '#ddd', fontSize: 13 }}>{'Pending redeem requests: ' + (data ? data.pending_withdrawals : '-')}</Text>
      </View>
      <Btn title="🔄 Refresh" color="#333" onPress={load} />
    </View>
  );
}

// ---------- Movies ----------
function AdminMovies({ movies, onChanged }) {
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bollywood');
  const [release, setRelease] = useState('');
  const [trailer, setTrailer] = useState('');
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setEditId(null); setTitle(''); setCategory('Bollywood'); setRelease(''); setTrailer(''); setBanner('');
  };

  const autoFill = async () => {
    if (!title.trim()) { notify('Pehle movie ka naam likhein.'); return; }
    setBusy(true);
    try {
      const res = await fetch('https://api.themoviedb.org/3/search/movie?api_key=' + TMDB_KEY + '&query=' + encodeURIComponent(title.trim()));
      const d = await res.json();
      if (d && d.results && d.results.length > 0) {
        const m = d.results[0];
        if (m.title) setTitle(m.title);
        if (m.release_date) setRelease(m.release_date);
        if (m.poster_path) setBanner('https://image.tmdb.org/t/p/w500' + m.poster_path);
        notify('Details mil gayi. Check karke Save karein.');
      } else {
        notify('Movie nahi mili. Khud bharein.');
      }
    } catch (e) {
      notify('Auto-fill nahi ho paya. Internet check karein.');
    }
    setBusy(false);
  };

  const pickBanner = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.6 });
      if (r.canceled || !r.assets || r.assets.length === 0) return;
      setBusy(true);
      const url = await uploadBanner(r.assets[0].uri);
      setBanner(url);
      notify('Banner upload ho gaya.');
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const save = async () => {
    if (!title.trim()) { notify('Movie ka naam likhein.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(release.trim())) { notify('Date YYYY-MM-DD me daalein (jaise 2026-10-10).'); return; }
    setBusy(true);
    try {
      await rpc('mcp_admin_save_movie', {
        p_id: editId, p_title: title, p_category: category, p_release: release.trim(),
        p_banner: banner.trim() || null, p_trailer: trailer.trim() || null,
      });
      notify(editId ? 'Movie update ho gayi.' : 'Movie publish ho gayi.');
      reset();
      onChanged();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const edit = (m) => {
    setEditId(m.id); setTitle(m.title); setCategory(m.category); setRelease(m.release_date);
    setTrailer(m.trailer_url || ''); setBanner(m.banner_url || '');
  };

  const del = async (m) => {
    const ok = await confirmBox(m.title + ' delete karein? Jis contest ka result nahi aaya uski entries wapas ho jayengi.');
    if (!ok) return;
    try {
      await rpc('mcp_admin_delete_movie', { p_id: m.id });
      notify('Movie delete ho gayi.');
      onChanged();
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <View>
      <View style={box}>
        <Text style={head}>{editId ? '✏️ Movie edit karein' : '➕ Nayi movie'}</Text>
        <Field label="Movie ka naam" value={title} onChangeText={setTitle} autoCapitalize="words" />
        <Btn title="🔍 Auto-fill (naam, date, poster)" small color={C.blue} onPress={autoFill} disabled={busy} style={{ marginBottom: 10 }} />
        <Chips options={CATEGORIES.map((c) => ({ key: c, label: c }))} value={category} onChange={setCategory} />
        <Field label="Release date (YYYY-MM-DD)" value={release} onChangeText={setRelease} placeholder="2026-10-10" maxLength={10} />
        <Field label="Trailer link (YouTube)" value={trailer} onChangeText={setTrailer} />
        <Field label="Banner link (ya neeche se gallery se chunein)" value={banner} onChangeText={setBanner} />
        {banner ? <Image source={{ uri: banner }} style={{ width: '100%', height: 140, borderRadius: 8, marginBottom: 8, backgroundColor: '#222' }} resizeMode="cover" /> : null}
        <Btn title="🖼 Gallery se banner chunein" small color="#333" onPress={pickBanner} disabled={busy} style={{ marginBottom: 10 }} />
        <Text style={{ color: '#777', fontSize: 10, marginBottom: 8 }}>Release date shuru hote hi (12 AM IST) is movie ke saare contest lock ho jayenge.</Text>
        <View style={{ flexDirection: 'row' }}>
          <Btn title={busy ? 'Please wait...' : (editId ? 'Update' : 'Publish')} onPress={save} disabled={busy} style={{ flex: 1, marginRight: 6 }} />
          {editId ? <Btn title="Cancel" color="#333" onPress={reset} style={{ flex: 1 }} /> : null}
        </View>
      </View>
      <Text style={head}>🎬 Saari movies</Text>
      {movies.map((m) => (
        <View key={m.id} style={box}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{m.title}</Text>
          <Text style={{ color: C.sub, fontSize: 11 }}>{m.category + ' | ' + m.release_date + (isLocked(m) ? ' | Locked' : ' | Open')}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Btn title="✏️ Edit" small color={C.blue} onPress={() => edit(m)} style={{ marginRight: 8 }} />
            <Btn title="🗑 Delete" small color="#b71c1c" onPress={() => del(m)} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------- Winners declare ----------
function AdminWinners({ movies, onChanged }) {
  const lockedMovies = movies.filter((m) => isLocked(m));
  const [movieId, setMovieId] = useState(null);
  const [actual, setActual] = useState('');
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState([]);
  const [setts, setSetts] = useState([]);
  const [winners, setWinners] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async (id) => {
    try {
      const r = (await select('mcp_rooms', 'movie_id=eq.' + id + '&select=code,cur,fee,spots')) || [];
      const withCount = await Promise.all(r.map(async (x) => {
        try {
          const g = await rpc('mcp_get_room', { p_code: x.code });
          return { ...x, joined: g && g[0] ? Number(g[0].joined) : 0 };
        } catch (e) {
          return { ...x, joined: 0 };
        }
      }));
      setRooms(withCount);
      setStats((await rpc('mcp_contest_stats', { p_movie: id })) || []);
      setSetts((await select('mcp_settlements', 'movie_id=eq.' + id + '&select=cur,room_code,refunded,entries_count,prize_pool,commission')) || []);
      setWinners((await rpc('mcp_admin_winners', { p_movie: id })) || []);
    } catch (e) {
      notify(e.message);
    }
  };

  const choose = (m) => {
    setMovieId(m.id);
    setActual(m.actual_collection !== null && m.actual_collection !== undefined ? String(m.actual_collection) : '');
    setRooms([]); setStats([]); setSetts([]); setWinners([]);
    load(m.id);
  };

  const contests = [
    ...stats.map((s) => ({ key: s.cur + '|', cur: s.cur, room: null, label: curInfo(s.cur).icon + ' ' + curInfo(s.cur).label + ' Contest', entries: Number(s.entries) })),
    ...rooms.map((r) => ({ key: r.cur + '|' + r.code, cur: r.cur, room: r.code, label: '🔑 Room ' + r.code + ' (' + curInfo(r.cur).icon + ' ' + fmt(r.fee) + ')', entries: r.joined })),
  ];
  const settledOf = (c) => setts.find((x) => x.cur === c.cur && (x.room_code || '') === (c.room || ''));

  const declare = async (c, silent) => {
    const a = parseFloat(actual);
    if (isNaN(a) || a < 0) { notify('Pehle actual Day 1 collection (Cr) daalein.'); return false; }
    if (!silent) {
      const ok = await confirmBox(c.label + ' ke winners ' + fmt(a) + ' Cr ke hisaab se declare karein? Ye dobara badla nahi ja sakta.');
      if (!ok) return false;
    }
    try {
      const r = await rpc('mcp_admin_settle', { p_movie: movieId, p_cur: c.cur, p_room: c.room, p_actual: a });
      if (!silent) {
        notify(r && r.refunded ? 'Players kam the, sabki entry wapas kar di gayi.' : 'Winners declare ho gaye. Prize ' + fmt(r.paid) + ', aapki commission ' + fmt(r.commission) + '.');
      }
      return true;
    } catch (e) {
      notify(e.message);
      return false;
    }
  };

  const declareOne = async (c) => {
    setBusy(true);
    const ok = await declare(c, false);
    if (ok) { await load(movieId); onChanged(); }
    setBusy(false);
  };

  const declareAll = async () => {
    const todo = contests.filter((c) => !settledOf(c) && c.entries > 0);
    if (todo.length === 0) { notify('Declare karne ke liye koi contest baaki nahi.'); return; }
    const a = parseFloat(actual);
    if (isNaN(a) || a < 0) { notify('Pehle actual Day 1 collection (Cr) daalein.'); return; }
    const ok = await confirmBox(String(todo.length) + ' contest ke winners ' + fmt(a) + ' Cr ke hisaab se declare karein?');
    if (!ok) return;
    setBusy(true);
    let done = 0;
    for (const c of todo) {
      const good = await declare(c, true);
      if (good) done += 1; else break;
    }
    notify(String(done) + ' contest ke winners declare ho gaye.');
    await load(movieId);
    onChanged();
    setBusy(false);
  };

  const winnersOf = (c) => winners.filter((w) => w.cur === c.cur && (w.room_code || '') === (c.room || '') && Number(w.prize) > 0);

  return (
    <View>
      <Text style={head}>1. Movie chunein (sirf lock ho chuki)</Text>
      {lockedMovies.length === 0 ? <Text style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>Abhi koi movie lock nahi hui.</Text> : null}
      <Chips options={lockedMovies.map((m) => ({ key: m.id, label: m.title }))} value={movieId} onChange={(id) => choose(movies.find((m) => m.id === id))} />
      {movieId ? (
        <View>
          <View style={box}>
            <Text style={head}>2. Actual Day 1 collection</Text>
            <Field label="Collection (Crore)" value={actual} onChangeText={setActual} keyboardType="decimal-pad" placeholder="Jaise 14.25" maxLength={8} />
            <Btn title={busy ? 'Please wait...' : '🏆 Saare contest ke winners declare karein'} onPress={declareAll} disabled={busy} />
          </View>
          <Text style={head}>3. Har contest alag se</Text>
          {contests.map((c) => {
            const st = settledOf(c);
            const w = winnersOf(c);
            return (
              <View key={c.key} style={box}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{c.label}</Text>
                <Text style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>{'Players: ' + c.entries}</Text>
                {st ? (
                  <View>
                    <Tag text={st.refunded ? 'REFUND (kam players)' : 'DECLARED'} color={st.refunded ? '#8d6e00' : '#1b5e20'} />
                    {!st.refunded ? <Text style={{ color: C.gold, fontSize: 11, marginTop: 4 }}>{'Pool ' + fmt(st.prize_pool) + ' | Commission ' + fmt(st.commission)}</Text> : null}
                  </View>
                ) : (
                  <Btn title="Declare winners" small onPress={() => declareOne(c)} disabled={busy || c.entries === 0} />
                )}
                {w.map((x, i) => (
                  <Text key={i} style={{ color: '#ddd', fontSize: 11, marginTop: 4 }}>
                    {'#' + x.pos + ' ' + x.player + ' (' + (x.phone || '-') + ')  ' + fmt(x.prediction) + ' Cr  +' + fmt(x.prize) + ' ' + curInfo(c.cur).icon}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ---------- Requests (kharidari + redeem) ----------
function AdminRequests({ onChanged }) {
  const [deps, setDeps] = useState([]);
  const [wds, setWds] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setDeps((await select('mcp_deposits', 'status=eq.pending&select=*,mcp_profiles(name,phone)&order=created_at.asc')) || []); } catch (e) { notify(e.message); }
    try { setWds((await select('mcp_withdrawals', 'status=eq.pending&select=*,mcp_profiles(name,phone)&order=created_at.asc')) || []); } catch (e) { notify(e.message); }
  };
  useEffect(() => { load(); }, []);

  const decideDep = async (d, approve) => {
    const ok = await confirmBox(approve ? 'Payment aa gaya? ' + d.qty + ' ' + curInfo(d.cur).label + ' add karein (Rs ' + fmt(d.rupees) + ', UTR ' + d.utr + ')?' : 'Ye request reject karein?');
    if (!ok) return;
    setBusy(true);
    try { await rpc('mcp_admin_decide_deposit', { p_id: d.id, p_approve: approve }); await load(); onChanged(); } catch (e) { notify(e.message); }
    setBusy(false);
  };

  const decideWd = async (w, pay) => {
    const ok = await confirmBox(pay ? 'Rs ' + fmt(w.rupees) + ' user ko bhej diye? (Paid mark hoga)' : 'Reject karein? Coins user ko wapas mil jayenge.');
    if (!ok) return;
    setBusy(true);
    try { await rpc('mcp_admin_decide_withdrawal', { p_id: w.id, p_pay: pay, p_note: null }); await load(); onChanged(); } catch (e) { notify(e.message); }
    setBusy(false);
  };

  return (
    <View>
      <Text style={head}>➕ Kharidari requests</Text>
      {deps.length === 0 ? <Text style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>Koi pending request nahi.</Text> : null}
      {deps.map((d) => (
        <View key={d.id} style={box}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{(d.mcp_profiles ? d.mcp_profiles.name : '') + ' (' + (d.mcp_profiles ? d.mcp_profiles.phone : '') + ')'}</Text>
          <Text style={{ color: C.gold, fontSize: 13 }}>{d.qty + ' x ' + curInfo(d.cur).icon + ' ' + curInfo(d.cur).label + ' = Rs ' + fmt(d.rupees)}</Text>
          <Text selectable style={{ color: C.sub, fontSize: 11 }}>{'UTR: ' + d.utr + '  |  ' + dateText(d.created_at)}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Btn title="✅ Approve" small color="#1b5e20" onPress={() => decideDep(d, true)} disabled={busy} style={{ marginRight: 8 }} />
            <Btn title="❌ Reject" small color="#b71c1c" onPress={() => decideDep(d, false)} disabled={busy} />
          </View>
        </View>
      ))}
      <Text style={[head, { marginTop: 10 }]}>💸 Redeem requests</Text>
      {wds.length === 0 ? <Text style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>Koi pending request nahi.</Text> : null}
      {wds.map((w) => (
        <View key={w.id} style={box}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{(w.mcp_profiles ? w.mcp_profiles.name : '') + ' (' + (w.mcp_profiles ? w.mcp_profiles.phone : '') + ')'}</Text>
          <Text style={{ color: C.gold, fontSize: 13 }}>{fmt(w.qty) + ' ' + curInfo(w.cur).icon + ' = Rs ' + fmt(w.rupees)}</Text>
          <Text selectable style={{ color: C.green, fontSize: 12, marginTop: 2 }}>{w.dest}</Text>
          <Text style={{ color: C.sub, fontSize: 10 }}>{dateText(w.created_at)}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Btn title="💸 Paid kar diya" small color="#1b5e20" onPress={() => decideWd(w, true)} disabled={busy} style={{ marginRight: 8 }} />
            <Btn title="❌ Reject" small color="#b71c1c" onPress={() => decideWd(w, false)} disabled={busy} />
          </View>
        </View>
      ))}
      <Btn title="🔄 Refresh" color="#333" onPress={load} />
    </View>
  );
}

// ---------- Users ----------
function AdminUsers() {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [sel, setSel] = useState(null);
  const [cur, setCur] = useState('coin');
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (q.trim().length < 2) { notify('Naam ya phone ke kam se kam 2 akshar daalein.'); return; }
    try { setList((await rpc('mcp_admin_find_user', { p_query: q })) || []); } catch (e) { notify(e.message); }
  };

  const apply = async () => {
    const a = parseFloat(amt);
    if (!sel) return;
    if (isNaN(a) || a === 0) { notify('Amount daalein (minus ke saath kam bhi kar sakte hain).'); return; }
    const ok = await confirmBox(sel.name + ' ke ' + curInfo(cur).label + ' me ' + fmt(a) + ' badlav karein?');
    if (!ok) return;
    setBusy(true);
    try {
      await rpc('mcp_admin_adjust_wallet', { p_user: sel.id, p_cur: cur, p_amount: a, p_note: note });
      notify('Ho gaya.');
      setAmt(''); setNote('');
      await search();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  return (
    <View>
      <Field label="User ka naam ya phone" value={q} onChangeText={setQ} />
      <Btn title="🔍 Search" onPress={search} style={{ marginBottom: 10 }} />
      {list.map((u) => (
        <View key={u.id} style={[box, sel && sel.id === u.id ? { borderColor: C.blue } : null]}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{u.name + ' (' + (u.phone || '-') + ')'}</Text>
          <Text style={{ color: C.sub, fontSize: 11 }}>{'🪙 ' + fmt(u.coins) + '   💎 ' + fmt(u.diamonds) + '   ♦️ ' + fmt(u.reds) + '   | Entries: ' + u.entries_count}</Text>
          <Btn title="Balance badlein" small color={C.blue} onPress={() => setSel(u)} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
        </View>
      ))}
      {sel ? (
        <View style={box}>
          <Text style={head}>{'Balance badlav: ' + sel.name}</Text>
          <Chips options={CURRENCIES.map((c) => ({ key: c.cur, label: c.icon + ' ' + c.label }))} value={cur} onChange={setCur} />
          <Field label="Amount (+ jodne ke liye, - ghatane ke liye)" value={amt} onChangeText={setAmt} keyboardType="numbers-and-punctuation" maxLength={8} />
          <Field label="Wajah (note)" value={note} onChangeText={setNote} />
          <Btn title={busy ? 'Please wait...' : 'Apply'} onPress={apply} disabled={busy} />
          <Text style={{ color: '#777', fontSize: 10, marginTop: 6 }}>Har badlav history me record hota hai.</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------- Notification bhejna ----------
function AdminNotify() {
  const [t, setT] = useState('');
  const [m, setM] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!t.trim() || !m.trim()) { notify('Title aur message dono likhein.'); return; }
    const ok = await confirmBox('Ye notification sabko bhejein?');
    if (!ok) return;
    setBusy(true);
    try {
      await rpc('mcp_admin_send_notification', { p_title: t, p_message: m });
      notify('Notification bhej di gayi.');
      setT(''); setM('');
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };
  return (
    <View style={box}>
      <Text style={head}>📢 Sabko notification</Text>
      <Field label="Title" value={t} onChangeText={setT} autoCapitalize="sentences" maxLength={60} />
      <Field label="Message" value={m} onChangeText={setM} multiline autoCapitalize="sentences" maxLength={300} />
      <Btn title={busy ? 'Please wait...' : 'Send'} onPress={send} disabled={busy} />
    </View>
  );
}

// ---------- Admin screen ----------
export default function Admin({ movies, onChanged }) {
  const [sec, setSec] = useState('overview');
  return (
    <ScrollView style={{ flex: 1, padding: 10 }} keyboardShouldPersistTaps="handled">
      <Chips
        options={[
          { key: 'overview', label: '📈 Overview' },
          { key: 'movies', label: '🎬 Movies' },
          { key: 'winners', label: '🏆 Winners' },
          { key: 'requests', label: '💰 Requests' },
          { key: 'users', label: '👥 Users' },
          { key: 'notify', label: '📢 Notify' },
        ]}
        value={sec}
        onChange={setSec}
      />
      {sec === 'overview' ? <AdminOverview /> : null}
      {sec === 'movies' ? <AdminMovies movies={movies} onChanged={onChanged} /> : null}
      {sec === 'winners' ? <AdminWinners movies={movies} onChanged={onChanged} /> : null}
      {sec === 'requests' ? <AdminRequests onChanged={onChanged} /> : null}
      {sec === 'users' ? <AdminUsers /> : null}
      {sec === 'notify' ? <AdminNotify /> : null}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
