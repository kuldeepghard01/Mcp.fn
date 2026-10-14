// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { C, notify, confirmBox, Btn, Field, Chips } from './ui';
import { rpc } from './api';
import { box, head } from './adminCommon';

export default function AdminEarnings() {
  const [d, setD] = useState(null);
  const [src, setSrc] = useState('AdMob');
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setD(await rpc('mcp_admin_earnings', {})); } catch (e) { notify(e.message); }
  };
  useEffect(() => { load(); }, []);

  const cur = d ? d.currency : '';
  const money = (v) => cur + ' ' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const net = (a, b) => Number(a || 0) - Number(b || 0);

  const add = async () => {
    const a = parseFloat(amt);
    if (isNaN(a) || a === 0) { notify('Enter the amount you earned.'); return; }
    setBusy(true);
    try {
      await rpc('mcp_admin_add_revenue', { p_source: src, p_amount: a, p_note: note });
      setAmt(''); setNote('');
      await load();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const remove = async (r) => {
    const ok = await confirmBox('Delete this entry (' + r.source + ' ' + r.amount + ')?');
    if (!ok) return;
    try { await rpc('mcp_admin_delete_revenue', { p_id: r.id }); await load(); } catch (e) { notify(e.message); }
  };

  const row = (label, value, color) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
      <Text style={{ color: '#ddd', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: color || '#fff', fontSize: 13, fontWeight: 'bold' }}>{value}</Text>
    </View>
  );

  return (
    <View>
      <View style={box}>
        <Text style={head}>📅 This month</Text>
        {row('Earnings you recorded', money(d && d.recorded_month), C.green)}
        {row('Ticket cost paid', money(d && d.tickets_month), '#ff8a65')}
        {row('Net', money(d ? net(d.recorded_month, d.tickets_month) : 0), C.gold)}
      </View>
      <View style={box}>
        <Text style={head}>📊 All time</Text>
        {row('Earnings you recorded', money(d && d.recorded_total), C.green)}
        {row('Ticket cost paid (' + (d ? d.tickets_count : 0) + ' tickets)', money(d && d.tickets_total), '#ff8a65')}
        {row('Net', money(d ? net(d.recorded_total, d.tickets_total) : 0), C.gold)}
      </View>
      <View style={box}>
        <Text style={head}>🧮 Estimates from app activity</Text>
        {row('Ads watched this month', String(d ? d.ads_month : 0))}
        {row('Estimated ad earnings this month', money(d && d.est_ads_month))}
        {row('Estimated ad earnings all time', money(d && d.est_ads_total))}
        {row('Value of all coins users hold', money(d && d.coin_liability), '#ff8a65')}
        <Text style={{ color: '#777', fontSize: 10, marginTop: 6 }}>
          Estimates use the values in Settings (earning per ad, value of 1 coin). Your real AdMob earnings are in the AdMob dashboard. Record them below each month so Net stays accurate.
        </Text>
      </View>

      <View style={box}>
        <Text style={head}>➕ Record earnings</Text>
        <Chips options={['AdMob', 'Brand deal', 'Other'].map((s) => ({ key: s, label: s }))} value={src} onChange={setSrc} />
        <Field label="Amount" value={amt} onChangeText={setAmt} keyboardType="decimal-pad" maxLength={10} />
        <Field label="Note (optional)" value={note} onChangeText={setNote} autoCapitalize="sentences" maxLength={200} />
        <Btn title={busy ? 'Please wait...' : 'Add'} onPress={add} disabled={busy} />
      </View>

      <Text style={head}>Recent records</Text>
      {(!d || !d.recent || d.recent.length === 0) ? <Text style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>Nothing recorded yet.</Text> : null}
      {d && d.recent ? d.recent.map((r) => (
        <View key={r.id} style={[box, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{r.source + '  ' + money(r.amount)}</Text>
            <Text style={{ color: C.sub, fontSize: 11 }}>{r.day + (r.note ? '  |  ' + r.note : '')}</Text>
          </View>
          <Btn title="🗑" small color="#b71c1c" onPress={() => remove(r)} />
        </View>
      )) : null}
      <Btn title="🔄 Refresh" color="#333" onPress={load} />
    </View>
  );
}
