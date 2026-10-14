// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { C, notify, confirmBox, Btn, Field, Chips, dateText } from './ui';
import { rpc } from './api';
import { box, head } from './adminCommon';
import { fmtNum } from './constants';

export default function AdminRequests({ onChanged }) {
  const [status, setStatus] = useState('pending');
  const [list, setList] = useState([]);
  const [notes, setNotes] = useState({});
  const [costs, setCosts] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setList((await rpc('mcp_admin_redemptions', { p_status: status })) || []); } catch (e) { notify(e.message); }
  };
  useEffect(() => { load(); }, [status]);

  const decide = async (r, fulfill) => {
    let cost = null;
    if (fulfill && costs[r.id]) {
      cost = parseFloat(costs[r.id]);
      if (isNaN(cost) || cost < 0) { notify('Enter the ticket cost as a number, or leave it empty.'); return; }
    }
    const ok = await confirmBox(fulfill ? 'Mark as fulfilled? The user will see your message.' : 'Reject this request and return the coins?');
    if (!ok) return;
    setBusy(true);
    try {
      await rpc('mcp_admin_decide_redemption', { p_id: r.id, p_fulfill: fulfill, p_note: notes[r.id] || null, p_cost: cost });
      await load();
      onChanged();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  return (
    <View>
      <Text style={head}>🎟️ Ticket requests</Text>
      <Chips options={[{ key: 'pending', label: 'Pending' }, { key: 'fulfilled', label: 'Fulfilled' }, { key: 'rejected', label: 'Rejected' }]} value={status} onChange={setStatus} />
      {list.length === 0 ? <Text style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>Nothing here.</Text> : null}
      {list.map((r) => (
        <View key={r.id} style={box}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{r.name + ' (' + (r.email || '-') + ')'}</Text>
          <Text style={{ color: C.gold, fontSize: 13 }}>{r.reward_title + '  (🪙 ' + fmtNum(r.coins) + ')'}</Text>
          <Text style={{ color: '#ddd', fontSize: 12 }}>{'Movie: ' + r.movie_title}</Text>
          <Text style={{ color: '#ddd', fontSize: 12 }}>{'Place: ' + r.location}</Text>
          <Text selectable style={{ color: C.green, fontSize: 12 }}>{'Contact: ' + r.contact}</Text>
          {r.note ? <Text style={{ color: C.sub, fontSize: 11 }}>{'Note: ' + r.note}</Text> : null}
          <Text style={{ color: '#888', fontSize: 10, marginTop: 4 }}>
            {'Account age ' + r.account_age_days + ' days | Entries ' + r.total_entries + ' | Ad coins ' + fmtNum(r.ad_bonus_total) + ' | Referral coins ' + fmtNum(r.referral_total) + ' (' + r.friends_referred + ' friends) | ' + dateText(r.created_at)}
          </Text>
          {r.admin_note ? <Text style={{ color: C.sub, fontSize: 11 }}>{'Your message: ' + r.admin_note}</Text> : null}
          {status === 'pending' ? (
            <View style={{ marginTop: 8 }}>
              <Field label="Message to user (ticket code, booking link or reason)" value={notes[r.id] || ''} onChangeText={(v) => setNotes({ ...notes, [r.id]: v })} multiline autoCapitalize="sentences" maxLength={300} />
              <Field label="Ticket cost you paid (optional, used in Earnings)" value={costs[r.id] || ''} onChangeText={(v) => setCosts({ ...costs, [r.id]: v })} keyboardType="decimal-pad" maxLength={9} />
              <View style={{ flexDirection: 'row' }}>
                <Btn title="✅ Fulfilled" small color="#1b5e20" onPress={() => decide(r, true)} disabled={busy} style={{ marginRight: 8 }} />
                <Btn title="❌ Reject" small color="#b71c1c" onPress={() => decide(r, false)} disabled={busy} />
              </View>
            </View>
          ) : null}
        </View>
      ))}
      <Btn title="🔄 Refresh" color="#333" onPress={load} />
    </View>
  );
}
