// MCP v3 FINAL (APK build)
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { styles } from './styles';
import { C, notify, Btn, Tag, dateText } from './ui';
import { rpc, select, getUserId } from './api';
import { showRewardedAd } from './ads';
import AdBanner from './AdBanner';
import RedeemModal from './RedeemModal';
import { fmtNum } from './constants';

const statusColor = (s) => (s === 'fulfilled' ? '#1b5e20' : s === 'rejected' ? '#b71c1c' : '#8d6e00');
const kindText = { prize: 'Contest prize', ad_bonus: 'Ad bonus', welcome: 'Welcome bonus', referral: 'Referral bonus', referral_gift: 'Friend code gift', expire: 'Expired', redeem: 'Reward request', redeem_refund: 'Refund', admin_adjust: 'Adjustment' };

export default function CoinsTab({ coins, rewards, settings, onChanged }) {
  const [bonus, setBonus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reds, setReds] = useState([]);
  const [tx, setTx] = useState([]);
  const [pick, setPick] = useState(null);

  const load = useCallback(async () => {
    const uid = getUserId();
    if (!uid) return;
    try { setBonus(await rpc('mcp_bonus_status', {})); } catch (e) {}
    try { setReds((await select('mcp_redemptions', 'user_id=eq.' + uid + '&select=*&order=created_at.desc&limit=10')) || []); } catch (e) {}
    try { setTx((await select('mcp_tx', 'user_id=eq.' + uid + '&select=*&order=created_at.desc&limit=15')) || []); } catch (e) {}
  }, []);

  useEffect(() => { load(); }, [load, coins]);

  const watch = async () => {
    setBusy(true);
    try {
      const res = await showRewardedAd('Earn coins');
      if (res === 'dismissed') notify('Please watch the full ad to earn coins.');
      else if (res === 'unavailable') notify('No ad is available right now. Please try again in a moment.');
      else {
        const r = await rpc('mcp_claim_ad_bonus', {});
        notify('You earned ' + fmtNum(r.earned) + ' coins!');
        onChanged();
        load();
      }
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const st = settings || {};
  const expDays = Number(st.coin_expiry_days || 90);
  const rules =
    (expDays > 0 ? '• Coins expire ' + expDays + ' days after you earn them, so use them in time.' : '• Your coins do not expire.') +
    '\n• To redeem: your account must be ' + (st.redeem_min_account_days || 7) + '+ days old and you must have joined ' + (st.redeem_min_entries || 3) + '+ different movies.' +
    '\n• Limit: ' + (st.redeem_monthly_limit || 1) + ' reward per month.';

  return (
    <ScrollView style={styles.listSection} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: '#2a2208', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.gold, marginBottom: 12 }}>
        <Text style={{ color: C.sub, fontSize: 11 }}>YOUR COINS</Text>
        <Text style={{ color: C.gold, fontSize: 32, fontWeight: 'bold' }}>{'🪙 ' + fmtNum(coins)}</Text>
        <Text style={{ color: '#a89a5a', fontSize: 10, marginTop: 2 }}>Coins have no cash value and cannot be bought.</Text>
      </View>

      <View style={{ backgroundColor: C.card, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#282828' }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Earn coins</Text>
        <Text style={{ color: C.sub, fontSize: 12, marginVertical: 4 }}>
          {bonus ? 'Watch a short ad to get ' + fmtNum(bonus.coins) + ' coins. ' + bonus.left_today + ' of ' + bonus.cap + ' left today.' : 'Watch a short ad to earn coins.'}
        </Text>
        <Btn title={busy ? 'Please wait...' : '▶ Watch ad'} onPress={watch} disabled={busy || (bonus && bonus.left_today <= 0)} />
      </View>

      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 8 }}>🎟️ Rewards</Text>
      <View style={{ backgroundColor: '#161616', borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <Text style={{ color: C.sub, fontSize: 11, lineHeight: 17 }}>{rules}</Text>
      </View>
      {(rewards || []).map((r) => {
        const pct = Math.min(100, Math.floor((Number(coins) / Number(r.coins_cost)) * 100));
        const can = Number(coins) >= Number(r.coins_cost);
        return (
          <View key={r.id} style={{ backgroundColor: C.card, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#282828' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{r.title}</Text>
            <Text style={{ color: C.sub, fontSize: 11, marginVertical: 3 }}>{r.description}</Text>
            <Text style={{ color: C.gold, fontWeight: 'bold', fontSize: 13 }}>{'🪙 ' + fmtNum(r.coins_cost)}</Text>
            <View style={{ height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, marginVertical: 8 }}>
              <View style={{ height: 6, width: pct + '%', backgroundColor: can ? C.green : C.gold, borderRadius: 3 }} />
            </View>
            <Btn title={can ? 'Redeem' : fmtNum(Number(r.coins_cost) - Number(coins)) + ' more coins needed'} disabled={!can} onPress={() => setPick(r)} small />
          </View>
        );
      })}

      <AdBanner />

      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, marginTop: 8, marginBottom: 8 }}>My requests</Text>
      {reds.length === 0 ? <Text style={{ color: C.sub, fontSize: 12 }}>No requests yet.</Text> : null}
      {reds.map((x) => (
        <View key={x.id} style={{ backgroundColor: C.card, padding: 10, borderRadius: 8, marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 12, flex: 1 }}>{x.reward_title + ' - ' + x.movie_title}</Text>
            <Tag text={x.status.toUpperCase()} color={statusColor(x.status)} />
          </View>
          <Text style={{ color: '#666', fontSize: 10 }}>{dateText(x.created_at)}</Text>
          {x.admin_note ? <Text style={{ color: C.green, fontSize: 11, marginTop: 3 }}>{'Message from MCP: ' + x.admin_note}</Text> : null}
        </View>
      ))}

      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, marginTop: 12, marginBottom: 8 }}>Coin history</Text>
      {tx.length === 0 ? <Text style={{ color: C.sub, fontSize: 12 }}>No activity yet.</Text> : null}
      {tx.map((t) => (
        <View key={t.id} style={{ backgroundColor: C.card, padding: 10, borderRadius: 8, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 12 }}>{(kindText[t.kind] || t.kind) + (t.note ? ' - ' + t.note : '')}</Text>
            <Text style={{ color: '#666', fontSize: 10 }}>{dateText(t.created_at)}</Text>
          </View>
          <Text style={{ color: Number(t.amount) >= 0 ? C.green : '#ff5252', fontWeight: 'bold' }}>{(Number(t.amount) >= 0 ? '+' : '') + fmtNum(t.amount)}</Text>
        </View>
      ))}
      <View style={{ height: 40 }} />

      <RedeemModal
        visible={!!pick}
        reward={pick}
        coins={coins}
        onClose={() => setPick(null)}
        onDone={() => { setPick(null); onChanged(); load(); }}
      />
    </ScrollView>
  );
}
