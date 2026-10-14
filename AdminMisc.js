// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { C, notify, confirmBox, Btn, Field, dateText } from './ui';
import { rpc } from './api';
import { box, head } from './adminCommon';
import { fmtNum } from './constants';

const Stat = ({ label, value }) => (
  <View style={{ width: '48%', backgroundColor: C.card2, borderRadius: 8, padding: 10, marginBottom: 8 }}>
    <Text style={{ color: C.sub, fontSize: 10 }}>{label}</Text>
    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{value}</Text>
  </View>
);

export function AdminOverview() {
  const [d, setD] = useState(null);
  const load = async () => {
    try { setD(await rpc('mcp_admin_overview', {})); } catch (e) { notify(e.message); }
  };
  useEffect(() => { load(); }, []);
  const n = (k) => (d ? fmtNum(d[k]) : '-');
  return (
    <View>
      <View style={box}>
        <Text style={head}>👥 Users</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Stat label="Online now (5 min)" value={n('online_now')} />
          <Stat label="Active today (DAU)" value={n('dau')} />
          <Stat label="Active 7 days (WAU)" value={n('wau')} />
          <Stat label="Active 30 days (MAU)" value={n('mau')} />
          <Stat label="New today" value={n('new_today')} />
          <Stat label="Total users" value={n('users_total')} />
        </View>
      </View>
      <View style={box}>
        <Text style={head}>🎯 Activity and ads</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Stat label="Entries today" value={n('entries_today')} />
          <Stat label="Entries total" value={n('entries_total')} />
          <Stat label="Ads watched today" value={n('ads_today')} />
          <Stat label="Ads watched total" value={n('ads_total')} />
          <Stat label="Sponsor views" value={n('sponsor_views')} />
          <Stat label="Sponsor clicks" value={n('sponsor_clicks')} />
        </View>
        <Text style={{ color: '#777', fontSize: 10 }}>Your AdMob earnings are shown in the AdMob dashboard.</Text>
      </View>
      <View style={box}>
        <Text style={head}>🪙 Coins</Text>
        <Text style={{ color: '#ddd', fontSize: 13 }}>{'In circulation: ' + n('coins_in_circulation')}</Text>
        <Text style={{ color: '#ddd', fontSize: 13 }}>{'Paid as contest prizes: ' + n('coins_paid_prizes')}</Text>
        <Text style={{ color: '#ddd', fontSize: 13 }}>{'Paid as ad bonus: ' + n('coins_paid_ads')}</Text>
        <Text style={{ color: '#ddd', fontSize: 13 }}>{'Given as welcome bonus: ' + n('coins_paid_welcome')}</Text>
        <Text style={{ color: '#ddd', fontSize: 13 }}>{'Expired so far: ' + n('coins_expired')}</Text>
        <Text style={{ color: C.gold, fontSize: 13, marginTop: 4 }}>{'Pending ticket requests: ' + n('pending_redemptions')}</Text>
      </View>
      <Btn title="🔄 Refresh" color="#333" onPress={load} />
    </View>
  );
}

export function AdminUsers({ onChanged }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [sel, setSel] = useState(null);
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (q.trim().length < 2) { notify('Type at least 2 characters of the name, email or phone.'); return; }
    try { setList((await rpc('mcp_admin_find_user', { p_query: q })) || []); } catch (e) { notify(e.message); }
  };

  const apply = async () => {
    const a = parseInt(amt, 10);
    if (!sel) return;
    if (isNaN(a) || a === 0) { notify('Enter the number of coins (use minus to remove).'); return; }
    const ok = await confirmBox('Change coins of ' + sel.name + ' by ' + fmtNum(a) + '?');
    if (!ok) return;
    setBusy(true);
    try {
      await rpc('mcp_admin_adjust_coins', { p_user: sel.id, p_amount: a, p_note: note });
      notify('Done.');
      setAmt(''); setNote('');
      await search();
      onChanged();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  return (
    <View>
      <Field label="Search user (name, email or phone)" value={q} onChangeText={setQ} />
      <Btn title="🔍 Search" onPress={search} style={{ marginBottom: 10 }} />
      {list.map((u) => (
        <View key={u.id} style={[box, sel && sel.id === u.id ? { borderColor: C.blue } : null]}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{u.name + ' (' + (u.email || '-') + ')'}</Text>
          <Text style={{ color: C.sub, fontSize: 11 }}>{'🪙 ' + fmtNum(u.coins) + '  |  Entries: ' + u.entries_count + '  |  Phone: ' + (u.phone || '-')}</Text>
          <Text style={{ color: '#666', fontSize: 10 }}>{'Last seen: ' + (u.last_seen_at ? dateText(u.last_seen_at) : 'never')}</Text>
          <Btn title="Change coins" small color={C.blue} onPress={() => setSel(u)} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
        </View>
      ))}
      {sel ? (
        <View style={box}>
          <Text style={head}>{'Change coins: ' + sel.name}</Text>
          <Field label="Coins (+ to add, - to remove)" value={amt} onChangeText={setAmt} keyboardType="numbers-and-punctuation" maxLength={9} />
          <Field label="Reason (note)" value={note} onChangeText={setNote} />
          <Btn title={busy ? 'Please wait...' : 'Apply'} onPress={apply} disabled={busy} />
          <Text style={{ color: '#777', fontSize: 10, marginTop: 6 }}>Every change is saved in the user coin history.</Text>
        </View>
      ) : null}
    </View>
  );
}

export function AdminNotify() {
  const [t, setT] = useState('');
  const [m, setM] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!t.trim() || !m.trim()) { notify('Write both a title and a message.'); return; }
    const ok = await confirmBox('Send this notification to everyone?');
    if (!ok) return;
    setBusy(true);
    try {
      await rpc('mcp_admin_send_notification', { p_title: t, p_message: m });
      notify('Notification sent.');
      setT(''); setM('');
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };
  return (
    <View style={box}>
      <Text style={head}>📢 Notify all users</Text>
      <Field label="Title" value={t} onChangeText={setT} autoCapitalize="sentences" maxLength={80} />
      <Field label="Message" value={m} onChangeText={setM} multiline autoCapitalize="sentences" maxLength={300} />
      <Btn title={busy ? 'Please wait...' : 'Send'} onPress={send} disabled={busy} />
    </View>
  );
}
