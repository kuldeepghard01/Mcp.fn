import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Share } from 'react-native';
import { C, notify, confirmBox, Btn, Field, Chips, Sheet, Tag, dateText } from './ui';
import { rpc } from './api';
import { CURRENCIES, curInfo, fmt, isLocked, TERMS } from './constants';

// ---------- Movie ke contests ----------
export function MovieDetailModal({ visible, movie, entries, onClose, onJoin, onBoard, onRooms }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const movieId = movie ? movie.id : null;

  useEffect(() => {
    if (!visible || !movieId) return;
    let alive = true;
    setLoading(true);
    rpc('mcp_contest_stats', { p_movie: movieId })
      .then((r) => { if (alive) setStats(r || []); })
      .catch((e) => { if (alive) notify(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [visible, movieId]);

  if (!movie) return null;
  const locked = isLocked(movie);
  const joined = (cur) => (entries || []).some((e) => e.movie_id === movie.id && e.cur === cur && !e.room_code);

  return (
    <Sheet visible={visible} title={'🎬 ' + movie.title} onClose={onClose}>
      <Text style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
        {'📅 Release: ' + movie.release_date + (locked ? '  (contest locked)' : '  (is din 12 AM par lock)')}
      </Text>
      {movie.actual_collection !== null && movie.actual_collection !== undefined ? (
        <View style={{ backgroundColor: '#122e1e', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: C.green }}>
          <Text style={{ color: C.sub, fontSize: 10 }}>DAY 1 OFFICIAL COLLECTION</Text>
          <Text style={{ color: C.green, fontSize: 20, fontWeight: 'bold' }}>{fmt(movie.actual_collection) + ' Cr'}</Text>
        </View>
      ) : null}
      {loading ? <ActivityIndicator color={C.red} style={{ marginVertical: 16 }} /> : null}
      {stats.map((s) => {
        const info = curInfo(s.cur);
        const mine = joined(s.cur);
        return (
          <View key={s.cur} style={{ backgroundColor: C.card, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: info.color }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: info.color, fontSize: 15, fontWeight: 'bold' }}>{info.icon + ' ' + info.label + ' Contest'}</Text>
              {mine ? <Tag text="✅ Joined" color="#1b5e20" /> : null}
            </View>
            <Text style={{ color: C.sub, fontSize: 11, marginTop: 6 }}>{'Entry: 1 ' + info.label}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ color: '#ddd', fontSize: 12 }}>{'👥 Players: ' + s.entries}</Text>
              <Text style={{ color: C.gold, fontSize: 12, fontWeight: 'bold' }}>{'🏆 Prize Pool: ' + fmt(s.prize_pool) + ' ' + info.icon}</Text>
            </View>
            <Text style={{ color: '#777', fontSize: 10, marginTop: 4 }}>Rank 1: 50%  |  Rank 2-8: 30%  |  Rank 9-25: 20%</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              {!locked && !mine ? (
                <Btn title="Join Contest" style={{ flex: 1, marginRight: 6 }} onPress={() => onJoin(s.cur)} />
              ) : null}
              {!locked && mine ? (
                <Btn title="✏️ Edit (My Contests)" color="#333" style={{ flex: 1, marginRight: 6 }} onPress={onClose} />
              ) : null}
              {locked ? <Btn title="🔒 Locked" color="#333" disabled style={{ flex: 1, marginRight: 6 }} /> : null}
              <Btn title={s.settled ? '🏆 Results' : '📊 Leaderboard'} color={C.blue} style={{ flex: 1 }} onPress={() => onBoard(s.cur, null)} />
            </View>
          </View>
        );
      })}
      <Btn title="🔑 Private Room (dosto ke saath)" color="#6a1b9a" onPress={onRooms} style={{ marginTop: 4, marginBottom: 6 }} />
    </Sheet>
  );
}

// ---------- Prediction lagana / badalna ----------
export function PredictModal({ visible, movie, cur, room, entry, balances, onClose, onDone, onNeedFunds }) {
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setVal(entry ? String(entry.prediction) : '');
    setBusy(false);
    setRoomInfo(null);
    if (room) {
      rpc('mcp_get_room', { p_code: room })
        .then((r) => { if (r && r[0]) setRoomInfo(r[0]); })
        .catch(() => {});
    }
  }, [visible, room, entry && entry.id]);

  if (!movie) return null;
  const useCur = room && roomInfo ? roomInfo.cur : cur;
  const fee = room ? (roomInfo ? Number(roomInfo.fee) : 1) : 1;
  const info = curInfo(useCur);
  const have = Number((balances || {})[useCur] || 0);
  const isEdit = !!entry;

  const submit = async () => {
    const v = parseFloat(val);
    if (isNaN(v) || v < 0 || v > 5000) { notify('Sahi collection daalein (0 se 5000 Cr tak).'); return; }
    if (!isEdit) {
      if (have < fee) { notify('Aapke paas ' + info.label + ' kam hain. Pehle wallet se ' + info.label + ' kharidein.'); return; }
      const ok = await confirmBox(fmt(fee) + ' ' + info.label + ' kat kar prediction ' + fmt(v) + ' Cr lagayein?');
      if (!ok) return;
    }
    setBusy(true);
    try {
      if (isEdit) {
        await rpc('mcp_edit_entry', { p_entry: entry.id, p_prediction: v });
      } else {
        await rpc('mcp_join_contest', { p_movie: movie.id, p_cur: useCur, p_prediction: v, p_room: room || null });
      }
      notify(isEdit ? 'Prediction badal gayi.' : 'Contest join ho gaya! Best of luck.');
      onDone();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title={isEdit ? '✏️ Prediction badlein' : '🎯 Prediction lagayein'} onClose={onClose}>
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{movie.title}</Text>
      <Text style={{ color: info.color, fontSize: 12, marginVertical: 4 }}>
        {(room ? 'Room ' + room + ' | ' : '') + info.icon + ' ' + info.label + ' contest | Entry: ' + fmt(fee) + ' ' + info.label}
      </Text>
      {!isEdit ? (
        <Text style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
          {'Aapke paas: ' + fmt(have) + ' ' + info.icon}
        </Text>
      ) : null}
      <Field label="Day 1 collection (Crore mein)" value={val} onChangeText={setVal} keyboardType="decimal-pad" placeholder="Jaise 12.5" maxLength={8} />
      <Btn title={busy ? 'Please wait...' : (isEdit ? 'Update Prediction' : 'Confirm & Join')} onPress={submit} disabled={busy} />
      {!isEdit && have < fee ? (
        <Btn title="👛 Wallet kholein" color="#333" style={{ marginTop: 8 }} onPress={onNeedFunds} />
      ) : null}
      <Text style={{ color: '#777', fontSize: 10, marginTop: 10 }}>
        Contest lock hone ke baad prediction badal nahi sakte. Lock hone par sabki prediction leaderboard me dikhti hai.
      </Text>
    </Sheet>
  );
}

// ---------- Leaderboard / Results ----------
export function LeaderboardModal({ visible, movie, cur, room, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pool, setPool] = useState(null);
  const movieId = movie ? movie.id : null;

  useEffect(() => {
    if (!visible || !movieId) return;
    let alive = true;
    setLoading(true);
    setRows([]);
    setPool(null);
    (async () => {
      try {
        const r = await rpc('mcp_leaderboard', { p_movie: movieId, p_cur: cur, p_room: room || null });
        if (alive) setRows(r || []);
        if (room) {
          const g = await rpc('mcp_get_room', { p_code: room });
          if (alive && g && g[0]) setPool({ players: Number(g[0].joined), pool: Number(g[0].joined) * Number(g[0].fee) * 0.8, cur: g[0].cur });
        } else {
          const s = await rpc('mcp_contest_stats', { p_movie: movieId });
          const one = (s || []).find((x) => x.cur === cur);
          if (alive && one) setPool({ players: Number(one.entries), pool: Number(one.prize_pool), cur: cur });
        }
      } catch (e) {
        if (alive) notify(e.message);
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [visible, movieId, cur, room]);

  if (!movie) return null;
  const locked = isLocked(movie);
  const info = curInfo(pool ? pool.cur : cur);
  const settled = rows.some((r) => Number(r.prize) > 0);

  return (
    <Sheet visible={visible} title={'📊 ' + movie.title} onClose={onClose}>
      <Text style={{ color: info.color, fontSize: 12, fontWeight: 'bold' }}>
        {(room ? 'Private Room ' + room : info.label + ' Contest')}
      </Text>
      {pool ? (
        <Text style={{ color: C.gold, fontSize: 12, marginVertical: 4 }}>
          {'👥 ' + pool.players + ' players  |  🏆 Pool: ' + fmt(pool.pool) + ' ' + info.icon}
        </Text>
      ) : null}
      {movie.actual_collection !== null && movie.actual_collection !== undefined ? (
        <Text style={{ color: C.green, fontSize: 12, marginBottom: 6 }}>{'Day 1 Official: ' + fmt(movie.actual_collection) + ' Cr'}</Text>
      ) : null}
      {!locked ? (
        <Text style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
          Contest abhi open hai. Dusron ki prediction lock hone ke baad dikhegi. Neeche sirf aapki entry hai.
        </Text>
      ) : null}
      {loading ? <ActivityIndicator color={C.red} style={{ marginVertical: 16 }} /> : null}
      {!loading && rows.length === 0 ? (
        <Text style={{ color: C.sub, textAlign: 'center', marginVertical: 20 }}>Abhi koi entry nahi.</Text>
      ) : null}
      {rows.map((r, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: r.is_me ? '#1a2a3a' : C.card,
            padding: 10, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: r.is_me ? C.blue : '#282828',
          }}
        >
          <Text style={{ color: C.gold, fontWeight: 'bold', width: 34 }}>{settled ? ('#' + r.pos) : '•'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{r.player + (r.is_me ? ' (You)' : '')}</Text>
            <Text style={{ color: C.sub, fontSize: 11 }}>
              {'Prediction: ' + fmt(r.prediction) + ' Cr' + (r.diff !== null && r.diff !== undefined ? '  |  Farak: ' + fmt(r.diff) : '')}
            </Text>
          </View>
          {Number(r.prize) > 0 ? (
            <Text style={{ color: C.green, fontWeight: 'bold', fontSize: 13 }}>{'+' + fmt(r.prize) + ' ' + info.icon}</Text>
          ) : null}
        </View>
      ))}
    </Sheet>
  );
}

// ---------- Private Rooms ----------
export function PrivateRoomModal({ visible, movie, onClose, onJoinRoom, onBoard }) {
  const [code, setCode] = useState('');
  const [cur, setCur] = useState('coin');
  const [fee, setFee] = useState('1');
  const [spots, setSpots] = useState('10');
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState([]);
  const [created, setCreated] = useState('');

  const load = async () => {
    try {
      const r = await rpc('mcp_my_rooms', {});
      setMine((r || []).filter((x) => !movie || x.movie_id === movie.id));
    } catch (e) {}
  };

  useEffect(() => {
    if (visible) { setCode(''); setCreated(''); load(); }
  }, [visible, movie && movie.id]);

  const join = async (c) => {
    const clean = String(c || '').trim().toUpperCase();
    if (clean.length < 4) { notify('Room code daalein.'); return; }
    setBusy(true);
    try {
      const r = await rpc('mcp_get_room', { p_code: clean });
      if (!r || !r[0]) { notify('Ye room nahi mila. Code check karein.'); }
      else if (r[0].locked) { notify('Is room ka contest lock ho chuka hai.'); }
      else if (Number(r[0].joined) >= Number(r[0].spots)) { notify('Room full hai.'); }
      else { onJoinRoom(r[0]); }
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const create = async () => {
    const f = parseFloat(fee);
    const s = parseInt(spots, 10);
    if (isNaN(f) || f < 1 || f > 1000) { notify('Entry 1 se 1000 ke beech rakhein.'); return; }
    if (isNaN(s) || s < 2 || s > 100) { notify('Spots 2 se 100 ke beech rakhein.'); return; }
    setBusy(true);
    try {
      const c = await rpc('mcp_create_room', { p_movie: movie.id, p_cur: cur, p_fee: f, p_spots: s });
      setCreated(c);
      load();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const shareCode = async (c) => {
    try {
      await Share.share({ message: 'MCP Fantasy me mere private room me join karo! Movie: ' + (movie ? movie.title : '') + ' | Room code: ' + c });
    } catch (e) {}
  };

  return (
    <Sheet visible={visible} title="🔑 Private Rooms" onClose={onClose}>
      <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 6 }}>Room code se join karein</Text>
      <Field value={code} onChangeText={setCode} placeholder="PR-XXXXXX" autoCapitalize="characters" maxLength={12} />
      <Btn title="Join Room" onPress={() => join(code)} disabled={busy} color="#6a1b9a" />

      {movie ? (
        <View style={{ marginTop: 18 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 6 }}>{'Naya room banayein: ' + movie.title}</Text>
          <Chips
            options={CURRENCIES.map((c) => ({ key: c.cur, label: c.icon + ' ' + c.label }))}
            value={cur}
            onChange={setCur}
          />
          <Field label="Entry (kitne units)" value={fee} onChangeText={setFee} keyboardType="decimal-pad" maxLength={6} />
          <Field label="Kitne players (2 se 100)" value={spots} onChangeText={setSpots} keyboardType="number-pad" maxLength={3} />
          <Btn title="Room Banayein" onPress={create} disabled={busy} />
          {created ? (
            <View style={{ backgroundColor: '#122e1e', padding: 10, borderRadius: 8, marginTop: 10 }}>
              <Text style={{ color: C.green, fontWeight: 'bold' }}>{'Room ban gaya: ' + created}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <Btn title="📤 Share Code" small color={C.blue} onPress={() => shareCode(created)} style={{ marginRight: 8 }} />
                <Btn title="Khud join karein" small onPress={() => join(created)} />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 18, marginBottom: 6 }}>Mere rooms</Text>
      {mine.length === 0 ? <Text style={{ color: C.sub, fontSize: 12 }}>Abhi koi room nahi.</Text> : null}
      {mine.map((r) => {
        const info = curInfo(r.cur);
        return (
          <View key={r.code} style={{ backgroundColor: C.card, padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#282828' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{r.code + (r.created_by_me ? '  (Aapka)' : '')}</Text>
            <Text style={{ color: C.sub, fontSize: 11 }}>{r.movie_title}</Text>
            <Text style={{ color: info.color, fontSize: 11 }}>
              {info.icon + ' Entry ' + fmt(r.fee) + ' | Players ' + r.joined + '/' + r.spots + (r.locked ? ' | Locked' : '')}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 6 }}>
              <Btn title="📤 Share" small color="#333" onPress={() => shareCode(r.code)} style={{ marginRight: 8 }} />
              <Btn title="📊 Leaderboard" small color={C.blue} onPress={() => onBoard(r)} />
            </View>
          </View>
        );
      })}
    </Sheet>
  );
}

// ---------- Notifications ----------
export function NotificationsModal({ visible, notifs, onClose }) {
  return (
    <Sheet visible={visible} title="🔔 Notifications" onClose={onClose}>
      {(!notifs || notifs.length === 0) ? (
        <Text style={{ color: C.sub, textAlign: 'center', marginVertical: 20 }}>Abhi koi notification nahi.</Text>
      ) : null}
      {(notifs || []).map((n) => (
        <View key={n.id} style={{ backgroundColor: C.card, padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#282828' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{n.title}</Text>
          <Text style={{ color: '#ccc', fontSize: 12, marginTop: 2 }}>{n.message}</Text>
          <Text style={{ color: '#666', fontSize: 10, marginTop: 4 }}>{dateText(n.created_at)}</Text>
        </View>
      ))}
    </Sheet>
  );
}

// ---------- Terms & Conditions ----------
export function TermsModal({ visible, onClose }) {
  return (
    <Sheet visible={visible} title="📜 Terms & Conditions" onClose={onClose}>
      {TERMS.map((s) => (
        <View key={s.h} style={{ marginBottom: 12 }}>
          <Text style={{ color: C.gold, fontWeight: 'bold', fontSize: 13 }}>{s.h}</Text>
          <Text style={{ color: '#ccc', fontSize: 12, marginTop: 3, lineHeight: 18 }}>{s.t}</Text>
        </View>
      ))}
    </Sheet>
  );
}

// ---------- Settings ----------
export function SettingsModal({ visible, onClose, onTerms, onLogout, appVersion }) {
  return (
    <Sheet visible={visible} title="⚙️ Settings" onClose={onClose}>
      <TouchableOpacity onPress={onTerms} style={{ backgroundColor: C.card, padding: 14, borderRadius: 8, marginBottom: 8 }}>
        <Text style={{ color: '#fff', fontSize: 13 }}>📜 Terms & Conditions / Privacy / Responsible Gaming</Text>
      </TouchableOpacity>
      <View style={{ backgroundColor: C.card, padding: 14, borderRadius: 8, marginBottom: 8 }}>
        <Text style={{ color: '#fff', fontSize: 13 }}>ℹ️ MCP Fantasy</Text>
        <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{'Movie Collection Prediction  |  Version ' + appVersion}</Text>
      </View>
      <Btn title="🚪 Logout" color="#333" onPress={onLogout} style={{ marginTop: 6 }} />
    </Sheet>
  );
}
